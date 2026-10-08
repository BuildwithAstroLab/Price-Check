require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");
const { getSupabaseClient, getSupabaseConfig } = require("../lib/supabase");

const PRESERVED_EMAIL = "realemmy55@gmail.com";
const APPROVED_PROTECTED_AUTH_ID = "9a5098e7-3e3e-45b5-9ed3-7b8763caf7ba";
const APPROVED_PROTECTED_PROFILE_ID = "117397307288054651104";
const CONFIRMATION = `DELETE ALL USERS EXCEPT ${PRESERVED_EMAIL}`;
const PAGE_SIZE = 1000;
const CHUNK_SIZE = 100;
const CONFIRMED_ABSENT_OPTIONAL_TABLES = {
  email_events: {
    evidence:
      "Supabase SQL inspection: to_regclass('public.email_events') returned NULL",
  },
};
const KNOWN_USER_REFERENCES = new Set([
  "users.email",
  "user_roles.user_id",
  "user_roles.assigned_by",
  "user_estimates.user_id",
  "estimate_generation_events.user_id",
  "email_events.user_id",
  "audit_logs.actor",
  "pricing_configurations.updated_by",
]);
const USER_REFERENCE_COLUMN =
  /^(user_id|auth_user_id|owner_id|created_by|actor_id|assigned_by|updated_by|actor)$/i;

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isPreservedReference(value, preservedIds, preservedEmail) {
  const reference = String(value || "").trim();
  return preservedIds.has(reference) || normalize(reference) === preservedEmail;
}

function isIdentityLike(value) {
  const normalized = String(value || "").trim();
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(normalized)
  );
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else if (char !== "\r") {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function readCsvSheet(sheetPath) {
  if (!fs.existsSync(sheetPath)) {
    return { path: sheetPath, headers: [], rows: [], missing: true };
  }
  const content = fs.readFileSync(sheetPath, "utf8").trim();
  if (!content)
    return { path: sheetPath, headers: [], rows: [], missing: false };
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "").map((header) =>
    header.trim(),
  );
  const rows = lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    );
  });
  return { path: sheetPath, headers, rows, missing: false };
}

function writeCsvSheet(sheet) {
  if (sheet.missing || !sheet.headers.length) return;
  const header = sheet.headers.map(csvEscape).join(",");
  const body = sheet.rows
    .map((row) =>
      sheet.headers.map((column) => csvEscape(row[column])).join(","),
    )
    .join("\n");
  fs.writeFileSync(sheet.path, `${header}\n${body ? `${body}\n` : ""}`, "utf8");
}

function buildCleanupPlan(inventory, preservedEmail = PRESERVED_EMAIL) {
  const keepEmail = normalize(preservedEmail);
  const preservedAuthUsers = inventory.authUsers.filter(
    (user) => normalize(user.email) === keepEmail,
  );
  const preservedProfiles = inventory.users.filter(
    (user) => normalize(user.email) === keepEmail,
  );
  if (preservedAuthUsers.length !== 1 || preservedProfiles.length !== 1) {
    throw new Error(
      "The preserved Auth user and exactly one application profile must exist.",
    );
  }

  const preservedAuth = preservedAuthUsers[0];
  const preservedProfile = preservedProfiles[0];
  const preservedIds = new Set(
    [preservedAuth.id, preservedProfile.id, keepEmail]
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );
  const protectedRows = (rows, column) =>
    rows.filter((row) =>
      isPreservedReference(row[column], preservedIds, keepEmail),
    );
  const preservedRoleRows = protectedRows(inventory.roles, "user_id");
  if (
    !preservedRoleRows.length ||
    !preservedRoleRows.some((role) =>
      ["Owner", "Super Admin"].includes(role.role),
    )
  ) {
    throw new Error(
      "The preserved account must already have an Owner or Super Admin role.",
    );
  }

  const deletedAuthUsers = inventory.authUsers.filter(
    (user) => user.id !== preservedAuth.id,
  );
  const protectedUsers = protectedRows(inventory.users, "email");
  const deletedUsers = inventory.users.filter(
    (user) => !protectedUsers.includes(user),
  );
  const knownIdentities = new Set(preservedIds);
  for (const user of inventory.authUsers) {
    if (user.id !== preservedAuth.id) knownIdentities.add(String(user.id));
    if (normalize(user.email) !== keepEmail)
      knownIdentities.add(normalize(user.email));
  }
  for (const user of inventory.users) {
    if (normalize(user.email) !== keepEmail) {
      knownIdentities.add(String(user.id));
      knownIdentities.add(normalize(user.email));
    }
  }
  const deletedIdentities = new Set(
    [...knownIdentities].filter((id) => !preservedIds.has(id)),
  );

  const deletedRoles = inventory.roles.filter(
    (row) => !isPreservedReference(row.user_id, preservedIds, keepEmail),
  );
  const protectedEstimates = protectedRows(inventory.estimates, "user_id");
  const deletedEstimates = inventory.estimates.filter(
    (row) => !isPreservedReference(row.user_id, preservedIds, keepEmail),
  );
  const deletedEstimateIds = new Set(
    deletedEstimates.map((row) => String(row.id)),
  );
  const existingEstimateIds = new Set(
    inventory.estimates.map((row) => String(row.id)),
  );
  const protectedEstimateIds = new Set(
    protectedEstimates.map((row) => String(row.id)),
  );
  const isProtectedEstimateEvent = (row) =>
    isPreservedReference(row.user_id, preservedIds, keepEmail) ||
    (row.source_estimate_id != null &&
      protectedEstimateIds.has(String(row.source_estimate_id)));
  const protectedEstimateEvents = inventory.estimateEvents.filter(
    isProtectedEstimateEvent,
  );
  const deletedEstimateEvents = inventory.estimateEvents.filter((row) => {
    if (isProtectedEstimateEvent(row)) return false;
    const userId = String(row.user_id || "").trim();
    return (
      Boolean(userId) ||
      (row.source_estimate_id != null &&
        (deletedEstimateIds.has(String(row.source_estimate_id)) ||
          !existingEstimateIds.has(String(row.source_estimate_id))))
    );
  });
  const protectedEmailEvents = Array.isArray(inventory.emailEvents)
    ? protectedRows(inventory.emailEvents, "user_id")
    : [];
  const deletedEmailEvents = Array.isArray(inventory.emailEvents)
    ? inventory.emailEvents.filter(
        (row) => !isPreservedReference(row.user_id, preservedIds, keepEmail),
      )
    : [];
  const protectedAuditLogs = protectedRows(inventory.auditLogs, "actor");
  const deletedAuditLogs = inventory.auditLogs.filter((row) => {
    const actor = String(row.actor || "").trim();
    if (!actor || protectedAuditLogs.includes(row)) return false;
    return (
      deletedIdentities.has(actor) || deletedIdentities.has(normalize(actor))
    );
  });
  const protectedPricingConfigurations = protectedRows(
    inventory.pricingConfigurations,
    "updated_by",
  );
  const pricingAttributionsToClear = inventory.pricingConfigurations.filter(
    (row) => {
      const actor = String(row.updated_by || "").trim();
      if (!actor || protectedPricingConfigurations.includes(row)) return false;
      return (
        deletedIdentities.has(actor) || deletedIdentities.has(normalize(actor))
      );
    },
  );

  const protectedCsvRows = protectedRows(inventory.csv.rows, "email");
  const csvRowsToDelete = inventory.csv.rows.filter(
    (row) => !protectedCsvRows.includes(row) && Boolean(normalize(row.email)),
  );
  const csvRowsUnclassified = inventory.csv.rows.filter(
    (row) => !normalize(row.email),
  );
  const matchedProfileEmails = new Set(
    inventory.users.map((row) => normalize(row.email)),
  );
  const usersMissingProfiles = deletedAuthUsers.filter(
    (user) => !matchedProfileEmails.has(normalize(user.email)),
  );
  const authEmails = new Set(
    inventory.authUsers.map((row) => normalize(row.email)),
  );
  const profilesWithoutAuth = deletedUsers.filter(
    (user) => !authEmails.has(normalize(user.email)),
  );

  const orphanRoleRows = inventory.roles.filter(
    (row) =>
      !isPreservedReference(row.user_id, preservedIds, keepEmail) &&
      !knownIdentities.has(String(row.user_id || "").trim()),
  );
  const orphanEstimateRows = inventory.estimates.filter(
    (row) =>
      !isPreservedReference(row.user_id, preservedIds, keepEmail) &&
      !knownIdentities.has(String(row.user_id || "").trim()),
  );
  const orphanEstimateEvents = inventory.estimateEvents.filter((row) => {
    if (isProtectedEstimateEvent(row)) return false;
    const userId = String(row.user_id || "").trim();
    return (
      (userId && !knownIdentities.has(userId)) ||
      (row.source_estimate_id != null &&
        !existingEstimateIds.has(String(row.source_estimate_id)))
    );
  });
  const protectedOrphanEstimateEvents = protectedEstimateEvents.filter(
    (row) =>
      row.source_estimate_id != null &&
      !existingEstimateIds.has(String(row.source_estimate_id)),
  );
  const orphanCounts = {
    userRoles: orphanRoleRows.length,
    userEstimates: orphanEstimateRows.length,
    estimateGenerationEvents: orphanEstimateEvents.length,
    protectedUserRoles: 0,
    protectedUserEstimates: 0,
    protectedEstimateGenerationEvents: protectedOrphanEstimateEvents.length,
  };
  const unrelatedOrphanRecords = {
    user_roles: orphanRoleRows,
    user_estimates: orphanEstimateRows,
    estimate_generation_events: orphanEstimateEvents,
    users_without_auth: profilesWithoutAuth,
  };
  const protectedOrphanRecords = {
    user_roles: [],
    user_estimates: [],
    estimate_generation_events: protectedOrphanEstimateEvents,
    email_events: [],
  };
  const orphanRecordIds = {
    user_roles: orphanRoleRows.map((row) => row.user_id),
    user_estimates: orphanEstimateRows.map((row) => row.id),
    estimate_generation_events: orphanEstimateEvents.map((row) => row.id),
    protected_user_roles: [],
    protected_user_estimates: [],
    protected_estimate_generation_events: protectedOrphanEstimateEvents.map(
      (row) => row.id,
    ),
  };
  const records = {
    users: deletedUsers.length,
    user_roles: deletedRoles.length,
    user_estimates: deletedEstimates.length,
    estimate_generation_events: deletedEstimateEvents.length,
    email_events: Array.isArray(inventory.emailEvents)
      ? deletedEmailEvents.length
      : inventory.tableStatuses?.email_events?.status === "confirmed_absent"
        ? 0
        : null,
    audit_logs: deletedAuditLogs.length,
    pricing_configurations_attribution_cleared:
      pricingAttributionsToClear.length,
    user_details_csv: csvRowsToDelete.length,
  };
  const blockers = [];
  if (csvRowsUnclassified.length)
    blockers.push("Local user sheet contains rows without an email.");
  if (inventory.unknownUserReferences.length) {
    blockers.push("The live schema contains unhandled user-reference columns.");
  }
  if ((inventory.schemaWarnings || []).length) {
    blockers.push(...inventory.schemaWarnings);
  }

  const plan = {
    preservedEmail: keepEmail,
    preservedAuth,
    preservedProfile,
    preservedRoleRows,
    preservedIds,
    deletedAuthUsers,
    deletedUsers,
    deletedRoles,
    deletedEstimates,
    deletedEstimateEvents,
    deletedEmailEvents,
    deletedAuditLogs,
    pricingAttributionsToClear,
    protectedRecords: {
      auth_users: preservedAuthUsers,
      users: protectedUsers,
      user_roles: preservedRoleRows,
      user_estimates: protectedEstimates,
      estimate_generation_events: protectedEstimateEvents,
      email_events: protectedEmailEvents,
      audit_logs: protectedAuditLogs,
      pricing_configurations: protectedPricingConfigurations,
      user_details_csv: protectedCsvRows,
    },
    protectedOrphanRecords,
    unrelatedOrphanRecords,
    orphanRecordIds,
    emailEventsInspectable:
      Array.isArray(inventory.emailEvents) ||
      inventory.tableStatuses?.email_events?.status === "confirmed_absent",
    tableStatuses: inventory.tableStatuses || {},
    schemaDrift: inventory.schemaDrift || [],
    records,
    orphanCounts,
    usersMissingProfiles: usersMissingProfiles.length,
    profilesWithoutAuth: profilesWithoutAuth.length,
    csvRowsToDelete,
    blockers,
    totalAuthUsers: inventory.authUsers.length,
  };
  assertNoProtectedRecordsScheduled(plan);
  return plan;
}

function assertNoProtectedRecordsScheduled(plan) {
  const protectedReference = (value) =>
    isPreservedReference(value, plan.preservedIds, plan.preservedEmail);
  const protectedEstimateIds = new Set(
    plan.protectedRecords.user_estimates.map((row) => String(row.id)),
  );
  const scheduledProtected =
    plan.deletedAuthUsers.some(
      (row) =>
        row.id === plan.preservedAuth.id ||
        normalize(row.email) === plan.preservedEmail,
    ) ||
    plan.deletedUsers.some(
      (row) =>
        row.id === plan.preservedProfile.id ||
        normalize(row.email) === plan.preservedEmail,
    ) ||
    plan.deletedRoles.some((row) => protectedReference(row.user_id)) ||
    plan.deletedEstimates.some(
      (row) =>
        protectedReference(row.user_id) ||
        protectedEstimateIds.has(String(row.id)),
    ) ||
    plan.deletedEstimateEvents.some(
      (row) =>
        protectedReference(row.user_id) ||
        (row.source_estimate_id != null &&
          protectedEstimateIds.has(String(row.source_estimate_id))),
    ) ||
    plan.deletedEmailEvents.some((row) => protectedReference(row.user_id)) ||
    plan.deletedAuditLogs.some((row) => protectedReference(row.actor)) ||
    plan.pricingAttributionsToClear.some((row) =>
      protectedReference(row.updated_by),
    ) ||
    plan.csvRowsToDelete.some(
      (row) =>
        protectedReference(row.email) || row.id === plan.preservedProfile.id,
    );
  if (scheduledProtected) {
    throw new Error(
      "Cleanup plan includes a record owned by the protected user.",
    );
  }
}

function sortedStrings(values) {
  return values.map(String).sort();
}

function assertApprovedPreDeletePlan(plan) {
  if (
    normalize(plan.preservedEmail) !== PRESERVED_EMAIL ||
    normalize(plan.preservedAuth.email) !== PRESERVED_EMAIL ||
    plan.preservedAuth.id !== APPROVED_PROTECTED_AUTH_ID ||
    plan.preservedProfile.id !== APPROVED_PROTECTED_PROFILE_ID ||
    !plan.preservedRoleRows.some(
      (row) =>
        row.user_id === APPROVED_PROTECTED_PROFILE_ID && row.role === "Owner",
    )
  ) {
    throw new Error(
      "Protected account identity or Owner role differs from approval.",
    );
  }
  if (
    plan.protectedRecords.user_estimates.length !== 7 ||
    plan.protectedRecords.estimate_generation_events.length !== 17 ||
    !["3", "4", "14"].every((id) =>
      plan.protectedOrphanRecords.estimate_generation_events.some(
        (row) => String(row.id) === id,
      ),
    )
  ) {
    throw new Error(
      "Protected estimate or analytics-event counts differ from approval.",
    );
  }
  const expectedIds = {
    deletedAuthUsers: [
      "351efd94-3ed6-4cef-af6b-c5473e3ccc88",
      "7b4be973-87cf-4632-a62d-b16d467df8c4",
      "c08469b1-7091-4276-a325-f987f8461e2d",
    ],
    deletedUsers: [
      "112751774980411941634",
      "102975357305555361866",
      "c08469b1-7091-4276-a325-f987f8461e2d",
    ],
    deletedRoles: [
      "user-standard",
      "112751774980411941634",
      "cybroxstudios@gmail.com",
      "102975357305555361866",
      "c08469b1-7091-4276-a325-f987f8461e2d",
    ],
    deletedEstimates: ["1", "2"],
    deletedEstimateEvents: ["1", "2"],
    csvRowsToDelete: [
      "112751774980411941634",
      "117938791007856607522",
      "102975357305555361866",
      "c08469b1-7091-4276-a325-f987f8461e2d",
    ],
  };
  const actualIds = {
    deletedAuthUsers: plan.deletedAuthUsers.map((row) => row.id),
    deletedUsers: plan.deletedUsers.map((row) => row.id),
    deletedRoles: plan.deletedRoles.map((row) => row.user_id),
    deletedEstimates: plan.deletedEstimates.map((row) => row.id),
    deletedEstimateEvents: plan.deletedEstimateEvents.map((row) => row.id),
    csvRowsToDelete: plan.csvRowsToDelete.map((row) => row.id || row.email),
  };
  for (const key of Object.keys(expectedIds)) {
    if (
      JSON.stringify(sortedStrings(actualIds[key])) !==
      JSON.stringify(sortedStrings(expectedIds[key]))
    ) {
      throw new Error(
        `Deletion candidates for ${key} differ from the approved dry run.`,
      );
    }
  }
  if (
    plan.blockers.length ||
    plan.records.email_events !== 0 ||
    plan.totalAuthUsers !== 4
  ) {
    throw new Error(
      "The approved cleanup plan has blockers or protected candidates.",
    );
  }
  assertNoProtectedRecordsScheduled(plan);
}

async function assertDeletePermissionWithoutRows(
  supabase,
  table,
  column,
  value,
) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(column, value)
    .select(column);
  if (error) {
    throw new Error(`Delete permission preflight failed for ${table}.`);
  }
  if ((data || []).length) {
    throw new Error(
      `Delete permission preflight unexpectedly matched a row in ${table}.`,
    );
  }
}

async function preflightDeletePermissions(supabase, plan) {
  const probes = [
    ["estimate_generation_events", "id", -9000000000000000],
    ["user_estimates", "id", -9000000000000000],
    ["user_roles", "user_id", "__pricecheck_cleanup_permission_probe__"],
    ["users", "id", "__pricecheck_cleanup_permission_probe__"],
  ];
  for (const [table, column, value] of probes) {
    const hasPlannedDeletes =
      {
        estimate_generation_events: plan.deletedEstimateEvents.length,
        user_estimates: plan.deletedEstimates.length,
        user_roles: plan.deletedRoles.length,
        users: plan.deletedUsers.length,
      }[table] > 0;
    if (hasPlannedDeletes) {
      await assertDeletePermissionWithoutRows(supabase, table, column, value);
    }
  }
}

function summarizePlan(plan) {
  const candidateIds = {
    auth_users: plan.deletedAuthUsers.map((row) => ({
      id: row.id,
      email: row.email || null,
    })),
    users: plan.deletedUsers.map((row) => row.id),
    user_roles: plan.deletedRoles.map((row) => row.user_id),
    user_estimates: plan.deletedEstimates.map((row) => row.id),
    estimate_generation_events: plan.deletedEstimateEvents.map((row) => row.id),
    email_events: plan.emailEventsInspectable
      ? plan.deletedEmailEvents.map((row) => row.id)
      : null,
    audit_logs: plan.deletedAuditLogs.map((row) => row.id),
    pricing_configurations_attribution_cleared:
      plan.pricingAttributionsToClear.map((row) => row.category),
    user_details_csv: plan.csvRowsToDelete.map((row) => row.id || row.email),
  };
  const protectedIds = Object.fromEntries(
    Object.entries(plan.protectedRecords).map(([table, rows]) => [
      table,
      rows.map((row) => row.id ?? row.user_id ?? row.email ?? row.category),
    ]),
  );
  const protectedOrphans = Object.fromEntries(
    Object.entries(plan.protectedOrphanRecords).map(([table, rows]) => [
      table,
      rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        source_estimate_id: row.source_estimate_id,
      })),
    ]),
  );
  const unrelatedOrphans = Object.fromEntries(
    Object.entries(plan.unrelatedOrphanRecords).map(([table, rows]) => [
      table,
      rows.map((row) => row.id ?? row.user_id ?? row.email),
    ]),
  );
  return {
    dryRun: true,
    preservedUser: {
      email: plan.preservedEmail,
      authUserId: plan.preservedAuth.id,
      profileId: plan.preservedProfile.id,
      roles: plan.preservedRoleRows.map((row) => ({
        userId: row.user_id,
        role: row.role,
      })),
    },
    totalAuthUsersFound: plan.totalAuthUsers,
    usersPreserved: 1,
    authUsersScheduledForDeletion: plan.deletedAuthUsers.length,
    authUsersToDelete: plan.deletedAuthUsers.map((user) => ({
      id: user.id,
      email: user.email || null,
    })),
    applicationRecords: plan.records,
    deletionCandidatesByTable: candidateIds,
    applicationRecordIdsToDelete: candidateIds,
    protectedRecordCounts: Object.fromEntries(
      Object.entries(plan.protectedRecords).map(([table, rows]) => [
        table,
        rows.length,
      ]),
    ),
    protectedRecordsByTable: protectedIds,
    protectedOrphanCounts: Object.fromEntries(
      Object.entries(plan.protectedOrphanRecords).map(([table, rows]) => [
        table,
        rows.length,
      ]),
    ),
    protectedOrphanRecordsByTable: protectedOrphans,
    unrelatedOrphanCounts: Object.fromEntries(
      Object.entries(plan.unrelatedOrphanRecords).map(([table, rows]) => [
        table,
        rows.length,
      ]),
    ),
    unrelatedOrphanRecordsByTable: unrelatedOrphans,
    protectedRecordsInDeletionPlan: false,
    tablesAffected: Object.entries(plan.records)
      .filter(([, count]) => count > 0)
      .map(([table]) => table),
    usersMissingApplicationProfiles: plan.usersMissingProfiles,
    applicationProfilesWithoutAuthUsers: plan.profilesWithoutAuth,
    orphanedUserReferences: plan.orphanCounts,
    foreignKeys: {
      user_estimates_user_id:
        "ON DELETE CASCADE to users.id; rows are explicitly removed first",
      estimate_generation_events_user_id:
        "No declared foreign key; rows are explicitly removed",
      estimate_generation_events_source_estimate_id:
        "Unique reference without declared foreign key; dependent events are explicitly removed",
      user_roles_user_id:
        "No declared foreign key; rows are explicitly removed",
      audit_logs_actor:
        "Text actor reference; exact deleted identities are removed",
    },
    unhandledSchemaReferences: 0,
    schemaWarnings: plan.blockers.filter((warning) =>
      warning.includes("schema"),
    ),
    schemaDrift: plan.schemaDrift,
    liveTableStatuses: plan.tableStatuses,
    blockers: plan.blockers,
  };
}

function assertExplicitConfirmation(execute, confirmation) {
  if (!execute || confirmation !== CONFIRMATION) {
    throw new Error(
      "Execution requires --execute and the exact irreversible confirmation phrase.",
    );
  }
}

async function fetchAllRows(supabase, table, columns) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function fetchOptionalEmailEvents(supabase, isListedByPostgrest) {
  try {
    const rows = await fetchAllRows(supabase, "email_events", "id,user_id");
    return { rows, status: rows.length ? "present" : "present_zero_rows" };
  } catch (error) {
    if (error?.code === "PGRST205") {
      const confirmedAbsent = CONFIRMED_ABSENT_OPTIONAL_TABLES.email_events;
      if (confirmedAbsent && !isListedByPostgrest) {
        return {
          rows: null,
          status: "confirmed_absent",
          evidence: confirmedAbsent.evidence,
        };
      }
      return {
        rows: null,
        status: "exists_uninspectable",
        errorCode: error.code,
      };
    }
    throw error;
  }
}

async function listAllAuthUsers(supabase) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) throw error;
    users.push(...(data.users || []));
    if (!data.users || data.users.length < PAGE_SIZE) return users;
  }
}

async function inspectLiveSchema() {
  const { url, serviceRoleKey } = getSupabaseConfig();
  if (!url || !serviceRoleKey)
    throw new Error("Supabase service configuration is unavailable.");
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/openapi+json",
    },
  });
  if (!response.ok)
    throw new Error("Unable to inspect the live Supabase schema.");
  const specification = await response.json();
  const unknownUserReferences = [];
  for (const [table, definition] of Object.entries(
    specification.definitions || {},
  )) {
    for (const column of Object.keys(definition.properties || {})) {
      if (
        USER_REFERENCE_COLUMN.test(column) &&
        !KNOWN_USER_REFERENCES.has(`${table}.${column}`)
      ) {
        unknownUserReferences.push({ table, column });
      }
    }
  }
  return {
    tableNames: Object.keys(specification.definitions || {}),
    unknownUserReferences,
  };
}

async function readInventory(supabase, rootDir) {
  const schema = await inspectLiveSchema();
  const tableColumns = {
    users: "id,email",
    user_roles: "user_id,role,assigned_by,updated_at",
    user_estimates: "id,user_id",
    estimate_generation_events: "id,user_id,source_estimate_id",
    audit_logs: "id,actor",
    pricing_configurations: "category,updated_by",
  };
  const missingRequiredTables = Object.keys(tableColumns).filter(
    (table) => !schema.tableNames.includes(table),
  );
  if (missingRequiredTables.length) {
    throw new Error(
      "One or more required cleanup tables are missing from the live schema.",
    );
  }
  const liveTableStatuses = Object.fromEntries(
    Object.keys(tableColumns).map((table) => [table, { status: "present" }]),
  );
  const [
    authUsers,
    users,
    roles,
    estimates,
    estimateEvents,
    emailEventsResult,
    auditLogs,
    pricingConfigurations,
  ] = await Promise.all([
    listAllAuthUsers(supabase),
    fetchAllRows(supabase, "users", tableColumns.users),
    fetchAllRows(supabase, "user_roles", tableColumns.user_roles),
    fetchAllRows(supabase, "user_estimates", tableColumns.user_estimates),
    fetchAllRows(
      supabase,
      "estimate_generation_events",
      tableColumns.estimate_generation_events,
    ),
    fetchOptionalEmailEvents(
      supabase,
      schema.tableNames.includes("email_events"),
    ),
    fetchAllRows(supabase, "audit_logs", tableColumns.audit_logs),
    fetchAllRows(
      supabase,
      "pricing_configurations",
      tableColumns.pricing_configurations,
    ),
  ]);
  const sheetPath =
    process.env.USER_SHEET_PATH ||
    path.join(rootDir, "data", "user-details.csv");
  const emailEventsStatus = emailEventsResult.status;
  liveTableStatuses.email_events = {
    status: emailEventsStatus,
    rowCount: Array.isArray(emailEventsResult.rows)
      ? emailEventsResult.rows.length
      : emailEventsStatus === "confirmed_absent"
        ? 0
        : null,
    ...(emailEventsResult.evidence
      ? { evidence: emailEventsResult.evidence }
      : {}),
  };
  liveTableStatuses.users.rowCount = users.length;
  liveTableStatuses.user_roles.rowCount = roles.length;
  liveTableStatuses.user_estimates.rowCount = estimates.length;
  liveTableStatuses.estimate_generation_events.rowCount = estimateEvents.length;
  const emailEventsWarning =
    emailEventsStatus === "exists_uninspectable"
      ? "email_events exists or may exist but cannot be inspected through the live PostgREST schema cache."
      : null;
  const schemaDrift = schema.tableNames.includes("email_events")
    ? []
    : [
        "email_events: declared by repository migration, absent from live database",
      ];
  return {
    authUsers,
    users,
    roles,
    estimates,
    estimateEvents,
    emailEvents: emailEventsResult.rows,
    auditLogs,
    pricingConfigurations,
    csv: readCsvSheet(sheetPath),
    unknownUserReferences: schema.unknownUserReferences,
    schemaWarnings: emailEventsWarning ? [emailEventsWarning] : [],
    tableStatuses: liveTableStatuses,
    schemaDrift,
    migrationDefinedUserLinkedTables: ["email_events"],
    schemaTables: schema.tableNames,
  };
}

async function deleteRowsById(supabase, table, column, rows) {
  let deleted = 0;
  for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
    const ids = rows
      .slice(offset, offset + CHUNK_SIZE)
      .map((row) => row[column]);
    if (!ids.length) continue;
    const { data, error } = await supabase
      .from(table)
      .delete()
      .in(column, ids)
      .select(column);
    if (error) throw error;
    deleted += (data || []).length;
  }
  return deleted;
}

async function executeCleanup(supabase, plan, inventory) {
  const counts = {};
  if (plan.deletedEmailEvents.length) {
    counts.email_events = await deleteRowsById(
      supabase,
      "email_events",
      "id",
      plan.deletedEmailEvents,
    );
  }
  counts.estimate_generation_events = await deleteRowsById(
    supabase,
    "estimate_generation_events",
    "id",
    plan.deletedEstimateEvents,
  );
  counts.audit_logs = await deleteRowsById(
    supabase,
    "audit_logs",
    "id",
    plan.deletedAuditLogs,
  );
  counts.user_estimates = await deleteRowsById(
    supabase,
    "user_estimates",
    "id",
    plan.deletedEstimates,
  );
  counts.user_roles = await deleteRowsById(
    supabase,
    "user_roles",
    "user_id",
    plan.deletedRoles,
  );
  counts.users = await deleteRowsById(
    supabase,
    "users",
    "id",
    plan.deletedUsers,
  );

  const deletedIdentities = new Set();
  for (const user of plan.deletedAuthUsers) {
    deletedIdentities.add(String(user.id));
    if (user.email) deletedIdentities.add(normalize(user.email));
  }
  for (const user of plan.deletedUsers) {
    deletedIdentities.add(String(user.id));
    if (user.email) deletedIdentities.add(normalize(user.email));
  }
  for (const row of plan.pricingAttributionsToClear) {
    const { error } = await supabase
      .from("pricing_configurations")
      .update({ updated_by: null })
      .eq("category", row.category)
      .eq("updated_by", row.updated_by);
    if (error) throw error;
  }
  counts.pricing_configurations_attribution_cleared =
    plan.pricingAttributionsToClear.length;

  for (const user of plan.deletedAuthUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id, false);
    if (error) throw error;
  }
  counts.auth_users = plan.deletedAuthUsers.length;

  inventory.csv.rows = inventory.csv.rows.filter((row) => {
    const email = normalize(row.email);
    return email === plan.preservedEmail;
  });
  writeCsvSheet(inventory.csv);
  counts.user_details_csv = plan.csvRowsToDelete.length;
  return { counts, deletedIdentities };
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertPreservedData(before, after, plan) {
  const preservedAuth = after.authUsers.filter(
    (user) => normalize(user.email) === plan.preservedEmail,
  );
  const preservedProfiles = after.users.filter(
    (user) => normalize(user.email) === plan.preservedEmail,
  );
  const preservedRoles = after.roles.filter((row) =>
    isPreservedReference(row.user_id, plan.preservedIds, plan.preservedEmail),
  );
  if (
    preservedAuth.length !== 1 ||
    preservedAuth[0].id !== plan.preservedAuth.id
  ) {
    throw new Error(
      "Post-cleanup verification failed for the preserved Auth account.",
    );
  }
  if (
    stableJson(preservedProfiles) !==
    stableJson(
      before.users.filter(
        (row) => normalize(row.email) === plan.preservedEmail,
      ),
    )
  ) {
    throw new Error(
      "Post-cleanup verification failed for the preserved application profile.",
    );
  }
  if (stableJson(preservedRoles) !== stableJson(plan.preservedRoleRows)) {
    throw new Error(
      "Post-cleanup verification failed for the preserved administrator role.",
    );
  }
  if (
    preservedRoles.length === 0 ||
    !preservedRoles.some((row) => ["Owner", "Super Admin"].includes(row.role))
  ) {
    throw new Error(
      "The preserved account no longer has its existing administrator role.",
    );
  }
  if (after.authUsers.length !== 1 || after.users.length !== 1) {
    throw new Error(
      "Post-cleanup verification found unexpected Auth or application users.",
    );
  }
  const beforePreservedEstimates = before.estimates.filter((row) =>
    isPreservedReference(row.user_id, plan.preservedIds, plan.preservedEmail),
  );
  const afterPreservedEstimates = after.estimates.filter((row) =>
    isPreservedReference(row.user_id, plan.preservedIds, plan.preservedEmail),
  );
  if (
    stableJson(beforePreservedEstimates) !== stableJson(afterPreservedEstimates)
  ) {
    throw new Error(
      "Post-cleanup verification failed for preserved estimates.",
    );
  }
  const preservedEstimateIds = new Set(
    beforePreservedEstimates.map((row) => String(row.id)),
  );
  const belongsToPreservedAccount = (row) =>
    isPreservedReference(row.user_id, plan.preservedIds, plan.preservedEmail) ||
    (row.user_id == null &&
      row.source_estimate_id != null &&
      preservedEstimateIds.has(String(row.source_estimate_id)));
  const beforePreservedEvents = before.estimateEvents.filter(
    belongsToPreservedAccount,
  );
  const afterPreservedEvents = after.estimateEvents.filter(
    belongsToPreservedAccount,
  );
  if (stableJson(beforePreservedEvents) !== stableJson(afterPreservedEvents)) {
    throw new Error(
      "Post-cleanup verification failed for preserved estimate history.",
    );
  }
  const hasOtherUserRows =
    after.roles.some(
      (row) =>
        !isPreservedReference(
          row.user_id,
          plan.preservedIds,
          plan.preservedEmail,
        ),
    ) ||
    after.estimates.some(
      (row) =>
        !isPreservedReference(
          row.user_id,
          plan.preservedIds,
          plan.preservedEmail,
        ),
    ) ||
    after.estimateEvents.some((row) => {
      if (
        isPreservedReference(
          row.user_id,
          plan.preservedIds,
          plan.preservedEmail,
        ) ||
        (row.source_estimate_id != null &&
          preservedEstimateIds.has(String(row.source_estimate_id)))
      ) {
        return false;
      }
      const userId = String(row.user_id || "").trim();
      return (
        (userId &&
          !isPreservedReference(
            userId,
            plan.preservedIds,
            plan.preservedEmail,
          )) ||
        (row.source_estimate_id != null &&
          !after.estimates.some(
            (estimate) =>
              String(estimate.id) === String(row.source_estimate_id),
          ))
      );
    });
  if (hasOtherUserRows)
    throw new Error(
      "Post-cleanup verification found remaining non-preserved user records.",
    );
  const keptAudit = after.auditLogs.filter((row) => {
    const actor = String(row.actor || "").trim();
    return (
      actor &&
      isPreservedReference(actor, plan.preservedIds, plan.preservedEmail)
    );
  });
  const beforeKeptAudit = before.auditLogs.filter((row) => {
    const actor = String(row.actor || "").trim();
    return (
      actor &&
      isPreservedReference(actor, plan.preservedIds, plan.preservedEmail)
    );
  });
  if (stableJson(keptAudit) !== stableJson(beforeKeptAudit)) {
    throw new Error(
      "Post-cleanup verification failed for preserved audit records.",
    );
  }
  const clearedCategories = new Set(
    plan.pricingAttributionsToClear.map((row) => String(row.category)),
  );
  const expectedPricing = before.pricingConfigurations.map((row) =>
    clearedCategories.has(String(row.category))
      ? { ...row, updated_by: null }
      : row,
  );
  if (stableJson(after.pricingConfigurations) !== stableJson(expectedPricing)) {
    throw new Error(
      "Post-cleanup verification failed for shared pricing configuration.",
    );
  }
  const unexpectedCsvRows = after.csv.rows.filter(
    (row) => normalize(row.email) !== plan.preservedEmail,
  );
  if (unexpectedCsvRows.length)
    throw new Error(
      "Post-cleanup verification found non-preserved local user-sheet rows.",
    );
}

async function run() {
  const supabase = getSupabaseClient();
  if (!supabase)
    throw new Error("Supabase service configuration is unavailable.");
  const rootDir = path.resolve(__dirname, "..");
  const inventory = await readInventory(supabase, rootDir);
  const plan = buildCleanupPlan(inventory);
  const summary = summarizePlan(plan);
  console.log(JSON.stringify(summary, null, 2));
  if (plan.blockers.length)
    throw new Error("Dry-run has blockers; no changes were made.");

  const execute = process.argv.includes("--execute");
  const confirmationArgument = process.argv.find((arg) =>
    arg.startsWith("--confirm="),
  );
  const confirmation = confirmationArgument?.slice("--confirm=".length);
  if (!execute) return;
  assertExplicitConfirmation(execute, confirmation);

  const freshInventory = await readInventory(supabase, rootDir);
  const freshPlan = buildCleanupPlan(freshInventory);
  if (stableJson(summarizePlan(freshPlan)) !== stableJson(summary)) {
    throw new Error(
      "Live inventory changed after dry-run; no changes were made. Run dry-run again.",
    );
  }
  assertApprovedPreDeletePlan(freshPlan);
  await preflightDeletePermissions(supabase, freshPlan);
  assertApprovedPreDeletePlan(freshPlan);
  assertNoProtectedRecordsScheduled(freshPlan);
  const execution = await executeCleanup(supabase, freshPlan, freshInventory);
  const after = await readInventory(supabase, rootDir);
  assertPreservedData(freshInventory, after, freshPlan);
  console.log(
    JSON.stringify(
      {
        executionComplete: true,
        preservedUser: PRESERVED_EMAIL,
        authUsersRemaining: after.authUsers.length,
        authUsersPermanentlyDeleted: execution.counts.auth_users,
        applicationRecordsDeleted: Object.fromEntries(
          Object.entries(execution.counts).filter(
            ([table]) =>
              table !== "auth_users" &&
              table !== "pricing_configurations_attribution_cleared",
          ),
        ),
        pricingConfigAttributionsCleared:
          execution.counts.pricing_configurations_attribution_cleared,
        preservedProfileAndRoleVerified: true,
        dryRunAndExecutionPlanMatched: true,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  run().catch(() => {
    console.error(
      "User cleanup stopped or failed. No secrets or user credentials were logged; inspect database state before retrying.",
    );
    process.exitCode = 1;
  });
}

module.exports = {
  PRESERVED_EMAIL,
  CONFIRMATION,
  buildCleanupPlan,
  summarizePlan,
  assertExplicitConfirmation,
  assertNoProtectedRecordsScheduled,
  assertApprovedPreDeletePlan,
  preflightDeletePermissions,
  assertPreservedData,
};
