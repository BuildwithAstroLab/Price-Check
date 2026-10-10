const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const USER_SHEET_COLUMNS = [
  "id",
  "email",
  "name",
  "skill_work",
  "picture",
  "given_name",
  "family_name",
  "locale",
  "newsletter_consent",
  "role",
  "last_seen_at",
];

function getUserSheetPath() {
  return (
    process.env.USER_SHEET_PATH ||
    path.join(__dirname, "..", "data", "user-details.csv")
  );
}

function csvEscape(value) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    if (char === "\r") continue;
    current += char;
  }

  values.push(current);
  return values;
}

function readUserSheetRows(sheetPath) {
  if (!fs.existsSync(sheetPath)) return [];

  const csvText = fs.readFileSync(sheetPath, "utf8").trim();
  if (!csvText) return [];

  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
}

function writeUserSheetRow(userRecord) {
  const sheetPath = getUserSheetPath();
  const directory = path.dirname(sheetPath);
  fs.mkdirSync(directory, { recursive: true });
  const existingRows = readUserSheetRows(sheetPath);
  const dedupedRows = new Map();

  for (const row of existingRows) {
    const key = String(row.email || row.id || row.name || "")
      .trim()
      .toLowerCase();
    if (!key) continue;

    const current = dedupedRows.get(key);
    if (
      !current ||
      (row.last_seen_at &&
        (!current.last_seen_at ||
          new Date(row.last_seen_at) > new Date(current.last_seen_at)))
    ) {
      dedupedRows.set(key, row);
    }
  }

  const recordKey = String(
    userRecord.email || userRecord.id || userRecord.name || "",
  )
    .trim()
    .toLowerCase();
  if (recordKey) {
    const current = dedupedRows.get(recordKey);
    const candidate = { ...current, ...userRecord };
    if (
      !current ||
      (candidate.last_seen_at &&
        (!current.last_seen_at ||
          new Date(candidate.last_seen_at) > new Date(current.last_seen_at)))
    ) {
      dedupedRows.set(recordKey, candidate);
    }
  }

  const rows = Array.from(dedupedRows.values());
  const header = USER_SHEET_COLUMNS.join(",");
  const body = rows
    .map((row) =>
      USER_SHEET_COLUMNS.map((column) => csvEscape(row[column] ?? "")).join(
        ",",
      ),
    )
    .join("\n");

  fs.writeFileSync(sheetPath, `${header}\n${body ? `${body}\n` : ""}`, "utf8");
}

function deleteUserSheetRowsByEmail(email) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) return 0;
  const sheetPath = getUserSheetPath();
  if (!fs.existsSync(sheetPath)) return 0;
  const rows = readUserSheetRows(sheetPath);
  const remainingRows = rows.filter(
    (row) =>
      String(row.email || "")
        .trim()
        .toLowerCase() !== normalizedEmail,
  );
  const deletedCount = rows.length - remainingRows.length;
  if (!deletedCount) return 0;
  const header = USER_SHEET_COLUMNS.join(",");
  const body = remainingRows
    .map((row) =>
      USER_SHEET_COLUMNS.map((column) => csvEscape(row[column] ?? "")).join(
        ",",
      ),
    )
    .join("\n");
  fs.writeFileSync(sheetPath, `${header}\n${body ? `${body}\n` : ""}`, "utf8");
  return deletedCount;
}

function getSupabaseConfig() {
  const isTestEnvironment = process.env.NODE_ENV === "test";
  const url = isTestEnvironment
    ? process.env.SUPABASE_TEST_URL || process.env.SUPABASE_URL
    : process.env.SUPABASE_URL;
  const serviceRoleKey = isTestEnvironment
    ? process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, serviceRoleKey };
}

function getSupabaseAuthConfig() {
  const isTestEnvironment = process.env.NODE_ENV === "test";
  const { url } = getSupabaseConfig();
  const anonKey = isTestEnvironment
    ? process.env.SUPABASE_TEST_ANON_KEY ||
      process.env.SUPABASE_TEST_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY
    : process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  return { url, anonKey };
}

function getSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchWithRetry },
  });
}

function normalizePersistedRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  const roles = {
    owner: "Owner",
    "super admin": "Super Admin",
    "pricing manager": "Pricing Manager",
    analyst: "Analyst",
    "standard user": "Standard User",
  };
  return roles[normalized] || null;
}

async function fetchWithRetry(input, init) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
  }
}

function isSupabaseConfigured() {
  return Boolean(getSupabaseClient());
}

async function savePricingFeedback(feedback) {
  const supabase = getSupabaseClient();
  if (!supabase) return { saved: false, persisted: false };

  const { error } = await supabase.from("pricing_feedback").insert({
    category: feedback.category,
    currency: feedback.currency,
    suggested_amount: feedback.suggestedAmount,
    actual_amount: feedback.actualAmount,
    outcome: feedback.outcome,
    adjustment_reason: feedback.adjustmentReason,
  });
  if (error) throw error;
  return { saved: true, persisted: true };
}

async function getPricingFeedback() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("pricing_feedback")
    .select(
      "category,currency,suggested_amount,actual_amount,outcome,adjustment_reason,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data;
}

async function deletePricingFeedback() {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("pricing_feedback")
    .delete()
    .not("id", "is", null);
  if (error) throw error;
  return true;
}

function sanitizeNotification(notification) {
  const sources = ["frontend", "backend", "database", "gemini", "feedback"];
  const severities = ["info", "warning", "error", "critical"];
  return {
    source: sources.includes(notification?.source)
      ? notification.source
      : "backend",
    severity: severities.includes(notification?.severity)
      ? notification.severity
      : "error",
    title: String(notification?.title || "Admin notification").slice(0, 120),
    message: String(notification?.message || "No details provided.").slice(
      0,
      500,
    ),
    path:
      typeof notification?.path === "string"
        ? notification.path.slice(0, 160)
        : null,
  };
}

async function saveAdminNotification(notification) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("admin_notifications")
    .insert(sanitizeNotification(notification));
  if (error) throw error;
  return true;
}

async function saveAuditLog(logItem) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("audit_logs").insert({
    actor: logItem.actor,
    action: logItem.action,
    severity: logItem.severity,
    description: logItem.description,
    entity: logItem.entity,
    created_at: logItem.createdAt,
  });
  if (error) return false;
  return true;
}

async function getAuditLogs() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,actor,action,severity,description,entity,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return null;
  return (data || []).map((row) => ({
    id: String(row.id),
    actor: row.actor,
    action: row.action,
    severity: row.severity,
    description: row.description,
    entity: row.entity,
    createdAt: row.created_at,
  }));
}

async function deleteAuditLogs() {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("audit_logs")
    .delete()
    .not("id", "is", null);
  if (error) return false;
  return true;
}

async function getAdminNotifications() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id,source,severity,title,message,path,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

async function deleteAdminNotifications() {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("admin_notifications")
    .delete()
    .not("id", "is", null);
  if (error) throw error;
  return true;
}

async function saveUser(user, initialRole = "Standard User") {
  const userRecord = {
    id: user.id,
    email: user.email,
    name: user.name,
    skill_work: user.skillWork || "",
    picture: user.picture || "",
    newsletter_consent: Boolean(user.newsletterConsent),
    last_seen_at: new Date().toISOString(),
  };
  const userSheetRecord = {
    ...userRecord,
    given_name: user.givenName || "",
    family_name: user.familyName || "",
    locale: user.locale || "",
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    let { error: userError } = await supabase
      .from("users")
      .upsert(userRecord, { onConflict: "id" });
    if (
      userError?.code === "PGRST204" &&
      String(userError.message || "").includes("newsletter_consent")
    ) {
      const { newsletter_consent, ...schemaCompatibleRecord } = userRecord;
      const retry = await supabase
        .from("users")
        .upsert(schemaCompatibleRecord, { onConflict: "id" });
      userError = retry.error;
    }
    if (userError) throw userError;

    const { data: currentRole, error: currentRoleError } = await supabase
      .from("user_roles")
      .select("role,assigned_by")
      .eq("user_id", String(user.id))
      .maybeSingle();
    if (currentRoleError) throw currentRoleError;

    const currentRoleValue = normalizePersistedRole(currentRole?.role);
    if (currentRole && !currentRoleValue) {
      throw new Error("The stored user role is not supported.");
    }
    let legacyRoleValue = null;
    if (!currentRole && user.email) {
      const { data: legacyRole, error: legacyRoleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", String(user.email).trim().toLowerCase())
        .maybeSingle();
      if (legacyRoleError) throw legacyRoleError;
      legacyRoleValue = normalizePersistedRole(legacyRole?.role);
      if (legacyRole && !legacyRoleValue) {
        throw new Error("The stored user role is not supported.");
      }
    }

    if (!currentRole) {
      const initialRoleValue =
        legacyRoleValue ||
        normalizePersistedRole(initialRole) ||
        "Standard User";
      const { error: roleError } = await supabase.from("user_roles").upsert(
        {
          user_id: user.id,
          role: initialRoleValue,
          assigned_by: "system",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: true,
        },
      );
      if (roleError) throw roleError;
    } else if (currentRoleValue !== currentRole.role) {
      const { error: roleError } = await supabase.from("user_roles").upsert(
        {
          user_id: user.id,
          role: currentRoleValue,
          assigned_by: currentRole.assigned_by || "system",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (roleError) throw roleError;
    }
  }

  try {
    writeUserSheetRow(userSheetRecord);
  } catch (error) {
    console.warn("User sheet export failed:", error?.message || error);
  }
}

async function getUserCount() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

async function getEstimateGenerationCount() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { count, error } = await supabase
    .from("estimate_generation_events")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

async function getEstimateCategorySummary() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_estimates")
    .select("result,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data;
}

async function recordEstimateGeneration(userId = null) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("estimate_generation_events")
    .insert({ user_id: userId || null });
  if (error) throw error;
  return true;
}

async function saveUserEstimate(user, estimate) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_estimates")
    .insert({
      user_id: user.id,
      result: estimate.result,
      source_description: estimate.sourceDescription,
      source_deliverables: estimate.sourceDeliverables || "",
    })
    .select("id,created_at")
    .single();
  if (error) throw error;
  return data;
}

async function getUserEstimates(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_estimates")
    .select("id,result,source_description,source_deliverables,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

async function deleteUserEstimate(userId, estimateId) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("user_estimates")
    .delete()
    .eq("user_id", userId)
    .eq("id", estimateId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

async function deleteAllUserEstimates(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_estimates")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

async function saveUserRole(
  userId,
  role,
  assignedBy = "admin",
  userEmail = null,
) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role,
      assigned_by: assignedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return false;
  return true;
}

async function getUserRoles() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id,role,assigned_by,updated_at");
  if (error) return null;
  return data;
}

async function getRegisteredUsers() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const [
    { data: users, error: usersError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    supabase.from("users").select("id,email,name,picture,last_seen_at"),
    supabase.from("user_roles").select("user_id,role"),
  ]);
  if (usersError) throw usersError;
  if (rolesError) throw rolesError;

  const rolesByUserId = new Map(
    (roles || []).map((row) => [String(row.user_id), row.role]),
  );
  const rolesByEmail = new Map(
    (roles || [])
      .filter((row) => String(row.user_id).includes("@"))
      .map((row) => [String(row.user_id).trim().toLowerCase(), row.role]),
  );

  return (users || []).map((user) => ({
    ...user,
    role:
      rolesByUserId.get(String(user.id)) ||
      rolesByEmail.get(
        String(user.email || "")
          .trim()
          .toLowerCase(),
      ) ||
      null,
  }));
}

async function getUserByEmail(email) {
  const supabase = getSupabaseClient();
  if (!supabase || !email) return null;
  let { data, error } = await supabase
    .from("users")
    .select(
      "id,email,name,skill_work,picture,newsletter_consent,account_status",
    )
    .eq("email", String(email).trim().toLowerCase())
    .maybeSingle();
  if (
    error?.code === "PGRST204" &&
    String(error.message || "").includes("newsletter_consent")
  ) {
    const fallback = await supabase
      .from("users")
      .select("id,email,name,skill_work,picture,account_status")
      .eq("email", String(email).trim().toLowerCase())
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;
  return data;
}

async function getUserById(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("users")
    .select("id,email,name,skill_work,account_status,suspension_reason")
    .eq("id", String(userId).trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getEmailEvent(userId, emailType) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId || !emailType) return null;
  const { data, error } = await supabase
    .from("email_events")
    .select(
      "id,user_id,email_type,status,provider_message_id,sent_at,created_at",
    )
    .eq("user_id", String(userId))
    .eq("email_type", String(emailType))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function enqueueEmailEvent({
  userId,
  emailType,
  eventKey,
  recipientEmail,
  payload,
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Notification storage is not configured.");
  const { data, error } = await supabase.rpc("enqueue_email_event", {
    p_user_id: String(userId),
    p_email_type: String(emailType),
    p_event_key: String(eventKey),
    p_recipient_email: String(recipientEmail),
    p_payload: payload || {},
  });
  if (error) throw error;
  return data;
}

async function enqueueEmailEvents(events) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Notification storage is not configured.");
  const { data, error } = await supabase.rpc("enqueue_email_events", {
    p_events: events.map((event) => ({
      user_id: String(event.userId),
      event_type: String(event.emailType),
      event_key: String(event.eventKey),
      recipient_email: String(event.recipientEmail),
      payload: event.payload || {},
    })),
  });
  if (error) throw error;
  return Number(data) || 0;
}

async function dispatchEmailNotifications() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Notification storage is not configured.");
  const { data, error } = await supabase.functions.invoke(
    "send-email-notifications",
    { body: {} },
  );
  if (error) throw error;
  return data;
}

async function updateUserRoleWithNotifications({
  userId,
  role,
  assignedBy,
  expectedPreviousRole,
  userPayload,
  adminPayload,
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Role storage is not configured.");
  const { data, error } = await supabase.rpc(
    "update_user_role_with_notifications",
    {
      p_user_id: String(userId),
      p_role: String(role),
      p_assigned_by: String(assignedBy || "admin"),
      p_expected_previous_role: String(expectedPreviousRole),
      p_user_payload: userPayload || {},
      p_admin_payload: adminPayload || {},
    },
  );
  if (error) throw error;
  return data;
}

async function setUserSuspensionWithNotification({
  userId,
  suspended,
  reason,
  suspendedPayload,
  restoredPayload,
}) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Account storage is not configured.");
  const { data, error } = await supabase.rpc(
    "set_user_suspension_with_notification",
    {
      p_user_id: String(userId),
      p_suspended: Boolean(suspended),
      p_reason: String(reason || ""),
      p_suspended_payload: suspendedPayload || {},
      p_restored_payload: restoredPayload || {},
    },
  );
  if (error) throw error;
  return data;
}

async function setMarketingConsent(userId, consent) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Account storage is not configured.");
  const { data, error } = await supabase.rpc("set_marketing_consent", {
    p_user_id: String(userId),
    p_consent: Boolean(consent),
  });
  if (error) throw error;
  return Boolean(data);
}

async function unsubscribeEmailMarketing(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Account storage is not configured.");
  const { data, error } = await supabase.rpc("unsubscribe_email_marketing", {
    p_user_id: String(userId),
  });
  if (error) throw error;
  return Boolean(data);
}

async function getMarketingRecipients() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Account storage is not configured.");
  const users = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("users")
      .select("id,email,name")
      .eq("newsletter_consent", true)
      .eq("account_status", "active")
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    users.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  const eligibleUsers = [];
  for (let offset = 0; offset < users.length; offset += pageSize) {
    const batch = users.slice(offset, offset + pageSize);
    if (!batch.length) continue;
    const { data: preferences, error } = await supabase
      .from("email_preferences")
      .select("user_id,marketing_unsubscribed_at")
      .in(
        "user_id",
        batch.map((user) => String(user.id)),
      );
    if (error) throw error;
    const unsubscribedIds = new Set(
      (preferences || [])
        .filter((entry) => entry.marketing_unsubscribed_at)
        .map((entry) => String(entry.user_id)),
    );
    eligibleUsers.push(
      ...batch.filter(
        (user) =>
          user.email && !unsubscribedIds.has(String(user.id)),
      ),
    );
  }
  return eligibleUsers;
}

async function getUserAccountStatus(userId) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Account storage is not configured.");
  const { data, error } = await supabase
    .from("users")
    .select("account_status")
    .eq("id", String(userId))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The user's account profile is missing.");
  return data.account_status || "active";
}

async function savePricingConfig(
  category,
  basePrice,
  minimumPrice,
  maximumPrice,
  updatedBy = "admin",
) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("pricing_configurations").upsert(
    {
      category,
      base_price: basePrice,
      minimum_price: minimumPrice,
      maximum_price: maximumPrice,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "category" },
  );
  if (error) return false;
  return true;
}

async function getPricingConfigs() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pricing_configurations")
    .select(
      "category,base_price,minimum_price,maximum_price,updated_by,updated_at",
    );
  if (error) return null;
  return data;
}

module.exports = {
  getSupabaseConfig,
  getSupabaseAuthConfig,
  getSupabaseClient,
  deleteUserSheetRowsByEmail,
  isSupabaseConfigured,
  savePricingFeedback,
  getPricingFeedback,
  deletePricingFeedback,
  saveAdminNotification,
  getAdminNotifications,
  deleteAdminNotifications,
  saveAuditLog,
  getAuditLogs,
  deleteAuditLogs,
  saveUserRole,
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
};
