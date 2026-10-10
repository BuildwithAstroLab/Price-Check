require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const os = require("os");
const path = require("path");

const { extractProjectDetails, generateAdvice } = require("./lib/geminiClient");
const {
  validateProjectData,
  validateAdviceData,
  createFallbackAdviceData,
  validateCurrency,
  convertPricingResult,
  validateSelections,
} = require("./lib/validateProjectData");
const { calculatePrice } = require("./lib/pricingEngine");
const { createEstimatePdf } = require("./lib/estimatePdf");
const { createInvoicePdf } = require("./lib/invoicePdf");
const { fallbackProjectData } = require("./lib/fallbackProjectData");
const {
  isSupabaseConfigured,
  deleteUserSheetRowsByEmail,
  savePricingFeedback,
  getPricingFeedback,
  deletePricingFeedback,
  saveAdminNotification,
  getAdminNotifications,
  deleteAdminNotifications,
  saveAuditLog,
  getAuditLogs,
  deleteAuditLogs,
  getUserRoles,
  getRegisteredUsers,
  getUserByEmail,
  getUserById,
  getEmailEvent,
  enqueueEmailEvent,
  enqueueEmailEvents,
  dispatchEmailNotifications,
  updateUserRoleWithNotifications,
  setUserSuspensionWithNotification,
  setMarketingConsent,
  unsubscribeEmailMarketing,
  getMarketingRecipients,
  getUserAccountStatus,
  getSupabaseClient,
  getSupabaseAuthConfig,
  savePricingConfig,
  getPricingConfigs,
  saveUser,
  getUserCount,
  getEstimateGenerationCount,
  getEstimateCategorySummary,
  recordEstimateGeneration,
  saveUserEstimate,
  getUserEstimates,
  deleteUserEstimate,
  deleteAllUserEstimates,
} = require("./lib/supabase");
const {
  createSession,
  isGoogleAuthConfigured,
  isSessionConfigured,
  readSession,
  sessionCookie,
  refreshSessionCookie,
  verifyGoogleCredential,
  INACTIVITY_TIMEOUT_SECONDS,
} = require("./lib/auth");
const {
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
  getAppUrl,
} = require("./lib/emailService");
const {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} = require("./lib/emailNotifications");

const app = express();
const PORT = process.env.PORT || 3000;
const localAdminNotifications = [];
const localAuditLogs = [];
const frontendNotificationTimes = new Map();
const activeUserSessions = new Map();
const ACTIVE_SESSION_TTL_MS = INACTIVITY_TIMEOUT_SECONDS * 1000;
const PROTECTED_ADMIN_EMAIL = "realemmy55@gmail.com";

function getAuthTestSettings() {
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalEnvironment = ["development", "test"].includes(
    String(process.env.NODE_ENV || "")
      .trim()
      .toLowerCase(),
  );
  const rawMode = String(process.env.AUTH_TEST_MODE || "").trim();
  const email = String(process.env.AUTH_TEST_EMAIL || "")
    .trim()
    .toLowerCase();
  const enabled =
    rawMode === "true" &&
    !isProduction &&
    isLocalEnvironment &&
    Boolean(email) &&
    email !== PROTECTED_ADMIN_EMAIL;
  return { enabled, email, isProduction };
}

function logAuthTest(message) {
  if (process.env.NODE_ENV === "production") return;
  console.info(message);
}

function canUseDesignatedTestAccount(email) {
  const settings = getAuthTestSettings();
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  return Boolean(
    settings.enabled &&
    process.env.NODE_ENV !== "production" &&
    normalized &&
    normalized === settings.email,
  );
}

function isAuthTestEmail(email) {
  const target = getAuthTestSettings();
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  return Boolean(target.enabled && normalized && normalized === target.email);
}

function validateRegistrationPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    return "Password must be between 8 and 128 characters.";
  }
  if (!/\p{L}/u.test(password)) return "Password must contain a letter.";
  if (!/\d/.test(password)) return "Password must contain a number.";
  if (!/[\p{P}\p{S}]/u.test(password)) {
    return "Password must contain a symbol.";
  }
  return "";
}

function markUserOnline(user) {
  if (!user?.email && !user?.id) return;
  const emailKey = String(user.email || "")
    .trim()
    .toLowerCase();
  const idKey = String(user.id || "").trim();
  const now = Date.now();
  if (emailKey) activeUserSessions.set(emailKey, now + ACTIVE_SESSION_TTL_MS);
  if (idKey) activeUserSessions.set(idKey, now + ACTIVE_SESSION_TTL_MS);
}

function isUserOnline(user) {
  if (!user) return false;
  const emailKey = String(user.email || "")
    .trim()
    .toLowerCase();
  const idKey = String(user.id || "").trim();
  const activeUntil =
    activeUserSessions.get(emailKey) ?? activeUserSessions.get(idKey) ?? 0;
  if (activeUntil > Date.now()) return true;

  const lastSeenAt = user.lastSeenAt || user.last_seen_at;
  if (!lastSeenAt) return false;
  const seenAt = Date.parse(lastSeenAt);
  if (!Number.isFinite(seenAt)) return false;
  return Date.now() - seenAt <= ACTIVE_SESSION_TTL_MS;
}

function recordAuditLog(entry) {
  const auditItem = {
    id: "audit_" + Math.random().toString(36).slice(2, 11),
    actor: String(entry.actor || "system").slice(0, 150),
    action: String(entry.action || "system.warning").slice(0, 80),
    severity: String(entry.severity || "info").toLowerCase(),
    description: String(entry.description || "No description provided.")
      .replace(
        /(?:key|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi,
        "$1=[redacted]",
      )
      .slice(0, 500),
    entity: String(entry.entity || "System").slice(0, 100),
    createdAt: entry.createdAt || new Date().toISOString(),
  };

  localAuditLogs.unshift(auditItem);
  if (localAuditLogs.length > 500) localAuditLogs.pop();

  if (isSupabaseConfigured()) {
    void saveAuditLog(auditItem).catch((err) => {
      console.warn("Audit log persistence failed:", err?.message || err);
    });
  }

  return auditItem;
}

function describeDatabaseError(error) {
  const message = String(error?.message || error || "Unknown database error");
  if (/fetch failed|network|timeout|econn|enotfound/i.test(message)) {
    return "Supabase was temporarily unreachable. The request will be retried automatically.";
  }
  if (/relation|table|column|schema|pgrst/i.test(message)) {
    return "Supabase schema is missing or out of date. Apply supabase/schema.sql.";
  }
  if (/jwt|apikey|permission|auth|401|403/i.test(message)) {
    return "Supabase rejected the server credentials or permissions.";
  }
  return message.slice(0, 500);
}

function recordAdminNotification(notification) {
  const safeNotification = {
    source: notification.source,
    severity: notification.severity || "error",
    title: String(notification.title || "Admin notification").slice(0, 120),
    message: String(notification.message || "No details provided.")
      .replace(
        /(?:key|token|secret|authorization)\s*[:=]\s*[^\s,;]+/gi,
        "$1=[redacted]",
      )
      .slice(0, 500),
    path:
      typeof notification.path === "string"
        ? notification.path.slice(0, 160)
        : null,
    createdAt: new Date().toISOString(),
  };
  localAdminNotifications.unshift(safeNotification);
  if (localAdminNotifications.length > 200) localAdminNotifications.pop();

  recordAuditLog({
    actor: notification.actor || "system",
    action:
      notification.action ||
      (notification.source
        ? `${notification.source}.${notification.severity || "warning"}`
        : "system.warning"),
    severity:
      notification.severity === "error" || notification.severity === "critical"
        ? "critical"
        : notification.severity || "warning",
    description: `${safeNotification.title}: ${safeNotification.message}`,
    entity: notification.path || notification.source || "System",
    createdAt: safeNotification.createdAt,
  });

  if (isSupabaseConfigured()) {
    void saveAdminNotification(safeNotification).catch((error) => {
      console.warn(
        "Admin notification persistence failed:",
        error?.message || error,
      );
    });
  }
}

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "4kb" }));
app.post("/api/notifications/frontend", (req, res) => {
  const clientKey = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  if (now - (frontendNotificationTimes.get(clientKey) || 0) < 30000) {
    return res.status(202).json({ accepted: false });
  }
  frontendNotificationTimes.set(clientKey, now);
  recordAdminNotification({
    source: "frontend",
    severity: req.body?.severity,
    title: req.body?.title || "Frontend error",
    message: req.body?.message || "The frontend reported an error.",
    path: req.body?.path,
  });
  return res.status(202).json({ accepted: true });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.get("/how-it-works", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "how-it-works.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});
app.get("/assets/google-icon.png", (req, res) => {
  res.sendFile(path.join(__dirname, "asset", "google (1).png"));
});
app.use(refreshSessionCookie);
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/auth/config", (req, res) => {
  const passwordAuth = getSupabaseAuthConfig();
  const testSettings = getAuthTestSettings();
  res.set("Cache-Control", "no-store");
  return res.json({
    enabled: isGoogleAuthConfigured() && isSupabaseConfigured(),
    clientId:
      isGoogleAuthConfigured() && isSupabaseConfigured()
        ? process.env.GOOGLE_CLIENT_ID
        : null,
    passwordEnabled: Boolean(
      isSessionConfigured() &&
      passwordAuth.url &&
      passwordAuth.anonKey &&
      isSupabaseConfigured(),
    ),
    testModeEnabled: Boolean(testSettings.enabled),
  });
});

async function requestSupabaseAuth(endpoint, body) {
  const { url, anonKey } = getSupabaseAuthConfig();
  if (!url || !anonKey || !isSupabaseConfigured() || !isSessionConfigured()) {
    const error = new Error("Email sign-in is not configured.");
    error.code = "auth_not_configured";
    throw error;
  }

  const response = await fetch(`${url}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {}
  if (!response.ok) {
    const error = new Error(
      payload.msg ||
        payload.message ||
        payload.error_description ||
        "Authentication failed.",
    );
    error.status = response.status;
    error.code = payload.code || payload.error_code || payload.error || "";
    const retryAfterHeader = Number(response.headers.get("Retry-After"));
    const retryAfterFromMessage = getRetryAfterSeconds(error.message);
    if (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0) {
      error.retryAfterSeconds = Math.ceil(retryAfterHeader);
    } else if (retryAfterFromMessage) {
      error.retryAfterSeconds = retryAfterFromMessage;
    }
    throw error;
  }
  return payload;
}

function getRetryAfterSeconds(message) {
  const match = String(message || "").match(
    /(?:retry\s+after|wait|after|in)\s+(\d+)\s*(?:seconds?|secs?|s)\b/i,
  );
  if (!match) return null;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.min(seconds, 3600)
    : null;
}

function getSafeAuthError(error, context) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("email is not confirmed")
  ) {
    return {
      status: 401,
      message: "Check your inbox and confirm your email before signing in.",
    };
  }
  if (
    (context === "signup" &&
      ["signup_disabled", "signups_disabled"].includes(code)) ||
    message.includes("signups not allowed") ||
    message.includes("signup is disabled")
  ) {
    return {
      status: 503,
      message:
        "Email sign-up is currently disabled. Contact support or use Google sign-in.",
    };
  }
  if (code === "email_provider_disabled") {
    return {
      status: 503,
      message:
        "Email/password authentication is currently disabled. Contact support or use Google sign-in.",
    };
  }
  if (
    code === "auth_not_configured" ||
    message.includes("email sign-in is not configured")
  ) {
    return {
      status: 503,
      message: "Email sign-in is not configured for this environment.",
    };
  }
  if (
    context === "signup" &&
    (["user_already_exists", "email_exists", "user_exists"].includes(code) ||
      /already registered|already exists|user already/i.test(message))
  ) {
    return {
      status: 409,
      message:
        "An account with this email already exists. Try signing in instead.",
    };
  }
  if (context === "verify") {
    if (
      error?.status === 429 ||
      [
        "over_request_rate_limit",
        "over_email_send_rate_limit",
        "over_sms_send_rate_limit",
      ].includes(code) ||
      /too many.*attempt|rate limit|too_many|for security purposes|only request this after/i.test(
        message,
      )
    ) {
      return {
        status: 429,
        message:
          "Supabase is temporarily limiting verification requests. Wait for the countdown before trying again.",
        retryAfterSeconds: error.retryAfterSeconds || 60,
      };
    }
    if (
      code === "otp_expired" ||
      message.includes("otp expired") ||
      message.includes("has expired") ||
      /expired.*verification|verification.*expired/i.test(message)
    ) {
      return {
        status: 400,
        message: "That code has expired. Request a new verification code.",
      };
    }
    if (
      code === "invalid_otp" ||
      message.includes("invalid or has expired") ||
      message.includes("invalid otp") ||
      /invalid.*verification|incorrect.*code|code.*incorrect|verification code.*invalid/i.test(
        message,
      )
    ) {
      return {
        status: 400,
        message:
          "That code was not accepted. Check that it is the newest code in your inbox and try again.",
      };
    }
    return {
      status: 400,
      message:
        "That code was not accepted. Check that it is the newest code in your inbox and try again.",
    };
  }
  if (
    context === "password" &&
    (["invalid_credentials", "invalid_grant", "user_not_found"].includes(
      code,
    ) ||
      message.includes("invalid login credentials"))
  ) {
    return {
      status: 401,
      message: "Please check your email and password.",
    };
  }
  if (context === "signup" && [400, 422].includes(error?.status)) {
    const text = String(error?.message || "").trim();
    if (
      text &&
      !/authentication failed|temporarily unavailable|not configured/i.test(
        text,
      )
    ) {
      return {
        status: 400,
        message: text
          .replace(/\s+/g, " ")
          .replace(/^\s*[-:]+\s*/, "")
          .replace(/\bemail address\b/i, "Email address")
          .replace(/\bpassword\b/i, "password")
          .slice(0, 180),
      };
    }
    return {
      status: 400,
      message:
        "We couldn't create that account. Check your details and try again.",
    };
  }
  if (error?.status === 429 || code === "over_request_rate_limit") {
    return {
      status: 200,
      message:
        context === "signup"
          ? "Account creation was accepted. Please continue with the verification code."
          : "Sign-in request accepted. Please try again if needed.",
    };
  }
  return {
    status: 503,
    message:
      context === "signup"
        ? "Email sign-up is temporarily unavailable. Please try again."
        : "Email sign-in is temporarily unavailable. Please try again.",
  };
}

function getAuthRedirectUrl(req) {
  const configuredRedirect = process.env.SUPABASE_AUTH_REDIRECT_URL;
  if (configuredRedirect) return configuredRedirect;
  const host = req.get("host");
  if (!host) return null;
  const protocol = req.protocol || "http";
  return `${protocol}://${host}/login`;
}

function isVerifiedAuthUser(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

async function triggerWelcomeEmailIfNeeded(authUser, user) {
  if (!user?.email || !user?.id) return { sent: false, skipped: true };
  try {
    const existingEvent = await getEmailEvent(user.id, "welcome");
    if (
      existingEvent &&
      ["queued", "processing", "sent"].includes(existingEvent.status)
    ) {
      return { sent: false, skipped: true, reason: "already-sent" };
    }
  } catch (error) {
    console.error(
      "Welcome email deduplication lookup failed:",
      error?.message || error,
    );
  }

  try {
    const firstName = String(
      user.name || authUser?.user_metadata?.full_name || user.email,
    )
      .trim()
      .split(/\s+/)[0];
    await enqueueEmailNotification({
      userId: user.id,
      emailType: "welcome",
      eventKey: `welcome:${user.id}`,
      recipientEmail: user.email,
      payload: {
        subject: "Welcome to PriceCheck",
        html: createWelcomeEmailHtml(firstName),
        text: createWelcomeEmailText(firstName),
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      },
    });
  } catch (error) {
    console.error(
      "Welcome email could not be queued:",
      error?.message || error,
    );
    return { sent: false, skipped: false, reason: "queue-error" };
  }

  return { sent: false, skipped: false, queued: true };
}

async function enqueueEmailNotification({
  userId,
  emailType,
  eventKey,
  recipientEmail,
  payload,
  dispatch = true,
}) {
  const event = await enqueueEmailEvent({
    userId,
    emailType,
    eventKey,
    recipientEmail,
    payload,
  });
  if (dispatch && process.env.NODE_ENV !== "test") {
    void dispatchEmailNotifications().catch((error) => {
      console.warn(
        "Email notification dispatch deferred to the retry worker:",
        error?.message || error,
      );
    });
  }
  return event;
}

async function cleanupTargetUserRecords(targetEmail, userIds = []) {
  const normalizedEmail = String(targetEmail || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail || normalizedEmail === PROTECTED_ADMIN_EMAIL) {
    throw new Error("The requested account is not eligible for test cleanup.");
  }
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase service client is unavailable.");
  const { data: profileRows, error: profilesError } = await supabase
    .from("users")
    .select("id,email")
    .eq("email", normalizedEmail);
  if (profilesError) throw profilesError;
  const profileIds = (profileRows || [])
    .filter(
      (profile) =>
        String(profile.email || "")
          .trim()
          .toLowerCase() === normalizedEmail,
    )
    .map((profile) => String(profile.id || "").trim())
    .filter(Boolean);
  const identities = Array.from(
    new Set(
      [...userIds, ...profileIds, normalizedEmail]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

  const { data: estimates, error: estimateReadError } = await supabase
    .from("user_estimates")
    .select("id")
    .in("user_id", identities);
  if (estimateReadError) throw estimateReadError;
  const estimateIds = (estimates || []).map((row) => row.id);

  const eventQueries = [
    supabase
      .from("estimate_generation_events")
      .select("id")
      .in("user_id", identities),
  ];
  if (estimateIds.length) {
    eventQueries.push(
      supabase
        .from("estimate_generation_events")
        .select("id")
        .in("source_estimate_id", estimateIds),
    );
  }
  const eventResults = await Promise.all(eventQueries);
  for (const result of eventResults) {
    if (result.error) throw result.error;
  }
  const eventIds = Array.from(
    new Set(
      eventResults.flatMap((result) => result.data || []).map((row) => row.id),
    ),
  );

  if (estimateIds.length) {
    const { error } = await supabase
      .from("user_estimates")
      .delete()
      .in("id", estimateIds);
    if (error) throw error;
  }
  if (eventIds.length) {
    const { error } = await supabase
      .from("estimate_generation_events")
      .delete()
      .in("id", eventIds);
    if (error) throw error;
  }

  const relatedDeletes = [
    supabase.from("user_roles").delete().in("user_id", identities),
    supabase.from("audit_logs").delete().in("actor", identities),
  ];
  if (profileIds.length) {
    relatedDeletes.push(supabase.from("users").delete().in("id", profileIds));
  }
  const relatedResults = await Promise.all(relatedDeletes);
  for (const result of relatedResults) {
    if (result.error) throw result.error;
  }

  const { error: emailEventsError } = await supabase
    .from("email_events")
    .delete()
    .in("user_id", identities);
  if (
    emailEventsError &&
    !(
      emailEventsError.code === "PGRST205" &&
      /email_events/i.test(String(emailEventsError.message || ""))
    )
  ) {
    throw emailEventsError;
  }
  deleteUserSheetRowsByEmail(normalizedEmail);
  return { profileIds, estimateIds, eventIds };
}

async function resetTestAuthAccount(requestedEmail) {
  const settings = getAuthTestSettings();
  const normalizedEmail = String(requestedEmail || "")
    .trim()
    .toLowerCase();
  if (
    !settings.enabled ||
    settings.isProduction ||
    normalizedEmail !== settings.email ||
    normalizedEmail === PROTECTED_ADMIN_EMAIL
  ) {
    throw new Error("The requested account is not eligible for test cleanup.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase service client is unavailable.");

  logAuthTest("[AUTH TEST] Test account detected");
  logAuthTest("[AUTH TEST] Resetting designated test account");
  const matchingUsers = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    matchingUsers.push(
      ...(data.users || []).filter(
        (user) =>
          String(user.email || "")
            .trim()
            .toLowerCase() === normalizedEmail,
      ),
    );
    if (!data.users || data.users.length < 1000) break;
  }
  if (matchingUsers.length > 1) {
    throw new Error("Multiple Auth users matched the designated test email.");
  }
  const targetUser = matchingUsers[0] || null;

  logAuthTest(
    `[AUTH TEST] existing test Auth user found: ${String(Boolean(targetUser))}`,
  );
  if (targetUser?.id) {
    logAuthTest("[AUTH TEST] reset attempted: true");
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
      targetUser.id,
    );
    if (deleteAuthError) throw deleteAuthError;
  } else {
    logAuthTest("[AUTH TEST] reset attempted: false");
  }
  const cleaned = await cleanupTargetUserRecords(
    normalizedEmail,
    targetUser?.id ? [targetUser.id] : [],
  );
  logAuthTest("[AUTH TEST] reset result: success");
  logAuthTest("[AUTH TEST] Test account reset complete");
  return {
    reset: Boolean(targetUser),
    userId: targetUser?.id || null,
    ...cleaned,
  };
}

async function finishPasswordSignIn(authUser, res) {
  if (!authUser?.id || !authUser.email || !isVerifiedAuthUser(authUser)) {
    return res.status(401).json({
      error: "Confirm your email before signing in.",
    });
  }

  const existingProfile = await getUserByEmail(authUser.email);
  if (existingProfile?.account_status === "suspended") {
    return res.status(403).json({
      error: "This account is suspended. Contact support for help.",
      code: "ACCOUNT_SUSPENDED",
    });
  }
  const newsletterConsent = Boolean(
    existingProfile?.newsletter_consent ??
    authUser.user_metadata?.newsletter_consent ??
    false,
  );
  const user = {
    id: existingProfile?.id || authUser.id,
    email: authUser.email,
    name:
      existingProfile?.name ||
      authUser.user_metadata?.full_name ||
      authUser.email.split("@")[0],
    skillWork:
      existingProfile?.skill_work || authUser.user_metadata?.skill_work || "",
    picture: existingProfile?.picture || "",
    givenName: "",
    familyName: "",
    locale: "",
    newsletterConsent,
    isAdmin: false,
  };
  markUserOnline(user);
  await saveUser(user);
  if (!existingProfile?.id && newsletterConsent) {
    await setMarketingConsent(user.id, true);
  }
  try {
    await triggerWelcomeEmailIfNeeded(authUser, user);
  } catch (error) {
    console.warn("Welcome email trigger failed:", error?.message || error);
  }
  const authenticatedUser = await hydrateUserFromDatabase(user);
  res.set("Cache-Control", "no-store");
  res.set("Set-Cookie", sessionCookie(createSession(authenticatedUser)));
  return res.status(200).json({ user: authenticatedUser });
}

app.post("/api/auth/signup", async (req, res) => {
  const name = String(req.body?.name || "")
    .trim()
    .slice(0, 100);
  const skillWork = String(req.body?.skillWork || req.body?.skill_work || "")
    .trim()
    .slice(0, 120);
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = req.body?.password;
  const productUpdates = Boolean(req.body?.productUpdates === true);
  const authTestSettings = getAuthTestSettings();
  const emailMatchesDesignatedTest = isAuthTestEmail(email);

  logAuthTest("[AUTH TEST] signup request received");
  logAuthTest(
    `[AUTH TEST] email matches designated test email: ${String(emailMatchesDesignatedTest)}`,
  );
  logAuthTest(
    `[AUTH TEST] test mode enabled: ${String(authTestSettings.enabled)}`,
  );
  logAuthTest(
    `[AUTH TEST] production environment: ${String(process.env.NODE_ENV === "production")}`,
  );

  const passwordError = validateRegistrationPassword(password);
  if (
    !name ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    passwordError
  ) {
    return res.status(400).json({
      error: !name
        ? "Enter your full name."
        : !email ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          ? "Enter a valid email address."
          : passwordError,
    });
  }

  const resetAttempted = Boolean(
    authTestSettings.enabled &&
    process.env.NODE_ENV !== "production" &&
    emailMatchesDesignatedTest,
  );
  logAuthTest(`[AUTH TEST] reset attempted: ${String(resetAttempted)}`);

  if (canUseDesignatedTestAccount(email)) {
    try {
      await resetTestAuthAccount(email);
    } catch {
      logAuthTest("[AUTH TEST] reset result: failure");
      return res.status(503).json({
        error: "Unable to reset the OTP test account.",
      });
    }
    logAuthTest("[AUTH TEST] Creating fresh test account");
  }

  logAuthTest("[AUTH TEST] calling Supabase signup");

  try {
    const signupResponse = await requestSupabaseAuth("signup", {
      email,
      password,
      data: {
        full_name: name,
        skill_work: skillWork || "",
        newsletter_consent: productUpdates,
      },
    });
    const user = signupResponse.user || signupResponse;
    if (Array.isArray(user?.identities) && user.identities.length === 0) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }
    if (user?.id && isVerifiedAuthUser(user)) {
      return finishPasswordSignIn(user, res);
    }

    logAuthTest("[AUTH TEST] Waiting for OTP verification");
    res.set("Cache-Control", "no-store");
    return res.status(202).json({
      email,
      message: `Account created. Enter the 6-digit verification code sent to ${email}.`,
    });
  } catch (error) {
    console.warn("Email signup failed:", error?.message || error);
    const mappedError = getSafeAuthError(error, "signup");
    return res.status(mappedError.status).json({ error: mappedError.message });
  }
});

app.post("/api/auth/password", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = req.body?.password;
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== "string" ||
    password.length > 128
  ) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }

  try {
    const { user } = await requestSupabaseAuth("token?grant_type=password", {
      email,
      password,
    });
    return await finishPasswordSignIn(user, res);
  } catch (error) {
    console.warn("Email sign-in failed:", error?.message || error);
    const mappedError = getSafeAuthError(error, "password");
    return res.status(mappedError.status).json({ error: mappedError.message });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const token = String(req.body?.token || "").trim();
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{6}$/.test(token)
  ) {
    return res.status(400).json({
      error: "Enter the 6-digit verification code sent to your email.",
    });
  }

  try {
    const { user } = await requestSupabaseAuth("verify", {
      type: "email",
      token,
      email,
    });
    return await finishPasswordSignIn(user, res);
  } catch (error) {
    console.warn("Email verification failed:", error?.message || error);
    const mappedError = getSafeAuthError(error, "verify");
    return res.status(mappedError.status).json({
      error: mappedError.message,
      ...(mappedError.retryAfterSeconds
        ? { retryAfterSeconds: mappedError.retryAfterSeconds }
        : {}),
    });
  }
});

app.post("/api/auth/resend-otp", async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  try {
    await requestSupabaseAuth("resend", { type: "signup", email });
    return res.status(200).json({
      email,
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.warn("OTP resend failed:", error?.message || error);
    const mappedError = getSafeAuthError(error, "verify");
    return res.status(mappedError.status).json({
      error: mappedError.message,
      ...(mappedError.retryAfterSeconds
        ? { retryAfterSeconds: mappedError.retryAfterSeconds }
        : {}),
    });
  }
});

app.get("/api/auth/session", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const user = readSession(req.get("cookie"));
  if (!user) return res.json({ user: null });
  try {
    const freshUser = await hydrateUserFromDatabase(user);
    if (freshUser) {
      res.set("Set-Cookie", sessionCookie(createSession(freshUser)));
    }
    return res.json({ user: freshUser || user });
  } catch (error) {
    if (error?.code === "account_suspended") {
      res.set("Set-Cookie", sessionCookie("", 0));
      return res.status(403).json({
        error: "This account is suspended. Contact support for help.",
        code: "ACCOUNT_SUSPENDED",
      });
    }
    console.error("Session role refresh failed:", error?.message || error);
    return res.status(503).json({ error: "User role storage is unavailable." });
  }
});

app.post("/api/auth/google", async (req, res) => {
  let credentialVerified = false;
  try {
    const user = await verifyGoogleCredential(req.body?.credential);
    credentialVerified = true;
    const existingProfile = await getUserByEmail(user.email);
    if (existingProfile?.id) {
      if (existingProfile.account_status === "suspended") {
        return res.status(403).json({
          error: "This account is suspended. Contact support for help.",
          code: "ACCOUNT_SUSPENDED",
        });
      }
      user.id = existingProfile.id;
      user.name = existingProfile.name || user.name;
      user.skillWork = existingProfile.skill_work || "";
      user.picture = existingProfile.picture || user.picture;
      user.newsletterConsent = Boolean(existingProfile.newsletter_consent);
    }
    markUserOnline(user);
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase profile and role storage is not configured.");
    }
    await saveUser(user);
    if (!existingProfile?.id) {
      try {
        await triggerWelcomeEmailIfNeeded(user, user);
      } catch (error) {
        console.warn("Welcome email trigger failed:", error?.message || error);
      }
    }
    const authenticatedUser = await hydrateUserFromDatabase(user);
    res.set("Cache-Control", "no-store");
    res.set("Set-Cookie", sessionCookie(createSession(authenticatedUser)));
    return res.status(200).json({ user: authenticatedUser });
  } catch (error) {
    console.warn("Google sign-in failed:", error?.message || error);
    return res.status(credentialVerified ? 503 : 401).json({
      error: credentialVerified
        ? "Your account role could not be persisted. Please try again."
        : "Google sign-in could not be verified.",
    });
  }
});

app.post("/api/auth/signout", (req, res) => {
  const user = readSession(req.get("cookie"));
  if (user?.email)
    activeUserSessions.delete(String(user.email).trim().toLowerCase());
  if (user?.id) activeUserSessions.delete(String(user.id).trim());
  res.set("Cache-Control", "no-store");
  res.set("Set-Cookie", sessionCookie("", 0));
  return res.status(204).end();
});

app.post("/api/account/profile", async (req, res) => {
  const currentUser = readSession(req.get("cookie"));
  if (!currentUser) {
    return res.status(401).json({ error: "Sign in to update your profile." });
  }

  const email = String(req.body?.email ?? currentUser.email ?? "")
    .trim()
    .toLowerCase();
  const newsletterConsent = req.body?.newsletterConsent === true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }

  const skillWork = String(req.body?.skillWork || req.body?.skill_work || "")
    .trim()
    .slice(0, 120);

  const updatedUser = {
    ...currentUser,
    email,
    newsletterConsent,
    skillWork: skillWork || currentUser.skillWork || "",
    name: currentUser.name || email.split("@")[0],
  };

  if (!isSupabaseConfigured()) {
    return res
      .status(503)
      .json({ error: "Account storage is not configured." });
  }

  try {
    if ((await getUserAccountStatus(currentUser.id)) === "suspended") {
      res.set("Set-Cookie", sessionCookie("", 0));
      return res.status(403).json({
        error: "This account is suspended. Contact support for help.",
        code: "ACCOUNT_SUSPENDED",
      });
    }
    await saveUser(updatedUser);
    await setMarketingConsent(updatedUser.id, newsletterConsent);
    const authenticatedUser = await hydrateUserFromDatabase(updatedUser);
    markUserOnline(authenticatedUser);
    res.set("Cache-Control", "no-store");
    res.set("Set-Cookie", sessionCookie(createSession(authenticatedUser)));
    return res.status(200).json({ user: authenticatedUser });
  } catch (error) {
    console.warn("Account profile update failed:", error?.message || error);
    return res
      .status(503)
      .json({ error: "Your account profile could not be persisted." });
  }
});

async function getAuthenticatedUser(req, res) {
  const user = readSession(req.get("cookie"));
  if (!user) {
    res.status(401).json({ error: "Sign in to access saved estimates." });
    return null;
  }
  if (!isSupabaseConfigured()) {
    res.status(503).json({ error: "Account storage is not configured." });
    return null;
  }
  try {
    if ((await getUserAccountStatus(user.id)) === "suspended") {
      res.set("Set-Cookie", sessionCookie("", 0));
      res.status(403).json({
        error: "This account is suspended. Contact support for help.",
        code: "ACCOUNT_SUSPENDED",
      });
      return null;
    }
  } catch (error) {
    console.error("Account status lookup failed:", error?.message || error);
    res.status(503).json({ error: "User account storage is unavailable." });
    return null;
  }
  return user;
}

app.get("/api/account/estimates", async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  try {
    const estimates = await getUserEstimates(user.id);
    return res.json({
      estimates: estimates.map((estimate) => ({
        id: String(estimate.id),
        createdAt: estimate.created_at,
        result: {
          ...estimate.result,
          sourceDescription: estimate.source_description,
          sourceDeliverables: estimate.source_deliverables,
        },
      })),
    });
  } catch (error) {
    console.error("Account estimate load failed:", error?.message || error);
    return res
      .status(503)
      .json({ error: "Saved estimates are temporarily unavailable." });
  }
});

app.delete("/api/account/estimates", async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  if (!user) return;
  try {
    await deleteAllUserEstimates(user.id);
    return res.status(204).end();
  } catch (error) {
    console.error("Account estimate deletion failed:", error?.message || error);
    return res
      .status(503)
      .json({ error: "Saved estimates are temporarily unavailable." });
  }
});

app.delete("/api/account/estimates/:estimateId", async (req, res) => {
  const user = await getAuthenticatedUser(req, res);
  const estimateId = Number(req.params.estimateId);
  if (!user) return;
  if (!Number.isSafeInteger(estimateId) || estimateId < 1) {
    return res.status(400).json({ error: "Invalid saved estimate." });
  }
  try {
    const deleted = await deleteUserEstimate(user.id, estimateId);
    return res.status(deleted ? 204 : 404).end();
  } catch (error) {
    console.error("Account estimate deletion failed:", error?.message || error);
    return res
      .status(503)
      .json({ error: "Saved estimates are temporarily unavailable." });
  }
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/estimate", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CACHED_ESTIMATES = 50;
const UNSAFE_PROMPT_PATTERNS = [
  /\b(?:kill|killing|murder|murdering|assault|assassinate|bomb|bombing|terror(?:ism|ist)?|shooting|stab|stabbing|torture|poison|rape|虐待|殺す|爆弾|テロ)\b/i,
  /\bshoot\s+(?:someone|somebody|a person|people|civilians|victims|the crowd)\b/i,
  /\b(?:weapon|weapons|firearm|firearms|gun|guns|explosive|explosives|knife|knives|drug|drugs|meth|cocaine|heroin)\b/i,
  /\b(?:hate|hateful|genocide|ethnic cleansing|suicide|self[- ]harm)\b/i,
  /\b(?:organ trafficking|organ theft|harvest organs?|sell organs?|buy organs?|remove organs? from (?:someone|somebody|a person|people))\b/i,
];
const estimateCache = new Map();
const inFlightEstimates = new Map();
const progressClients = new Map();
const pricingFeedback = [];
const MAX_FEEDBACK_ITEMS = 1000;

async function persistEstimateForUser(user, result, description, deliverables) {
  if (!user || !isSupabaseConfigured()) return;
  try {
    await saveUser(user);
    await saveUserEstimate(user, {
      result,
      sourceDescription: description,
      sourceDeliverables: deliverables.join(", "),
    });
  } catch (error) {
    console.error(
      "Account estimate persistence failed:",
      error?.message || error,
    );
  }
}

async function recordEstimateGenerationSafely(user) {
  if (!isSupabaseConfigured()) return;
  try {
    await recordEstimateGeneration(user?.id || null);
  } catch (error) {
    console.error(
      "Estimate generation analytics persistence failed:",
      error?.message || error,
    );
  }
}

function sendProgress(progressId, progress, phase) {
  const client = progressClients.get(progressId);
  if (!client) return;
  client.write(`data: ${JSON.stringify({ progress, phase })}\n\n`);
}

function closeProgress(progressId) {
  const client = progressClients.get(progressId);
  if (!client) return;
  client.end();
  progressClients.delete(progressId);
}

app.get("/api/pricecheck/progress/:progressId", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  progressClients.set(req.params.progressId, res);
  sendProgress(req.params.progressId, 5, "Starting");
  req.on("close", () => progressClients.delete(req.params.progressId));
});

function createEstimateCacheKey({
  description,
  deliverables,
  selections,
  currency,
}) {
  return JSON.stringify({
    description: description.replace(/\s+/g, " ").trim().toLowerCase(),
    deliverables,
    experienceLevel: selections.experience,
    deadline: selections.deadline,
    currency: currency.code,
  });
}

function normalizeDeliverables(value) {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 12);
}

function hasUnsafePromptContent(...values) {
  const prompt = values.filter((value) => typeof value === "string").join(" ");
  return UNSAFE_PROMPT_PATTERNS.some((pattern) => pattern.test(prompt));
}

function validateFeedback(raw) {
  const actualAmount = raw?.actualAmount;
  const suggestedAmount = raw?.suggestedAmount;
  const outcomes = ["accepted", "negotiating", "declined", "not_sent"];
  const reasons = [
    "scope_changed",
    "client_budget",
    "market_rate",
    "personal_choice",
    "none",
  ];
  if (
    !raw ||
    typeof suggestedAmount !== "number" ||
    !Number.isFinite(suggestedAmount) ||
    suggestedAmount <= 0 ||
    typeof actualAmount !== "number" ||
    !Number.isFinite(actualAmount) ||
    actualAmount <= 0 ||
    !outcomes.includes(raw.outcome) ||
    !reasons.includes(raw.adjustmentReason)
  ) {
    return null;
  }

  return {
    category:
      typeof raw.category === "string" ? raw.category.slice(0, 80) : "Unknown",
    currency:
      typeof raw.currency === "string" ? raw.currency.slice(0, 10) : "NGN",
    suggestedAmount,
    actualAmount,
    outcome: raw.outcome,
    adjustmentReason: raw.adjustmentReason,
    createdAt: new Date().toISOString(),
  };
}

function summarizeFeedback(items) {
  const total = items.length;
  const accepted = items.filter((item) => item.outcome === "accepted").length;
  const outcomeCounts = items.reduce(
    (counts, item) => {
      const outcome = item.outcome || "unknown";
      counts[outcome] = (counts[outcome] || 0) + 1;
      return counts;
    },
    { accepted: 0, negotiating: 0, declined: 0, not_sent: 0, unknown: 0 },
  );
  const feedbackValues = items.map((item) => {
    const suggested = Number(item.suggestedAmount ?? item.suggested_amount);
    const actual = Number(item.actualAmount ?? item.actual_amount);
    return {
      category: item.category || "Unknown",
      currency: item.currency || "NGN",
      suggested,
      actual,
      variance: actual - suggested,
      outcome: item.outcome || "unknown",
      adjustmentReason:
        item.adjustmentReason ?? item.adjustment_reason ?? "none",
      createdAt: item.createdAt ?? item.created_at,
    };
  });
  const averageAccuracy = items.length
    ? items.reduce((sum, item) => {
        const suggested = Number(item.suggestedAmount ?? item.suggested_amount);
        const actual = Number(item.actualAmount ?? item.actual_amount);
        const ratio =
          actual > 0 ? 1 - Math.abs(actual - suggested) / actual : 1;
        return sum + Math.max(0, ratio);
      }, 0) / items.length
    : 0;
  const categories = {};

  items.forEach((item) => {
    const category = item.category || "Unknown";
    if (!categories[category]) {
      categories[category] = {
        name: category,
        count: 0,
        accepted: 0,
        accuracyTotal: 0,
        suggestedTotal: 0,
        actualTotal: 0,
        actualCount: 0,
      };
    }

    const suggested = Number(item.suggestedAmount ?? item.suggested_amount);
    const actual = Number(item.actualAmount ?? item.actual_amount);
    const ratio = actual > 0 ? 1 - Math.abs(actual - suggested) / actual : 1;

    categories[category].count += 1;
    categories[category].accepted += item.outcome === "accepted" ? 1 : 0;
    categories[category].accuracyTotal += Math.max(0, ratio);
    categories[category].suggestedTotal += suggested;
    if (Number.isFinite(actual)) {
      categories[category].actualTotal += actual;
      categories[category].actualCount += 1;
    }
  });

  const categorySummary = Object.values(categories)
    .map((category) => {
      const count = category.count;
      const acceptedCount = category.accepted;
      const averageCategoryAccuracy = count
        ? category.accuracyTotal / count
        : 0;
      return {
        name: category.name,
        count,
        accepted: acceptedCount,
        acceptanceRate: count ? acceptedCount / count : 0,
        averageAccuracy: averageCategoryAccuracy,
        averageSuggestedAmount: count ? category.suggestedTotal / count : 0,
        averageActualAmount: category.actualCount
          ? category.actualTotal / category.actualCount
          : null,
      };
    })
    .sort((a, b) => b.count - a.count);

  const varianceValues = feedbackValues.map((item) => item.variance);
  const averageSuggestedAmount = feedbackValues.length
    ? feedbackValues.reduce((sum, item) => sum + item.suggested, 0) /
      feedbackValues.length
    : null;
  const actualValues = feedbackValues.map((item) => item.actual);
  const averageActualAmount = actualValues.length
    ? actualValues.reduce((sum, value) => sum + value, 0) / actualValues.length
    : null;
  const averageVariance = varianceValues.length
    ? varianceValues.reduce((sum, value) => sum + value, 0) /
      varianceValues.length
    : null;
  const sortedVariances = [...varianceValues].sort((a, b) => a - b);
  const medianVariance = sortedVariances.length
    ? sortedVariances[Math.floor(sortedVariances.length / 2)]
    : null;
  const closeThreshold = 0.1;
  const accuracyDistribution = feedbackValues.reduce(
    (distribution, item) => {
      const relativeVariance =
        item.actual > 0 ? Math.abs(item.variance) / item.actual : 1;
      const direction = item.variance >= 0 ? "high" : "low";
      const bucket =
        relativeVariance <= closeThreshold
          ? "veryClose"
          : relativeVariance <= 0.25
            ? `slightly${direction[0].toUpperCase()}${direction.slice(1)}`
            : `significantly${direction[0].toUpperCase()}${direction.slice(1)}`;
      distribution[bucket] += 1;
      return distribution;
    },
    {
      veryClose: 0,
      slightlyHigh: 0,
      slightlyLow: 0,
      significantlyHigh: 0,
      significantlyLow: 0,
    },
  );
  const overestimationRate = total
    ? feedbackValues.filter((item) => item.variance < 0).length / total
    : 0;
  const underestimationRate = total
    ? feedbackValues.filter((item) => item.variance > 0).length / total
    : 0;

  return {
    total,
    accepted,
    acceptanceRate: total ? accepted / total : 0,
    averageAccuracy,
    outcomeCounts,
    estimateVsActual: feedbackValues,
    pricingPerformance: {
      averageSuggestedAmount,
      averageActualAmount,
      averageVariance,
      medianVariance,
      overestimationRate,
      underestimationRate,
    },
    accuracyDistribution,
    categories: categorySummary,
    feedback: items,
    recent: items.slice(0, 8),
  };
}

function summarizeGeneratedEstimates(items) {
  const categories = {};
  items.forEach((item) => {
    const pricing = item.result?.pricing || {};
    const category =
      pricing.category || item.result?.project?.service || "Unknown";
    const quote = Number(pricing.recommendedQuote);
    if (!categories[category]) {
      categories[category] = {
        name: category,
        count: 0,
        quoteTotal: 0,
        quoteCount: 0,
      };
    }
    categories[category].count += 1;
    if (Number.isFinite(quote)) {
      categories[category].quoteTotal += quote;
      categories[category].quoteCount += 1;
    }
  });
  return Object.values(categories)
    .map((category) => ({
      name: category.name,
      count: category.count,
      averageSuggestedAmount: category.quoteCount
        ? category.quoteTotal / category.quoteCount
        : null,
      averageActualAmount: null,
      acceptanceRate: null,
    }))
    .sort((a, b) => b.count - a.count);
}

const DEFAULT_ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const RBAC_ROLES = {
  Owner: {
    name: "Owner",
    description: "Full administrative control over the entire workspace",
    permissions: ["pricing", "access", "analytics", "telemetry"],
    badgeClass: "role-owner",
  },
  "Super Admin": {
    name: "Super Admin",
    description: "Full administrative access to all features",
    permissions: ["pricing", "access", "analytics", "telemetry"],
    badgeClass: "role-super-admin",
  },
  "Pricing Manager": {
    name: "Pricing Manager",
    description: "Pricing configuration & pricing audit logs",
    permissions: ["pricing", "analytics"],
    badgeClass: "role-pricing-manager",
  },
  Analyst: {
    name: "Analyst",
    description: "Read-only analytics & feedback inspection",
    permissions: ["analytics"],
    badgeClass: "role-analyst",
  },
  "Standard User": {
    name: "Standard User",
    description: "Standard PriceCheck application features",
    permissions: [],
    badgeClass: "role-standard-user",
  },
};

async function getDatabaseUserRole(user) {
  if (!user) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const rawUserId = user.id ? String(user.id).trim() : "";
  const rawEmail = user.email ? String(user.email).trim().toLowerCase() : "";
  const candidateIds = [];
  if (rawUserId) candidateIds.push(rawUserId);

  if (rawEmail) {
    const emailMatch = await supabase
      .from("users")
      .select("id")
      .eq("email", rawEmail)
      .limit(1)
      .maybeSingle();
    if (emailMatch.error) throw emailMatch.error;
    if (emailMatch.data?.id) {
      candidateIds.push(String(emailMatch.data.id).trim());
    }
    candidateIds.push(rawEmail);
  }

  const uniqueIds = [...new Set(candidateIds.filter(Boolean))];
  for (const candidateId of uniqueIds) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", candidateId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data?.role) {
      if (!RBAC_ROLES[data.role]) {
        throw new Error("The stored user role is not supported.");
      }
      return data.role;
    }
  }

  return null;
}

async function hydrateUserFromDatabase(user) {
  if (!user) return null;
  if ((await getUserAccountStatus(user.id)) === "suspended") {
    const error = new Error("The account is suspended.");
    error.code = "account_suspended";
    throw error;
  }
  const persistedRole = await getDatabaseUserRole(user);
  if (!persistedRole) {
    throw new Error("The user's persistent role is missing.");
  }
  const resolvedRole = persistedRole;
  const explicitAdminRole =
    resolvedRole === "Owner" || resolvedRole === "Super Admin";

  return {
    ...user,
    role: resolvedRole,
    permissions: RBAC_ROLES[resolvedRole].permissions,
    isAdmin: explicitAdminRole,
  };
}

async function getUserRoleAndPermissions(user) {
  if (!user) throw new Error("Authenticated user is missing.");

  const persistedRole = await getDatabaseUserRole(user);
  if (persistedRole && RBAC_ROLES[persistedRole]) {
    return {
      role: persistedRole,
      permissions: RBAC_ROLES[persistedRole].permissions,
    };
  }

  throw new Error("The user's persistent role is missing.");
}

async function requirePermission(req, res, requiredPermission) {
  const sessionUser = readSession(req.get("cookie"));
  if (!sessionUser) {
    res.status(403).json({ error: "Admin access required." });
    return null;
  }

  try {
    if ((await getUserAccountStatus(sessionUser.id)) === "suspended") {
      res.set("Set-Cookie", sessionCookie("", 0));
      res.status(403).json({
        error: "This account is suspended. Contact support for help.",
        code: "ACCOUNT_SUSPENDED",
      });
      return null;
    }
  } catch (error) {
    console.error("Account status lookup failed:", error?.message || error);
    res.status(503).json({ error: "User account storage is unavailable." });
    return null;
  }

  let resolvedRole;
  try {
    resolvedRole = await getUserRoleAndPermissions(sessionUser);
  } catch (error) {
    console.error("User role lookup failed:", error?.message || error);
    res.status(503).json({ error: "User role storage is unavailable." });
    return null;
  }
  const { role, permissions } = resolvedRole;
  const authoritativeUser = {
    ...sessionUser,
    role,
    permissions,
    isAdmin: role === "Owner" || role === "Super Admin",
  };

  if (!permissions.includes(requiredPermission)) {
    res.status(403).json({
      error: `Access Denied: Role '${role}' lacks required '${requiredPermission}' privilege.`,
      requiredPermission,
      userRole: role,
    });
    return null;
  }

  const refreshedUser = {
    ...authoritativeUser,
    lastActivity: Math.floor(Date.now() / 1000),
  };

  res.set(
    "Set-Cookie",
    sessionCookie(createSession(refreshedUser), INACTIVITY_TIMEOUT_SECONDS),
  );
  markUserOnline(authoritativeUser);
  return { user: authoritativeUser, role, permissions };
}

async function requireAdmin(req, res) {
  return requirePermission(req, res, "analytics");
}

function cacheEstimate(key, result) {
  estimateCache.delete(key);
  estimateCache.set(key, result);
  if (estimateCache.size > MAX_CACHED_ESTIMATES) {
    estimateCache.delete(estimateCache.keys().next().value);
  }
}

function createRequestStats() {
  return {
    id: Math.random().toString(36).slice(2, 8),
    startedAt: Date.now(),
    key: process.env.GEMINI_API_KEY ? "READY" : "MISSING",
    extraction: "PENDING",
    pricing: "PENDING",
    advice: "PENDING",
  };
}

function logRequestStats(stats, outcome) {
  const elapsed = Date.now() - stats.startedAt;
  console.log(
    `[PriceCheck ${stats.id}] ${outcome} | key=${stats.key} | extraction=${stats.extraction} | pricing=${stats.pricing} | advice=${stats.advice} | ${elapsed}ms`,
  );
}

function validatePdfResult(raw) {
  const text = (value, fallback = "—", maxLength = 500) =>
    typeof value === "string" && value.trim()
      ? value.trim().slice(0, maxLength)
      : fallback;
  const amount = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100000000
      ? value
      : null;
  const project = raw?.project;
  const pricing = raw?.pricing;
  const advice = raw?.advice;
  const recommendedQuote = amount(pricing?.recommendedQuote);
  const min = amount(pricing?.fairRange?.min);
  const max = amount(pricing?.fairRange?.max);

  if (
    !project ||
    !pricing ||
    !advice ||
    recommendedQuote === null ||
    min === null ||
    max === null ||
    min > max
  ) {
    return null;
  }

  const selections = validateSelections({
    experienceLevel: project.experience,
    deadline: project.deadline,
  });
  const currency = validateCurrency(pricing.currency?.code);
  const reasons = Array.isArray(advice.reasons)
    ? advice.reasons
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 5)
        .map((item) => item.trim().slice(0, 280))
    : [];

  return {
    project: {
      projectType: text(project.projectType, "General Project", 120),
      experience: selections.experience,
      deadline: selections.deadline,
      complexity: text(project.complexity, "medium", 30),
      clientType: text(project.clientType, "startup", 30),
      duration: text(project.duration, "—", 120),
      deliverables: Array.isArray(project.deliverables)
        ? project.deliverables
            .filter((item) => typeof item === "string" && item.trim())
            .slice(0, 12)
            .map((item) => item.trim().slice(0, 160))
        : [],
      revisions:
        Number.isInteger(project.revisions) &&
        project.revisions >= 0 &&
        project.revisions <= 100
          ? project.revisions
          : 1,
    },
    pricing: {
      category: text(pricing.category, "Consulting", 80),
      currency,
      recommendedQuote,
      fairRange: { min, max },
    },
    advice: {
      reasons: reasons.length
        ? reasons
        : ["Priced based on the scope you described."],
      advice: text(
        advice.advice,
        "Use this range as a starting point and adjust for your costs and client value.",
        1000,
      ),
      negotiationTip: text(
        advice.negotiationTip,
        "Adjust the scope before reducing your price.",
        500,
      ),
    },
  };
}

function safeFilename(projectType) {
  const slug = projectType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `pricecheck-${slug || "estimate"}-estimate.pdf`;
}

function validateInvoice(raw) {
  const text = (value, fallback, maxLength) =>
    typeof value === "string" && value.trim()
      ? value.trim().slice(0, maxLength)
      : fallback;
  const amount = raw?.amount;
  if (
    !raw ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000000 ||
    !text(raw.fromName, "", 120) ||
    !text(raw.clientName, "", 120) ||
    !text(raw.bankName, "", 120) ||
    !text(raw.accountName, "", 120) ||
    !text(raw.accountNumber, "", 80)
  ) {
    return null;
  }

  return {
    fromName: text(raw.fromName, "", 120),
    clientName: text(raw.clientName, "", 120),
    clientEmail: text(raw.clientEmail, "", 160),
    projectTitle: text(raw.projectTitle, "Project services", 160),
    deliverables: text(raw.deliverables, "Project services", 1000),
    issueDate: text(raw.issueDate, new Date().toLocaleDateString("en-NG"), 40),
    invoiceNumber: text(
      raw.invoiceNumber,
      `PC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      40,
    ),
    dueDate: text(raw.dueDate, "Upon receipt", 40),
    notes: text(raw.notes, "", 320),
    bankName: text(raw.bankName, "", 120),
    accountName: text(raw.accountName, "", 120),
    accountNumber: text(raw.accountNumber, "", 80),
    amount,
    currency: validateCurrency(raw.currency?.code || raw.currency),
  };
}

app.post("/api/pricecheck", async (req, res) => {
  const stats = createRequestStats();
  const progressId =
    typeof req.body?.progressId === "string" ? req.body.progressId : null;
  console.log(`[PriceCheck ${stats.id}] START | key=${stats.key}`);
  sendProgress(progressId, 5, "Starting");

  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";
  const selections = validateSelections({
    experienceLevel: req.body?.experienceLevel,
    deadline: req.body?.deadline,
  });
  const currency = validateCurrency(req.body?.currency);
  const deliverables = normalizeDeliverables(req.body?.deliverables);
  const currentUser = readSession(req.get("cookie"));
  if (currentUser) {
    try {
      if ((await getUserAccountStatus(currentUser.id)) === "suspended") {
        res.set("Set-Cookie", sessionCookie("", 0));
        return res.status(403).json({
          error: "This account is suspended. Contact support for help.",
          code: "ACCOUNT_SUSPENDED",
        });
      }
    } catch (error) {
      console.error("Account status lookup failed:", error?.message || error);
      return res.status(503).json({ error: "User account storage is unavailable." });
    }
  }

  if (!description) {
    logRequestStats(stats, "REJECTED_EMPTY_DESCRIPTION");
    return res.status(400).json({
      error: "Tell us what you're charging for before we can estimate a price.",
    });
  }

  if (description.length < 10) {
    logRequestStats(stats, "REJECTED_SHORT_DESCRIPTION");
    return res.status(400).json({
      error:
        "Add a bit more detail about the project so we can estimate it accurately.",
    });
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    logRequestStats(stats, "REJECTED_LONG_DESCRIPTION");
    return res.status(400).json({
      error: `Please keep your description under ${MAX_DESCRIPTION_LENGTH} characters.`,
    });
  }

  if (hasUnsafePromptContent(description, deliverables)) {
    logRequestStats(stats, "REJECTED_INVALID_PROMPT");
    return res.status(400).json({
      error:
        "Estimate declined due to an invalid prompt. Please use a valid prompt describing a legitimate project or service.",
      code: "INVALID_PROMPT",
    });
  }

  const cacheKey = createEstimateCacheKey({
    description,
    deliverables,
    selections,
    currency,
  });
  const cachedResult = estimateCache.get(cacheKey);
  if (cachedResult) {
    await persistEstimateForUser(
      currentUser,
      cachedResult,
      description,
      deliverables,
    );
    await recordEstimateGenerationSafely(currentUser);
    sendProgress(progressId, 100, "Complete");
    closeProgress(progressId);
    logRequestStats(stats, "CACHE_HIT_200");
    return res.json(cachedResult);
  }

  const pendingEstimate = inFlightEstimates.get(cacheKey);
  if (pendingEstimate) {
    try {
      const result = await pendingEstimate;
      await persistEstimateForUser(
        currentUser,
        result,
        description,
        deliverables,
      );
      await recordEstimateGenerationSafely(currentUser);
      sendProgress(progressId, 100, "Complete");
      closeProgress(progressId);
      logRequestStats(stats, "IN_FLIGHT_HIT_200");
      return res.json(result);
    } catch (error) {
      closeProgress(progressId);
      return res.status(500).json({
        error:
          "We couldn't calculate an estimate for that project. Please try again.",
      });
    }
  }

  let resolveEstimate;
  let rejectEstimate;
  const estimatePromise = new Promise((resolve, reject) => {
    resolveEstimate = resolve;
    rejectEstimate = reject;
  });
  inFlightEstimates.set(cacheKey, estimatePromise);

  let projectData;
  sendProgress(progressId, 15, "Extracting scope");
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(
        `[PriceCheck ${stats.id}] EXTRACTION | Gemini request started`,
      );
      const rawExtraction = await extractProjectDetails(description);
      projectData = validateProjectData(rawExtraction);
      stats.extraction = "GEMINI_OK";
      console.log(`[PriceCheck ${stats.id}] EXTRACTION | Gemini success`);
    } catch (err) {
      const geminiStatus = Number(err?.status || err?.code);
      recordAdminNotification({
        source: "gemini",
        severity: geminiStatus === 429 ? "critical" : "warning",
        title:
          geminiStatus === 429
            ? "Gemini quota or rate limit reached"
            : "Gemini extraction failed",
        message: err?.message || err,
        path: req.path,
      });
      stats.extraction = "FALLBACK";
      console.warn(
        `[PriceCheck ${stats.id}] EXTRACTION | Gemini failed; using local scope fallback | ${err?.status || err?.message || "unknown"}`,
      );
      projectData = fallbackProjectData(description);
    }
  } else {
    stats.extraction = "FALLBACK";
    console.warn(
      `[PriceCheck ${stats.id}] EXTRACTION | GEMINI_API_KEY missing; using local scope fallback`,
    );
    projectData = fallbackProjectData(description);
  }
  // These are explicitly selected by the user, never inferred by Gemini.
  projectData.experience = selections.experience;
  projectData.deadline = selections.deadline;
  if (deliverables.length > 0) {
    projectData.deliverables = deliverables;
    projectData.missingInformation = (
      projectData.missingInformation || []
    ).filter((item) => item.toLowerCase() !== "deliverables");
  }

  let pricingResult;
  sendProgress(progressId, 55, "Calculating price");
  try {
    pricingResult = convertPricingResult(
      calculatePrice(projectData),
      currency.code,
    );
    stats.pricing = "LOCAL_CALCULATOR";
    console.log(`[PriceCheck ${stats.id}] PRICING | local calculator complete`);
  } catch (pricingError) {
    stats.pricing = "FAILED";
    console.error(
      `[PriceCheck ${stats.id}] PRICING | local calculator failed | ${pricingError?.message || pricingError}`,
    );
    logRequestStats(stats, "FAILED_PRICING");
    inFlightEstimates.delete(cacheKey);
    rejectEstimate(pricingError);
    return res.status(500).json({
      error:
        "We couldn't calculate an estimate for that project. Please try rephrasing it.",
    });
  }

  let adviceData;
  sendProgress(progressId, 82, "Preparing advice");
  try {
    console.log(`[PriceCheck ${stats.id}] ADVICE | Gemini request started`);
    const rawAdvice = await generateAdvice({ projectData, pricingResult });
    adviceData = validateAdviceData(rawAdvice);
    const hasGeminiReasons =
      Array.isArray(rawAdvice?.reasons) &&
      rawAdvice.reasons.some(
        (reason) => typeof reason === "string" && reason.trim(),
      );
    stats.advice = hasGeminiReasons ? "GEMINI_OK" : "FALLBACK";
    console.log(
      `[PriceCheck ${stats.id}] ADVICE | ${hasGeminiReasons ? "Gemini success" : "No usable Gemini reasons; using fallback reason"}`,
    );
  } catch (err) {
    const geminiStatus = Number(err?.status || err?.code);
    recordAdminNotification({
      source: "gemini",
      severity: geminiStatus === 429 ? "critical" : "warning",
      title:
        geminiStatus === 429
          ? "Gemini quota or rate limit reached"
          : "Gemini request failed",
      message: err?.message || err,
      path: req.path,
    });
    stats.advice = "FALLBACK";
    console.warn(
      `[PriceCheck ${stats.id}] ADVICE | Gemini failed; using standard advice | ${err?.status || err?.message || "unknown"}`,
    );
    // Advice is a nice-to-have on top of a real calculated price — fall back
    // gracefully instead of failing the whole request.
    adviceData = createFallbackAdviceData();
  }

  logRequestStats(stats, "COMPLETE_200");

  const result = {
    project: projectData,
    pricing: pricingResult,
    advice: adviceData,
  };
  cacheEstimate(cacheKey, result);
  inFlightEstimates.delete(cacheKey);
  resolveEstimate(result);
  await persistEstimateForUser(currentUser, result, description, deliverables);
  await recordEstimateGenerationSafely(currentUser);
  sendProgress(progressId, 100, "Complete");
  closeProgress(progressId);

  return res.json(result);
});

app.post("/api/pricecheck/feedback", async (req, res) => {
  const feedback = validateFeedback(req.body);
  if (!feedback) {
    return res
      .status(400)
      .json({ error: "Please provide valid pricing feedback." });
  }

  pricingFeedback.push(feedback);
  if (pricingFeedback.length > MAX_FEEDBACK_ITEMS) pricingFeedback.shift();
  if (isSupabaseConfigured()) {
    try {
      return res.status(201).json(await savePricingFeedback(feedback));
    } catch (error) {
      recordAdminNotification({
        source: "database",
        severity: "error",
        title: "Feedback database write failed",
        message: describeDatabaseError(error),
        path: req.path,
      });
      console.error(
        "Supabase feedback persistence failed:",
        error?.message || error,
      );
      return res.status(201).json({ saved: true, persisted: false });
    }
  }
  return res.status(201).json({ saved: true, persisted: false });
});

app.get("/api/pricecheck/admin/summary", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  try {
    const persisted = await getPricingFeedback();
    if (!persisted) {
      return res.status(503).json({
        error: "Supabase is required for live admin data.",
      });
    }
    const items = persisted;
    const userCount = await getUserCount();
    const estimateCount = await getEstimateGenerationCount();
    const generatedEstimates = await getEstimateCategorySummary();
    const feedbackSummary = summarizeFeedback(items);
    let notifications = localAdminNotifications;
    try {
      const persistedNotifications = await getAdminNotifications();
      if (persistedNotifications) {
        const merged = [...persistedNotifications, ...localAdminNotifications];
        const seen = new Set();
        notifications = merged
          .filter((item) => {
            const key = `${item.source}|${item.title}|${item.message}|${item.created_at || item.createdAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort(
            (a, b) =>
              new Date(b.created_at || b.createdAt) -
              new Date(a.created_at || a.createdAt),
          );
      }
    } catch (error) {
      recordAdminNotification({
        source: "database",
        severity: "error",
        title: "Notification database read failed",
        message: describeDatabaseError(error),
        path: req.path,
      });
    }
    return res.json({
      source: "supabase",
      userCount,
      estimateCount,
      notifications,
      ...feedbackSummary,
      categories: summarizeGeneratedEstimates(generatedEstimates || []),
      feedbackCategories: feedbackSummary.categories,
    });
  } catch (error) {
    recordAdminNotification({
      source: "database",
      severity: "error",
      title: "Admin summary database read failed",
      message: describeDatabaseError(error),
      path: req.path,
    });
    console.error("Admin summary failed:", error?.message || error);
    return res.status(503).json({ error: "Live admin data is unavailable." });
  }
});

app.delete("/api/pricecheck/admin/metrics", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  pricingFeedback.length = 0;
  if (!isSupabaseConfigured()) {
    return res
      .status(503)
      .json({ error: "Supabase is required to reset live metrics." });
  }
  try {
    await deletePricingFeedback();
    return res.status(204).end();
  } catch (error) {
    console.error("Admin metrics reset failed:", error?.message || error);
    return res.status(503).json({ error: "Metrics could not be reset." });
  }
});

app.delete("/api/pricecheck/admin/notifications", async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  localAdminNotifications.length = 0;
  if (!isSupabaseConfigured()) return res.status(204).end();
  try {
    await deleteAdminNotifications();
    return res.status(204).end();
  } catch (error) {
    console.error(
      "Admin notification deletion failed:",
      error?.message || error,
    );
    return res
      .status(503)
      .json({ error: "Notifications could not be cleared." });
  }
});

// Dynamic Admin Pricing & Access Control Stores
const { CATEGORIES, MODIFIERS } = require("./config/pricing");
const DEFAULT_CATEGORIES = JSON.parse(JSON.stringify(CATEGORIES));
function getUserStatus(lastSeenAt, user = null) {
  if (user && isUserOnline(user)) return "active";
  if (!lastSeenAt) return "inactive";
  const seenAt = Date.parse(lastSeenAt);
  if (!Number.isFinite(seenAt)) return "inactive";
  const ageMs = Date.now() - seenAt;
  return ageMs <= ACTIVE_SESSION_TTL_MS ? "active" : "inactive";
}

async function updatePricingCategory(req, res) {
  const auth = await requirePermission(req, res, "pricing");
  if (!auth) return;
  const currentUser = auth.user;
  const { category, basePrice, minimumPrice, maximumPrice, reason } =
    req.body || {};

  if (!category || !CATEGORIES[category]) {
    return res
      .status(400)
      .json({ error: "Invalid or unsupported category name." });
  }

  const base = Math.round(Number(basePrice));
  const min = Math.round(Number(minimumPrice));
  const max = Math.round(Number(maximumPrice));

  if (
    !Number.isFinite(base) ||
    base <= 0 ||
    !Number.isFinite(min) ||
    min <= 0 ||
    !Number.isFinite(max) ||
    max <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Pricing values must be positive numbers." });
  }

  if (min > base) {
    return res
      .status(400)
      .json({ error: "Minimum price cannot be greater than the base price." });
  }

  if (base > max) {
    return res
      .status(400)
      .json({ error: "Base price cannot be greater than the maximum price." });
  }

  if (min > max) {
    return res.status(400).json({
      error: "Minimum price cannot be greater than the maximum price.",
    });
  }

  const prev = { ...CATEGORIES[category] };
  CATEGORIES[category].basePrice = base;
  CATEGORIES[category].minimumPrice = min;
  CATEGORIES[category].maximumPrice = max;

  if (isSupabaseConfigured()) {
    void savePricingConfig(
      category,
      base,
      min,
      max,
      currentUser?.email || "admin",
    ).catch(() => {});
  }

  recordAdminNotification({
    source: "admin",
    severity: "info",
    title: `Pricing update: ${category}`,
    message: `Admin ${currentUser?.email || "admin"} updated ${category}. Base: ₦${prev.basePrice.toLocaleString()} → ₦${base.toLocaleString()}, Range: ₦${prev.minimumPrice.toLocaleString()}–₦${prev.maximumPrice.toLocaleString()} → ₦${min.toLocaleString()}–₦${max.toLocaleString()}.${reason ? ` Reason: ${reason}` : ""}`,
    path: req.path,
  });

  return res.json({
    success: true,
    category,
    previous: prev,
    updated: CATEGORIES[category],
  });
}

async function resetPricingCategory(req, res, categoryParam) {
  const auth = await requirePermission(req, res, "pricing");
  if (!auth) return;
  const currentUser = auth.user;
  const category = categoryParam || req.body?.category;

  if (!category || !DEFAULT_CATEGORIES[category]) {
    return res.status(400).json({ error: "Invalid category for reset." });
  }

  const prev = { ...CATEGORIES[category] };
  CATEGORIES[category] = { ...DEFAULT_CATEGORIES[category] };

  if (isSupabaseConfigured()) {
    void savePricingConfig(
      category,
      DEFAULT_CATEGORIES[category].basePrice,
      DEFAULT_CATEGORIES[category].minimumPrice,
      DEFAULT_CATEGORIES[category].maximumPrice,
      currentUser?.email || "admin",
    ).catch(() => {});
  }

  recordAdminNotification({
    source: "admin",
    severity: "info",
    title: `Pricing reset: ${category}`,
    message: `Admin ${currentUser?.email || "admin"} reset ${category} to default baseline numbers (Base: ₦${DEFAULT_CATEGORIES[category].basePrice.toLocaleString()}).`,
    path: req.path,
  });

  return res.json({
    success: true,
    category,
    previous: prev,
    updated: CATEGORIES[category],
  });
}

app.get("/api/admin/pricing", async (req, res) => {
  if (!(await requirePermission(req, res, "pricing"))) return;
  return res.json({
    categories: CATEGORIES,
    modifiers: MODIFIERS,
    defaults: DEFAULT_CATEGORIES,
  });
});

app.post("/api/admin/pricing", (req, res) => updatePricingCategory(req, res));
app.patch("/api/admin/pricing", (req, res) => updatePricingCategory(req, res));

app.post("/api/admin/pricing/reset", (req, res) =>
  resetPricingCategory(req, res),
);
app.post("/api/admin/pricing/:category/reset", (req, res) =>
  resetPricingCategory(req, res, req.params.category),
);

async function getAdminUsersData(req, res) {
  const auth = await requirePermission(req, res, "access");
  if (!auth) return;

  let realUsers;
  try {
    realUsers = await getRegisteredUsers();
  } catch (error) {
    console.error("Admin user list lookup failed:", error?.message || error);
    return res.status(503).json({ error: "User roles could not be loaded." });
  }
  if (!realUsers) {
    return res
      .status(503)
      .json({ error: "User role storage is not configured." });
  }

  const userMap = new Map();

  for (const user of realUsers) {
    const email = String(user.email || "")
      .trim()
      .toLowerCase();
    if (!email) continue;

    if (!RBAC_ROLES[user.role]) {
      console.error("Admin user has no supported persisted role:", email);
      return res.status(503).json({ error: "User roles could not be loaded." });
    }
    const role = user.role;

    const canonicalId = String(user.id || email);
    const mergedUser = {
      id: canonicalId,
      email,
      name: user.name || user.given_name || email,
      role,
      status: getUserStatus(user.last_seen_at, {
        id: canonicalId,
        email,
        lastSeenAt: user.last_seen_at,
      }),
      lastActive: user.last_seen_at || new Date(0).toISOString(),
      permissions: RBAC_ROLES[role].permissions,
    };

    userMap.set(email, mergedUser);
  }

  const roleRank = {
    Owner: 0,
    "Super Admin": 1,
    "Pricing Manager": 2,
    Analyst: 3,
    "Standard User": 4,
  };

  const users = Array.from(userMap.values()).sort((a, b) => {
    const roleOrder = (roleRank[a.role] ?? 99) - (roleRank[b.role] ?? 99);
    if (roleOrder !== 0) return roleOrder;

    const onlineOrder =
      Number(b.status === "active") - Number(a.status === "active");
    if (onlineOrder !== 0) return onlineOrder;
    return a.name.localeCompare(b.name);
  });

  return res.json({
    users,
    roles: RBAC_ROLES,
    currentUserId: auth.user.id,
  });
}

app.get("/api/admin/access", (req, res) => getAdminUsersData(req, res));
app.get("/api/admin/users", (req, res) => getAdminUsersData(req, res));

async function updateUserRole(req, res, targetUserId) {
  const auth = await requirePermission(req, res, "access");
  if (!auth) return;
  const currentUser = auth.user;
  const userId = targetUserId || req.body?.userId;
  const userEmail = req.body?.userEmail;
  const role = req.body?.role;
  const reason = req.body?.reason;
  const normalizedEmail = String(userEmail || "")
    .trim()
    .toLowerCase();
  const normalizedUserId = String(userId || "").trim();

  if (!userId || !RBAC_ROLES[role]) {
    return res
      .status(400)
      .json({ error: "Valid userId and supported 4-tier role required." });
  }

  const currentUserId = String(currentUser?.id || "").trim();
  const currentUserEmail = String(currentUser?.email || "")
    .trim()
    .toLowerCase();
  if (
    (currentUserId && normalizedUserId === currentUserId) ||
    (currentUserEmail && normalizedEmail === currentUserEmail)
  ) {
    return res.status(403).json({ error: "You cannot change your own role." });
  }

  const protectedDefaultAdmin =
    (normalizedEmail && DEFAULT_ADMIN_EMAILS.has(normalizedEmail)) ||
    (normalizedUserId && DEFAULT_ADMIN_EMAILS.has(normalizedUserId));

  if (protectedDefaultAdmin) {
    return res.status(403).json({
      error: "The default admin account is protected and cannot be edited.",
      userRole: "Owner",
    });
  }

  let targetUser;
  try {
    targetUser = normalizedEmail
      ? await getUserByEmail(normalizedEmail)
      : await getUserById(normalizedUserId);
  } catch (error) {
    console.error("Role target lookup failed:", error?.message || error);
    return res.status(503).json({ error: "User role storage is unavailable." });
  }
  if (
    !targetUser ||
    (normalizedUserId && String(targetUser.id) !== normalizedUserId)
  ) {
    return res.status(404).json({ error: "The target user does not exist." });
  }
  if (
    normalizedEmail &&
    String(targetUser.email || "")
      .trim()
      .toLowerCase() !== normalizedEmail
  ) {
    return res.status(404).json({ error: "The target user does not exist." });
  }

  let previousRoles;
  try {
    previousRoles = await getUserRoles();
    if (!previousRoles) throw new Error("User role storage is unavailable.");
  } catch (error) {
    console.error("Previous role lookup failed:", error?.message || error);
    return res.status(503).json({ error: "User role storage is unavailable." });
  }
  const previousEntry =
    previousRoles.find(
      (entry) => String(entry.user_id) === String(targetUser.id),
    ) ||
    previousRoles.find(
      (entry) =>
        String(entry.user_id).trim().toLowerCase() ===
        String(targetUser.email).trim().toLowerCase(),
    );
  const prevRole = previousEntry?.role || "Standard User";

  const firstName = String(targetUser.name || targetUser.email)
    .trim()
    .split(/\s+/)[0];
  const userEmailPayload = {
    subject: "Your PriceCheck access changed",
    html: createRoleChangeEmailHtml({
      firstName,
      previousRole: prevRole,
      role,
    }),
    text: createRoleChangeEmailText({
      firstName,
      previousRole: prevRole,
      role,
    }),
    reply_to: process.env.EMAIL_REPLY_TO || undefined,
  };
  const adminEmailPayload = {
    subject: "PriceCheck administrator access changed",
    html: createPrivilegedRoleChangeEmailHtml({
      firstName: "there",
      targetEmail: targetUser.email,
      previousRole: prevRole,
      role,
    }),
    text: createPrivilegedRoleChangeEmailText({
      firstName: "there",
      targetEmail: targetUser.email,
      previousRole: prevRole,
      role,
    }),
    reply_to: process.env.EMAIL_REPLY_TO || undefined,
  };

  let roleUpdate;
  try {
    roleUpdate = await updateUserRoleWithNotifications({
      userId: targetUser.id,
      role,
      assignedBy: currentUser?.email || "admin",
      expectedPreviousRole: prevRole,
      userPayload: userEmailPayload,
      adminPayload: adminEmailPayload,
    });
    if (!roleUpdate) throw new Error("Role update was not persisted.");
  } catch (error) {
    if (error?.code === "40001") {
      return res.status(409).json({
        error: "The user's role changed. Refresh and try again.",
      });
    }
    console.error("Role update persistence failed:", error?.message || error);
    return res.status(503).json({ error: "The user role could not be saved." });
  }

  if (roleUpdate.changed && process.env.NODE_ENV !== "test") {
    void dispatchEmailNotifications().catch((error) => {
      console.warn(
        "Role notification dispatch deferred to the retry worker:",
        error?.message || error,
      );
    });
  }

  recordAdminNotification({
    source: "admin",
    severity: "info",
    title: "Access control role updated",
    message: `Admin ${currentUser?.email || "admin"} updated user ${userId} (${userEmail || "user"}) role from ${prevRole} → ${role}.${reason ? ` Reason: ${reason}` : ""}`,
    path: req.path,
  });

  return res.json({
    success: true,
    userId: targetUser.id,
    userEmail: targetUser.email,
    previousRole: roleUpdate.previous_role || prevRole,
    role: roleUpdate.role || role,
    permissions: RBAC_ROLES[role].permissions,
    emailNotification: roleUpdate.changed ? "queued" : "unchanged",
  });
}

app.post("/api/admin/access", (req, res) => updateUserRole(req, res));
app.patch("/api/admin/users/:userId/role", (req, res) =>
  updateUserRole(req, res, req.params.userId),
);

app.patch("/api/admin/users/:userId/status", async (req, res) => {
  const auth = await requirePermission(req, res, "access");
  if (!auth) return;
  const userId = String(req.params.userId || "").trim();
  const suspended = req.body?.suspended;
  const reason = String(req.body?.reason || "")
    .trim()
    .slice(0, 500);
  if (!userId || typeof suspended !== "boolean") {
    return res.status(400).json({
      error: "Provide a user ID and a boolean suspended value.",
    });
  }
  if (String(auth.user.id) === userId) {
    return res.status(403).json({ error: "You cannot suspend your own account." });
  }

  let targetUser;
  try {
    targetUser = await getUserById(userId);
  } catch (error) {
    console.error("Account status target lookup failed:", error?.message || error);
    return res.status(503).json({ error: "User account storage is unavailable." });
  }
  if (!targetUser) {
    return res.status(404).json({ error: "The target user does not exist." });
  }
  if (DEFAULT_ADMIN_EMAILS.has(String(targetUser.email || "").toLowerCase())) {
    return res.status(403).json({
      error: "The default admin account is protected and cannot be suspended.",
    });
  }

  const firstName = String(targetUser.name || targetUser.email)
    .trim()
    .split(/\s+/)[0];
  let result;
  try {
    result = await setUserSuspensionWithNotification({
      userId,
      suspended,
      reason,
      suspendedPayload: {
        subject: "Your PriceCheck account was suspended",
        html: createAccountStatusEmailHtml({ firstName, reason }),
        text: createAccountStatusEmailText({ firstName, reason }),
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      },
      restoredPayload: {
        subject: "Your PriceCheck account was restored",
        html: createAccountStatusEmailHtml({ firstName, restored: true }),
        text: createAccountStatusEmailText({ firstName, restored: true }),
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
      },
    });
  } catch (error) {
    console.error("Account status update failed:", error?.message || error);
    return res.status(503).json({ error: "The account status could not be saved." });
  }

  if (result?.changed && process.env.NODE_ENV !== "test") {
    void dispatchEmailNotifications().catch((error) => {
      console.warn(
        "Account status notification dispatch deferred to the retry worker:",
        error?.message || error,
      );
    });
  }
  recordAdminNotification({
    source: "admin",
    severity: suspended ? "warning" : "info",
    title: suspended ? "User account suspended" : "User account restored",
    message: `${auth.user.email || "An administrator"} ${suspended ? "suspended" : "restored"} ${targetUser.email}.`,
    path: req.path,
  });
  return res.json({
    success: true,
    userId,
    accountStatus: result?.account_status || (suspended ? "suspended" : "active"),
    notification: result?.changed ? "queued" : "unchanged",
  });
});

app.post("/api/admin/marketing-campaigns", async (req, res) => {
  const auth = await requirePermission(req, res, "access");
  if (!auth) return;
  const campaignId = String(req.body?.campaignId || "").trim();
  const subject = String(req.body?.subject || "").trim();
  const html = String(req.body?.html || "");
  const text = String(req.body?.text || "").trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      campaignId,
    ) ||
    !subject ||
    subject.length > 160 ||
    (!html.trim() && !text) ||
    html.length > 60000 ||
    text.length > 60000
  ) {
    return res.status(400).json({
      error: "Provide a campaign UUID, a subject, and email content within the size limits.",
    });
  }
  if (!process.env.APP_URL || !process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    return res.status(503).json({
      error: "Marketing email URL and unsubscribe configuration are required.",
    });
  }
  let appUrl;
  try {
    appUrl = new URL(process.env.APP_URL);
  } catch {
    return res.status(503).json({ error: "APP_URL is not a valid URL." });
  }
  if (
    process.env.NODE_ENV === "production" &&
    appUrl.protocol !== "https:"
  ) {
    return res.status(503).json({ error: "APP_URL must use HTTPS in production." });
  }

  let recipients;
  try {
    recipients = await getMarketingRecipients();
  } catch (error) {
    console.error("Marketing recipient lookup failed:", error?.message || error);
    return res.status(503).json({ error: "Marketing preferences are unavailable." });
  }

  let queued = 0;
  try {
    const events = recipients.map((recipient) => {
      const token = createUnsubscribeToken(recipient.id, campaignId);
      const unsubscribeUrl = new URL("/unsubscribe", appUrl);
      unsubscribeUrl.searchParams.set("token", token);
      return {
        userId: recipient.id,
        emailType: "marketing",
        eventKey: `marketing:${campaignId}:${recipient.id}`,
        recipientEmail: recipient.email,
        payload: {
          subject,
          html: createMarketingEmailHtml({
            subject,
            bodyHtml: html,
            unsubscribeUrl: unsubscribeUrl.toString(),
          }),
          text: createMarketingEmailText({
            text: text || "Please view this email in an HTML-capable email client.",
            unsubscribeUrl: unsubscribeUrl.toString(),
          }),
          reply_to: process.env.EMAIL_REPLY_TO || undefined,
        },
      };
    });
    for (let offset = 0; offset < events.length; offset += 25) {
      queued += await enqueueEmailEvents(events.slice(offset, offset + 25));
    }
  } catch (error) {
    console.error("Marketing campaign queue failed:", error?.message || error);
    return res.status(503).json({
      error: "The campaign could not be fully queued. Retry with the same campaign ID.",
      campaignId,
      queued,
    });
  }

  if (recipients.length && process.env.NODE_ENV !== "test") {
    void dispatchEmailNotifications().catch((error) => {
      console.warn(
        "Marketing dispatch deferred to the retry worker:",
        error?.message || error,
      );
    });
  }
  return res.status(202).json({
    success: true,
    campaignId,
    queued,
  });
});

app.get("/unsubscribe", (req, res) => {
  const token = String(req.query?.token || "");
  if (!process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    return res.status(503).send("Email preferences are unavailable.");
  }
  if (!verifyUnsubscribeToken(token)) {
    return res.status(400).send("This unsubscribe link is invalid or expired.");
  }
  res.set("Cache-Control", "no-store");
  res.type("html").send(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#111827"><h1>Unsubscribe from promotional email?</h1><p>This will stop PriceCheck product updates. Account and security notices will continue.</p><form method="post" action="/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit">Confirm unsubscribe</button></form></body></html>`,
  );
});

app.post("/unsubscribe", async (req, res) => {
  const token = String(req.body?.token || "");
  if (!process.env.EMAIL_UNSUBSCRIBE_SECRET) {
    return res.status(503).send("Email preferences are unavailable.");
  }
  const tokenData = verifyUnsubscribeToken(token);
  if (!tokenData) {
    return res.status(400).send("This unsubscribe link is invalid or expired.");
  }
  try {
    const updated = await unsubscribeEmailMarketing(tokenData.userId);
    if (!updated) return res.status(404).send("The account could not be found.");
    res.set("Cache-Control", "no-store");
    return res
      .type("html")
      .send("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Unsubscribed</title><body style=\"font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:24px;color:#111827\"><h1>You are unsubscribed</h1><p>You will no longer receive PriceCheck promotional emails. Account and security notices will continue.</p></body></html>");
  } catch (error) {
    console.error("Marketing unsubscribe failed:", error?.message || error);
    return res.status(503).send("Your email preferences could not be updated. Please try again.");
  }
});

async function getAdminTelemetryData(req, res) {
  if (!(await requirePermission(req, res, "telemetry"))) return;
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const d = Math.floor(uptimeSeconds / (3600 * 24));
  const h = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const m = Math.floor((uptimeSeconds % 3600) / 60);
  const s = uptimeSeconds % 60;
  const uptimeFormatted =
    d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

  const heapUsedMb = Math.round((memory.heapUsed / 1024 / 1024) * 10) / 10;
  const heapTotalMb = Math.round((memory.heapTotal / 1024 / 1024) * 10) / 10;
  const rssMb = Math.round((memory.rss / 1024 / 1024) * 10) / 10;
  const externalMb =
    Math.round(((memory.external || 0) / 1024 / 1024) * 10) / 10;
  const heapUsedPercent = Math.min(
    100,
    Math.round((memory.heapUsed / memory.heapTotal) * 100),
  );

  let totalMemMb = 0;
  let freeMemMb = 0;
  let systemMemoryPercent = 0;
  try {
    totalMemMb = Math.round(os.totalmem() / 1024 / 1024);
    freeMemMb = Math.round(os.freemem() / 1024 / 1024);
    systemMemoryPercent = Math.round(
      ((totalMemMb - freeMemMb) / totalMemMb) * 100,
    );
  } catch {
    // OS stats fallback
  }

  let auditLogs = [];
  try {
    auditLogs = await getAuditLogs();
  } catch {
    auditLogs = null;
  }
  if (!auditLogs || !auditLogs.length) {
    auditLogs = localAuditLogs;
  }

  return res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    process: {
      uptimeSeconds,
      uptimeFormatted,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || "development",
      pid: process.pid,
    },
    memory: {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb,
      heapUsedPercent,
      systemTotalMb: totalMemMb,
      systemFreeMb: freeMemMb,
      systemMemoryPercent,
    },
    services: {
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      geminiStatus: process.env.GEMINI_API_KEY
        ? "Configured"
        : "Fallback Local AI",
      supabaseConfigured: isSupabaseConfigured(),
      supabaseStatus: isSupabaseConfigured()
        ? "Connected"
        : "Memory Storage Mode",
      googleAuthConfigured: isGoogleAuthConfigured(),
      googleAuthStatus: isGoogleAuthConfigured()
        ? "Configured"
        : "Not Configured",
      billingConfigured: Boolean(
        process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_KEY,
      ),
      billingStatus:
        process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_KEY
          ? "Configured"
          : "Not Configured",
    },
    metrics: {
      cachedEstimatesCount: estimateCache.size,
    },
    systemLogs: auditLogs.slice(0, 50),
  });
}

app.get("/api/admin/health", async (req, res) =>
  getAdminTelemetryData(req, res),
);
app.get("/api/admin/telemetry", async (req, res) =>
  getAdminTelemetryData(req, res),
);

app.get("/api/admin/audit-logs", async (req, res) => {
  const auth = await requirePermission(req, res, "analytics");
  if (!auth) return;

  let logs = await getAuditLogs().catch(() => null);
  if (!logs || !logs.length) {
    logs = localAuditLogs;
  }

  const search = (req.query.search || "").toLowerCase().trim();
  const severity = (req.query.severity || "all").toLowerCase().trim();
  const action = (req.query.action || "all").toLowerCase().trim();

  let filtered = logs.slice();

  if (severity !== "all") {
    filtered = filtered.filter((log) => {
      const s = (log.severity || "info").toLowerCase();
      if (severity === "system")
        return (
          s === "system" || (log.action && log.action.startsWith("system."))
        );
      if (severity === "feedback")
        return (
          s === "feedback" || (log.action && log.action.startsWith("feedback."))
        );
      if (severity === "warning") return s === "warning" || s === "warn";
      if (severity === "critical") return s === "critical" || s === "error";
      return s === severity;
    });
  }

  if (action !== "all") {
    filtered = filtered.filter(
      (log) => (log.action || "").toLowerCase() === action,
    );
  }

  if (search) {
    filtered = filtered.filter(
      (log) =>
        (log.actor || "").toLowerCase().includes(search) ||
        (log.action || "").toLowerCase().includes(search) ||
        (log.description || "").toLowerCase().includes(search) ||
        (log.entity || "").toLowerCase().includes(search),
    );
  }

  return res.json({
    total: filtered.length,
    logs: filtered,
  });
});

app.delete("/api/admin/audit-logs", async (req, res) => {
  const auth = await requirePermission(req, res, "telemetry");
  if (!auth) return;

  recordAuditLog({
    actor: auth.user?.email || "admin",
    action: "system.audit_cleared",
    severity: "warning",
    description: `Admin ${auth.user?.email || "admin"} cleared audit log event history.`,
    entity: "Audit Log System",
  });

  localAuditLogs.length = 0;
  await deleteAuditLogs().catch(() => {});

  return res.json({ success: true, message: "Audit logs cleared." });
});

app.post("/api/pricecheck/pdf", (req, res) => {
  const result = validatePdfResult(req.body);
  if (!result) {
    return res.status(400).json({
      error:
        "We couldn't generate an estimate from that result. Please try again.",
    });
  }

  try {
    const doc = createEstimatePdf(result);
    res.status(200);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename(result.project.projectType)}"`,
      "Cache-Control": "no-store",
    });
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("PDF generation failed:", err?.message || err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Couldn't generate the estimate. Please try again." });
    } else {
      res.end();
    }
  }
});

app.post("/api/pricecheck/invoice", (req, res) => {
  const invoice = validateInvoice(req.body);
  if (!invoice) {
    return res.status(400).json({
      error: "Please provide a valid invoice amount and project details.",
    });
  }

  try {
    const doc = createInvoicePdf(invoice);
    res.status(200);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pricecheck-invoice-${
        invoice.projectTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) || "project"
      }.pdf"`,
      "Cache-Control": "no-store",
    });
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error("Invoice generation failed:", err?.message || err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Couldn't generate the invoice. Please try again." });
    } else {
      res.end();
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Final safety net: never leak stack traces to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  recordAdminNotification({
    source: "backend",
    severity: "critical",
    title: "Unhandled server error",
    message: err?.message || err,
    path: req.path,
  });
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

process.on("uncaughtException", (error) => {
  recordAdminNotification({
    source: "backend",
    severity: "critical",
    title: "Process crash detected",
    message: error?.message || error,
  });
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  recordAdminNotification({
    source: "backend",
    severity: "critical",
    title: "Unhandled promise rejection",
    message: error?.message || error,
  });
  console.error("Unhandled promise rejection:", error);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PriceCheck server running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
