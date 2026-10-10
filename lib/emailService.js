const nodemailer = require("nodemailer");

const DEFAULT_EMAIL_FROM =
  process.env.EMAIL_FROM || "PriceCheck <admin.pricecheck@gmail.com>";

function getSmtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const configured = Boolean(host || user || pass || process.env.EMAIL_FROM);
  if (!configured) return null;
  if (!host || !user || !pass || !process.env.EMAIL_FROM?.trim()) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM must all be configured.",
    );
  }

  const port = Number(process.env.SMTP_PORT || "465");
  if (!Number.isInteger(port) || port < 1 || port > 65535 || [25, 587].includes(port)) {
    throw new Error("SMTP_PORT must be a valid port other than 25 or 587.");
  }
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  };
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
                    ${safeCtaText ? `<div style="padding-top:24px;"><a href="${safeCtaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:700;">${safeCtaText}</a></div>` : ""}
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

function createRoleChangeEmailHtml({
  firstName = "there",
  previousRole,
  role,
}) {
  const appUrl = getAppUrl();
  return buildEmailTemplate({
    title: "Your PriceCheck access changed",
    preheader: "An administrator updated your PriceCheck account role.",
    heading: "Your account role was updated.",
    bodyHtml: `
      <p>Hello ${sanitizeHtml(firstName || "there")},</p>
      <p>A PriceCheck administrator changed the role on your account.</p>
      <p><strong>Previous role:</strong> ${sanitizeHtml(previousRole)}<br />
      <strong>New role:</strong> ${sanitizeHtml(role)}</p>
      <p>Your available workspace access may have changed. If you did not expect this update, reply to this email so we can help.</p>
    `,
    ctaText: "Review your account",
    ctaUrl: appUrl,
    footerText:
      "This account security notice was sent because your PriceCheck access changed.",
  });
}

function createRoleChangeEmailText({ firstName = "there", previousRole, role }) {
  const appUrl = getAppUrl();
  return [
    `Hello ${String(firstName || "there").trim() || "there"},`,
    "A PriceCheck administrator changed the role on your account.",
    `Previous role: ${String(previousRole || "Unknown")}`,
    `New role: ${String(role || "Unknown")}`,
    "Your available workspace access may have changed. If you did not expect this update, reply to this email so we can help.",
    `Review your account: ${appUrl}`,
  ].join("\n\n");
}

function createPrivilegedRoleChangeEmailHtml({
  firstName = "there",
  targetEmail,
  previousRole,
  role,
}) {
  const appUrl = getAppUrl();
  return buildEmailTemplate({
    title: "PriceCheck administrator access changed",
    preheader: "An administrator or Super Admin role changed.",
    heading: "Privileged access changed.",
    bodyHtml: `
      <p>Hello ${sanitizeHtml(firstName || "there")},</p>
      <p>An administrator changed the role for <strong>${sanitizeHtml(targetEmail)}</strong>.</p>
      <p><strong>Previous role:</strong> ${sanitizeHtml(previousRole)}<br />
      <strong>New role:</strong> ${sanitizeHtml(role)}</p>
      <p>If you did not expect this change, review the administrator access list and take appropriate action.</p>
    `,
    ctaText: "Review administrator access",
    ctaUrl: `${appUrl}/admin`,
    footerText:
      "This security notice was sent to administrators because privileged access changed.",
  });
}

function createPrivilegedRoleChangeEmailText({
  firstName = "there",
  targetEmail,
  previousRole,
  role,
}) {
  return [
    `Hello ${String(firstName || "there").trim() || "there"},`,
    `An administrator changed the role for ${String(targetEmail || "a user")}.`,
    `Previous role: ${String(previousRole || "Unknown")}`,
    `New role: ${String(role || "Unknown")}`,
    "Review the administrator access list and take appropriate action if you did not expect this change.",
    `Review administrator access: ${getAppUrl()}/admin`,
  ].join("\n\n");
}

function createAccountStatusEmailHtml({ firstName = "there", reason = "", restored = false }) {
  const safeName = sanitizeHtml(firstName || "there");
  const configuredReplyTo = process.env.EMAIL_REPLY_TO || DEFAULT_EMAIL_FROM;
  const supportEmail =
    configuredReplyTo.match(/<([^>]+)>/)?.[1] || configuredReplyTo;
  const body = restored
    ? "<p>Your PriceCheck account access has been restored. You can sign in and continue using your account.</p>"
    : `<p>Your PriceCheck account has been suspended by an administrator.</p>${reason ? `<p><strong>Reason:</strong> ${sanitizeHtml(reason)}</p>` : ""}<p>If you believe this is a mistake, reply to this email so we can help.</p>`;
  return buildEmailTemplate({
    title: restored ? "Your PriceCheck account was restored" : "Your PriceCheck account was suspended",
    preheader: restored ? "Your account access is restored." : "An administrator suspended your account.",
    heading: restored ? "Your account access is restored." : "Your account was suspended.",
    bodyHtml: `<p>Hello ${safeName},</p>${body}`,
    ctaText: restored ? "Sign in to PriceCheck" : "Contact support",
    ctaUrl: restored ? `${getAppUrl()}/login` : `mailto:${supportEmail}`,
    footerText: "This account security notice was sent because your account status changed.",
  });
}

function createAccountStatusEmailText({ firstName = "there", reason = "", restored = false }) {
  const lines = [
    `Hello ${String(firstName || "there").trim() || "there"},`,
    restored
      ? "Your PriceCheck account access has been restored. You can sign in and continue using your account."
      : "Your PriceCheck account has been suspended by an administrator.",
  ];
  if (!restored && reason) lines.push(`Reason: ${String(reason).trim()}`);
  if (!restored) {
    lines.push("If you believe this is a mistake, reply to this email so we can help.");
  }
  lines.push(
    restored
      ? `Sign in: ${getAppUrl()}/login`
      : `Contact support: ${process.env.EMAIL_REPLY_TO || DEFAULT_EMAIL_FROM}`,
  );
  return lines.join("\n\n");
}

function createMarketingEmailHtml({ subject, bodyHtml, unsubscribeUrl }) {
  const body = `${bodyHtml || ""}<p style="font-size:12px;color:#6b7280;"><a href="${sanitizeHtml(unsubscribeUrl)}">Unsubscribe from promotional emails</a></p>`;
  return buildEmailTemplate({
    title: subject || "PriceCheck updates",
    preheader: "A product update from PriceCheck.",
    heading: subject || "PriceCheck updates",
    bodyHtml: body,
    ctaText: "",
    ctaUrl: getAppUrl(),
    footerText:
      "You are receiving this promotional email because you opted in to PriceCheck updates.",
  });
}

function createMarketingEmailText({ text, unsubscribeUrl }) {
  return `${String(text || "").trim()}\n\nUnsubscribe from promotional emails: ${unsubscribeUrl}`;
}

async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  category = "transactional",
}) {
  if (!to || !subject) {
    return { sent: false, skipped: true, reason: "email-config-missing" };
  }
  try {
    const configuration = getSmtpConfiguration();
    if (!configuration) {
      return { sent: false, skipped: true, reason: "email-config-missing" };
    }
    const transporter = nodemailer.createTransport(configuration);
    const response = await transporter.sendMail({
      from: DEFAULT_EMAIL_FROM,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || undefined,
    });
    return {
      sent: true,
      skipped: false,
      providerMessageId: response.messageId || null,
      providerResponse: response,
      category,
    };
  } catch (error) {
    console.warn("SMTP delivery failure:", error?.message || error);
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

async function sendRoleChangeEmail({
  to,
  firstName,
  previousRole,
  role,
}) {
  return sendTransactionalEmail({
    to,
    subject: "Your PriceCheck access changed",
    html: createRoleChangeEmailHtml({ firstName, previousRole, role }),
    text: createRoleChangeEmailText({ firstName, previousRole, role }),
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    category: "role_change",
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
  getSmtpConfiguration,
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendRoleChangeEmail,
  sendProductUpdateEmail,
  sendNewsletterEmail,
  getAppUrl,
  buildEmailTemplate,
  createWelcomeEmailHtml,
  createWelcomeEmailText,
  createRoleChangeEmailHtml,
  createRoleChangeEmailText,
  createPrivilegedRoleChangeEmailHtml,
  createPrivilegedRoleChangeEmailText,
  createAccountStatusEmailHtml,
  createAccountStatusEmailText,
  createMarketingEmailHtml,
  createMarketingEmailText,
};
