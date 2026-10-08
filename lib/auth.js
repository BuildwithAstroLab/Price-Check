const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const INACTIVITY_TIMEOUT_SECONDS = 30 * 60;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const sessionSecret = process.env.AUTH_SESSION_SECRET;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function isGoogleAuthConfigured() {
  return Boolean(
    googleClient &&
    typeof sessionSecret === "string" &&
    sessionSecret.length >= 32,
  );
}

function isSessionConfigured() {
  return typeof sessionSecret === "string" && sessionSecret.length >= 32;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value) {
  return crypto
    .createHmac("sha256", sessionSecret)
    .update(value)
    .digest("base64url");
}

function createSession(user) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = encode({
    ...user,
    exp: nowSeconds + SESSION_DURATION_SECONDS,
    lastActivity: nowSeconds,
  });
  return `${payload}.${sign(payload)}`;
}

function readSession(cookieHeader = "") {
  if (!isSessionConfigured()) return null;
  const value = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("pricecheck_session="))
    ?.slice("pricecheck_session=".length);
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!user.exp || user.exp < Math.floor(Date.now() / 1000)) return null;
    const lastActivitySeconds = Number(user.lastActivity || user.exp || 0);
    if (
      lastActivitySeconds + INACTIVITY_TIMEOUT_SECONDS <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      givenName: user.givenName || "",
      familyName: user.familyName || "",
      locale: user.locale || "",
      newsletterConsent: Boolean(user.newsletterConsent),
      isAdmin: Boolean(user.isAdmin),
      role: typeof user.role === "string" ? user.role : undefined,
      permissions: Array.isArray(user.permissions)
        ? user.permissions.filter(
            (permission) => typeof permission === "string",
          )
        : undefined,
      lastActivity: lastActivitySeconds,
    };
  } catch {
    return null;
  }
}

async function verifyGoogleCredential(credential) {
  if (!isGoogleAuthConfigured())
    throw new Error("Google sign-in is not configured.");
  if (typeof credential !== "string" || credential.length > 12000) {
    throw new Error("Invalid Google credential.");
  }
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error("Your Google account must have a verified email address.");
  }
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || "",
    givenName: payload.given_name || payload.name?.split(" ")[0] || "",
    familyName: payload.family_name || "",
    locale: payload.locale || "",
    newsletterConsent: false,
    isAdmin: false,
  };
}

function sessionCookie(value, maxAge = SESSION_DURATION_SECONDS) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `pricecheck_session=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function refreshSessionCookie(req, res, next) {
  const currentUser = readSession(req.get("cookie"));
  if (!currentUser) {
    return next();
  }

  const refreshedUser = {
    ...currentUser,
    lastActivity: Math.floor(Date.now() / 1000),
  };
  res.set(
    "Set-Cookie",
    sessionCookie(createSession(refreshedUser), INACTIVITY_TIMEOUT_SECONDS),
  );
  return next();
}

module.exports = {
  createSession,
  isGoogleAuthConfigured,
  isSessionConfigured,
  readSession,
  sessionCookie,
  refreshSessionCookie,
  verifyGoogleCredential,
  INACTIVITY_TIMEOUT_SECONDS,
};
