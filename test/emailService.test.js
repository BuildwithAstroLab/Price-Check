const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
delete process.env.SMTP_HOST;
delete process.env.SMTP_PORT;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.EMAIL_FROM;

const {
  createRoleChangeEmailHtml,
  createRoleChangeEmailText,
  getSmtpConfiguration,
  sendRoleChangeEmail,
} = require("../lib/emailService");

test("role change email escapes dynamic HTML content", () => {
  const html = createRoleChangeEmailHtml({
    firstName: '<script>alert("x")</script>',
    previousRole: "Standard User",
    role: "<Admin>",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;Admin&gt;/);
  assert.match(html, /Previous role:/);
  assert.match(html, /New role:/);
});

test("role change email text includes the old and new role", () => {
  const text = createRoleChangeEmailText({
    firstName: "Alex",
    previousRole: "Standard User",
    role: "Analyst",
  });

  assert.match(text, /Previous role: Standard User/);
  assert.match(text, /New role: Analyst/);
  assert.match(text, /Review your account:/);
});

test("transactional role emails are skipped when SMTP is not configured", async () => {
  const result = await sendRoleChangeEmail({
    to: "user@example.com",
    firstName: "Alex",
    previousRole: "Standard User",
    role: "Analyst",
  });

  assert.equal(result.sent, false);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, "email-config-missing");
});

test("SMTP configuration uses TLS on port 465 and rejects blocked ports", () => {
  process.env.SMTP_HOST = "smtp.example.test";
  process.env.SMTP_PORT = "465";
  process.env.SMTP_USER = "test-user";
  process.env.SMTP_PASS = "test-password";
  process.env.EMAIL_FROM = "PriceCheck <mail@example.test>";

  assert.deepEqual(getSmtpConfiguration(), {
    host: "smtp.example.test",
    port: 465,
    secure: true,
    requireTLS: false,
    auth: { user: "test-user", pass: "test-password" },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  process.env.SMTP_PORT = "2525";
  assert.equal(getSmtpConfiguration().secure, false);
  assert.equal(getSmtpConfiguration().requireTLS, true);

  process.env.SMTP_PORT = "587";
  assert.throws(() => getSmtpConfiguration(), /other than 25 or 587/);
});
