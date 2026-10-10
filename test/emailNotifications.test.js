const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.EMAIL_UNSUBSCRIBE_SECRET =
  process.env.EMAIL_UNSUBSCRIBE_SECRET || "unit-test-unsubscribe-secret-32-characters";

const {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} = require("../lib/emailNotifications");
const {
  createAccountStatusEmailHtml,
  createMarketingEmailHtml,
  createMarketingEmailText,
  createPrivilegedRoleChangeEmailHtml,
} = require("../lib/emailService");

test("marketing unsubscribe tokens bind a user and campaign and reject tampering", () => {
  const token = createUnsubscribeToken("user-123", "campaign-456");
  assert.deepEqual(verifyUnsubscribeToken(token), {
    userId: "user-123",
    campaignId: "campaign-456",
  });
  assert.equal(verifyUnsubscribeToken(`${token}x`), null);
  assert.equal(verifyUnsubscribeToken("not-a-token"), null);
});

test("privileged and account status notices escape user-controlled content", () => {
  const privileged = createPrivilegedRoleChangeEmailHtml({
    firstName: "Admin",
    targetEmail: '<img src=x onerror="alert(1)">',
    previousRole: "Standard User",
    role: "Super Admin",
  });
  assert.doesNotMatch(privileged, /<img src=x/);
  assert.match(privileged, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);

  const suspended = createAccountStatusEmailHtml({
    firstName: "<script>",
    reason: "<img src=x>",
  });
  assert.doesNotMatch(suspended, /<script>/);
  assert.doesNotMatch(suspended, /<img src=x>/);
  assert.match(suspended, /&lt;img src=x&gt;/);
});

test("promotional templates include the signed unsubscribe URL in HTML and text", () => {
  const unsubscribeUrl = "https://pricecheck.example/unsubscribe?token=abc.def";
  const html = createMarketingEmailHtml({
    subject: "Product news",
    bodyHtml: "<p>New features</p>",
    unsubscribeUrl,
  });
  const text = createMarketingEmailText({
    text: "New features",
    unsubscribeUrl,
  });
  assert.match(html, /Unsubscribe from promotional emails/);
  assert.match(html, /https:\/\/pricecheck\.example\/unsubscribe\?token=abc\.def/);
  assert.match(text, /Unsubscribe from promotional emails: https:\/\/pricecheck\.example/);
});
