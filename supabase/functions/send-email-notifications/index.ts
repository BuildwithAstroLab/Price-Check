import nodemailer from "npm:nodemailer@7.0.13";

type EmailEvent = {
  id: number;
  user_id: string;
  event_key: string;
  recipient_email: string | null;
  email_type: string;
  payload: {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    category?: string;
    reply_to?: string;
  };
  attempt_count: number;
};

const responseHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

async function supabaseRequest(
  url: string,
  serviceKey: string,
  endpoint: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${url}/rest/v1/${endpoint}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    throw new Error(`Supabase ${endpoint} returned ${response.status}: ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

async function finishEvent(
  url: string,
  serviceKey: string,
  eventId: number,
  result: "sent" | "skipped" | "failed",
  providerMessageId?: string,
  error?: string,
) {
  return supabaseRequest(url, serviceKey, "rpc/complete_email_event", {
    method: "POST",
    body: JSON.stringify({
      p_event_id: eventId,
      p_result: result,
      p_provider_message_id: providerMessageId || null,
      p_error: error || null,
    }),
  });
}

async function marketingIsEligible(
  url: string,
  serviceKey: string,
  userId: string,
) {
  const userRows = await supabaseRequest(
    url,
    serviceKey,
    `users?id=eq.${encodeURIComponent(userId)}&select=newsletter_consent,account_status&limit=1`,
  ) as Array<{ newsletter_consent: boolean; account_status: string }>;
  if (
    !userRows[0]?.newsletter_consent ||
    userRows[0].account_status !== "active"
  ) {
    return false;
  }

  const preferences = await supabaseRequest(
    url,
    serviceKey,
    `email_preferences?user_id=eq.${encodeURIComponent(userId)}&select=marketing_unsubscribed_at&limit=1`,
  ) as Array<{ marketing_unsubscribed_at: string | null }>;
  return !preferences[0]?.marketing_unsubscribed_at;
}

async function deliverEvent(
  url: string,
  serviceKey: string,
  transporter: ReturnType<typeof nodemailer.createTransport>,
  from: string,
  replyTo: string | undefined,
  event: EmailEvent,
) {
  if (!event.recipient_email || !event.payload?.subject || !event.payload?.html) {
    await finishEvent(url, serviceKey, event.id, "skipped", undefined, "Email payload is incomplete.");
    return "skipped" as const;
  }

  if (
    event.email_type === "marketing" &&
    !(await marketingIsEligible(url, serviceKey, event.user_id))
  ) {
    await finishEvent(url, serviceKey, event.id, "skipped");
    return "skipped" as const;
  }

  const messageIdDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(event.event_key),
  );
  const messageId = `<${Array.from(new Uint8Array(messageIdDigest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}@pricecheck>`;
  const result = await transporter.sendMail({
    from,
    to: event.recipient_email,
    subject: event.payload.subject,
    html: event.payload.html,
    text: event.payload.text || undefined,
    replyTo: event.payload.reply_to || replyTo || undefined,
    messageId,
  });
  if (!result.accepted.length || result.rejected.length) {
    throw new Error("SMTP server did not accept the notification recipient.");
  }

  await finishEvent(
    url,
    serviceKey,
    event.id,
    "sent",
    result.messageId || messageId,
  );
  return "sent" as const;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const smtpHost = Deno.env.get("SMTP_HOST")?.trim();
  const smtpUser = Deno.env.get("SMTP_USER")?.trim();
  const smtpPass = Deno.env.get("SMTP_PASS");
  const smtpPort = Number(Deno.env.get("SMTP_PORT") || "465");
  const from = Deno.env.get("EMAIL_FROM");
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") || undefined;
  if (
    !supabaseUrl ||
    !serviceKey ||
    !smtpHost ||
    !smtpUser ||
    !smtpPass ||
    !from?.trim() ||
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    smtpPort > 65535 ||
    [25, 587].includes(smtpPort)
  ) {
    console.error("SMTP notification worker configuration is incomplete or invalid.");
    return jsonResponse({ error: "Email delivery is not configured." }, 503);
  }

  if (request.headers.get("authorization") !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: "Service authorization required." }, 401);
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    requireTLS: smtpPort !== 465,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  const batch = await supabaseRequest(
    supabaseUrl,
    serviceKey,
    "rpc/claim_email_events",
    { method: "POST", body: JSON.stringify({ p_batch_size: 20 }) },
  ) as EmailEvent[];

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const event of batch) {
    try {
      const result = await deliverEvent(
        supabaseUrl,
        serviceKey,
        transporter,
        from,
        replyTo,
        event,
      );
      if (result === "sent") sent += 1;
      if (result === "skipped") skipped += 1;
      if (result === "failed") failed += 1;
    } catch (error) {
      failed += 1;
      await finishEvent(
        supabaseUrl,
        serviceKey,
        event.id,
        "failed",
        undefined,
        error instanceof Error ? error.message : "Unexpected delivery error.",
      );
    }
  }

  return jsonResponse({ processed: batch.length, sent, skipped, failed });
});
