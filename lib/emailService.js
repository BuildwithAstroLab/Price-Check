const { Resend } = require("resend");

const DEFAULT_EMAIL_FROM =
  process.env.EMAIL_FROM || "PriceCheck <admin.pricecheck@gmail.com>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3002";
}

function sanitizeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailTemplate(options = {}) {
  const {
    title = "PriceCheck",
    preheader = "",
    heading = "PriceCheck",
    bodyHtml,
    ctaText = "Continue",
    ctaUrl = getAppUrl(),
    footerText = "You are receiving this email because you signed up for PriceCheck.",
  } = options;

  const safeTitle = sanitizeHtml(title);
  const safeHeading = sanitizeHtml(heading);
  const safePreheader = sanitizeHtml(preheader);
  const safeBodyHtml = bodyHtml || "";
  const safeCtaText = sanitizeHtml(ctaText);
  const safeCtaUrl = sanitizeHtml(ctaUrl);
  const safeFooterText = sanitizeHtml(footerText);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${safePreheader}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f7fb;padding:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:24px 32px 16px;background:#0f172a;color:#ffffff;">
                    <div style="font-size:24px;font-weight:700;letter-spacing:-0.03em;">PriceCheck</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.2;color:#111827;">${safeHeading}</h1>
                    <div style="font-size:16px;line-height:1.7;color:#374151;">${safeBodyHtml}</div>
                    <div style="padding-top:24px;">
                      <a href="${safeCtaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;">${safeCtaText}</a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 24px;font-size:12px;line-height:1.6;color:#6b7280;">
                    ${safeFooterText}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function createWelcomeEmailHtml(firstName = "there") {
  const safeName = sanitizeHtml(firstName || "there");
  const appUrl = getAppUrl();
  return buildEmailTemplate({
    title: "Welcome to PriceCheck",
    preheader: "Your PriceCheck account is ready.",
    heading: `Welcome to PriceCheck, ${safeName}.`,
    bodyHtml: `
      <p>Your account is ready.</p>
      <p>PriceCheck helps you turn client briefs into clear, defensible project estimates so you can spend less time guessing what to charge.</p>
      <p>Start by creating your first Price Check and bring more clarity to every quote.</p>
    `,
    ctaText: "Create Your First Price Check",
    ctaUrl: `${appUrl}/estimate`,
    footerText:
      "PriceCheck • Helpful pricing guidance for freelancers and small service providers.",
  });
}

function createWelcomeEmailText(firstName = "there") {
  const name = String(firstName || "there").trim() || "there";
  const appUrl = getAppUrl();
  return [
    `Welcome to PriceCheck, ${name}.`,
    "Your account is ready.",
    "PriceCheck helps you turn client briefs into clear, defensible project estimates so you can spend less time guessing what to charge.",
    `Start by creating your first Price Check: ${appUrl}/estimate`,
  ].join("\n\n");
}

async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  category = "transactional",
}) {
  const client = getResendClient();
  const from = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;
  if (!client || !to || !subject) {
    return { sent: false, skipped: true, reason: "email-config-missing" };
  }

  const payload = {
    from,
    to: [to],
    subject,
    html,
    text,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  try {
    const response = await client.emails.send(payload);
    return {
      sent: true,
      skipped: false,
      providerMessageId: response?.id || null,
      providerResponse: response,
      category,
    };
  } catch (error) {
    console.warn("Email provider failure:", error?.message || error);
    return {
      sent: false,
      skipped: false,
      reason: "provider-error",
      providerError: error?.message || String(error),
      category,
    };
  }
}

async function sendWelcomeEmail(user) {
  if (!user?.email) {
    return { sent: false, skipped: true, reason: "missing-email" };
  }

  const firstName = String(user.name || user.email || "there")
    .split(" ")[0]
    .trim();
  const html = createWelcomeEmailHtml(firstName);
  const text = createWelcomeEmailText(firstName);

  return sendTransactionalEmail({
    to: user.email,
    subject: "Welcome to PriceCheck",
    html,
    text,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    category: "welcome",
  });
}

async function sendProductUpdateEmail({ to, firstName, subject, html, text }) {
  return sendTransactionalEmail({
    to,
    subject,
    html,
    text,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    category: "product_update",
  });
}

async function sendNewsletterEmail({
  to,
  subject,
  html,
  text,
  unsubscribeUrl,
}) {
  return sendTransactionalEmail({
    to,
    subject,
    html: `${html}<p><a href="${sanitizeHtml(unsubscribeUrl || getAppUrl())}">Unsubscribe</a></p>`,
    text: `${text}\n\nUnsubscribe: ${unsubscribeUrl || getAppUrl()}`,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    category: "newsletter",
  });
}

module.exports = {
  DEFAULT_EMAIL_FROM,
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendProductUpdateEmail,
  sendNewsletterEmail,
  getAppUrl,
  buildEmailTemplate,
  createWelcomeEmailHtml,
  createWelcomeEmailText,
};
