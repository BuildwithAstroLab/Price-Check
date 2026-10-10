const crypto = require("node:crypto");

function getUnsubscribeSecret() {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function createUnsubscribeToken(userId, campaignId) {
  const payload = Buffer.from(
    JSON.stringify({ userId: String(userId), campaignId: String(campaignId) }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getUnsubscribeSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyUnsubscribeToken(token) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  let expected;
  let data;
  try {
    expected = crypto
      .createHmac("sha256", getUnsubscribeSecret())
      .update(payload)
      .digest();
    const provided = Buffer.from(signature, "base64url");
    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return null;
    }
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof data?.userId !== "string" ||
    !data.userId ||
    typeof data?.campaignId !== "string" ||
    !data.campaignId
  ) {
    return null;
  }
  return data;
}

module.exports = { createUnsubscribeToken, verifyUnsubscribeToken };
