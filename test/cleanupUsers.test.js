const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  PRESERVED_EMAIL,
  CONFIRMATION,
  buildCleanupPlan,
  summarizePlan,
  assertExplicitConfirmation,
  assertPreservedData,
  assertNoProtectedRecordsScheduled,
} = require("../scripts/cleanup-users");

function makeInventory() {
  return {
    authUsers: [
      { id: "auth-keep", email: "RealEmmy55@Gmail.com" },
      { id: "auth-delete-1", email: "one@example.com" },
      { id: "auth-delete-2", email: "two@example.com" },
    ],
    users: [
      { id: "profile-keep", email: "realemmy55@gmail.com", name: "Owner" },
      { id: "profile-delete-1", email: "one@example.com", name: "One" },
      { id: "profile-delete-2", email: "two@example.com", name: "Two" },
      { id: "orphan-profile", email: "orphan@example.com", name: "Orphan" },
    ],
    roles: [
      { user_id: "profile-keep", role: "Owner", assigned_by: "manual" },
      {
        user_id: "REALemmy55@gmail.com",
        role: "Super Admin",
        assigned_by: "manual",
      },
      { user_id: "profile-delete-1", role: "Standard User" },
      { user_id: "orphan-role", role: "Analyst" },
    ],
    estimates: [
      { id: "1", user_id: "profile-keep" },
      { id: "2", user_id: "profile-delete-1" },
      { id: "3", user_id: "orphan-estimate" },
    ],
    estimateEvents: [
      { id: "10", user_id: "profile-keep", source_estimate_id: "1" },
      { id: "11", user_id: "profile-delete-1", source_estimate_id: "2" },
      { id: "12", user_id: null, source_estimate_id: "999" },
    ],
    emailEvents: [
      { id: "20", user_id: "profile-keep" },
      { id: "21", user_id: "profile-delete-1" },
    ],
    auditLogs: [
      { id: "30", actor: "realemmy55@gmail.com" },
      { id: "31", actor: "AUTH-DELETE-1" },
      { id: "32", actor: "unrelated prose" },
    ],
    pricingConfigurations: [
      { category: "Design", updated_by: "auth-delete-1" },
      { category: "Build", updated_by: "realemmy55@gmail.com" },
    ],
    csv: {
      path: "memory.csv",
      headers: ["id", "email"],
      rows: [
        { id: "profile-keep", email: "RealEmmy55@gmail.com" },
        { id: "profile-delete-1", email: "one@example.com" },
      ],
      missing: false,
    },
    unknownUserReferences: [],
    schemaTables: [
      "users",
      "user_roles",
      "user_estimates",
      "estimate_generation_events",
      "email_events",
      "audit_logs",
      "pricing_configurations",
    ],
  };
}

test("cleanup dry-run schedules every other Auth user and related records", () => {
  const inventory = makeInventory();
  const plan = buildCleanupPlan(inventory);
  const report = summarizePlan(plan);

  assert.equal(report.dryRun, true);
  assert.equal(report.preservedUser.email, PRESERVED_EMAIL);
  assert.equal(report.preservedUser.authUserId, "auth-keep");
  assert.equal(report.preservedUser.profileId, "profile-keep");
  assert.equal(report.totalAuthUsersFound, 3);
  assert.equal(report.usersPreserved, 1);
  assert.equal(report.authUsersScheduledForDeletion, 2);
  assert.equal(plan.records.users, 3);
  assert.equal(plan.records.user_roles, 2);
  assert.equal(plan.records.user_estimates, 2);
  assert.equal(plan.records.estimate_generation_events, 2);
  assert.equal(plan.records.email_events, 1);
  assert.equal(plan.records.audit_logs, 1);
  assert.equal(plan.records.pricing_configurations_attribution_cleared, 1);
  assert.equal(plan.usersMissingProfiles, 0);
  assert.equal(plan.profilesWithoutAuth, 1);
  assert.equal(plan.orphanCounts.userRoles, 1);
  assert.equal(plan.orphanCounts.userEstimates, 1);
  assert.equal(plan.orphanCounts.estimateGenerationEvents, 1);
  assert.equal(plan.blockers.length, 0);
  assert.deepEqual(
    plan.preservedRoleRows.map((row) => row.role),
    ["Owner", "Super Admin"],
  );
});

test("protected user's normal analytics event is preserved", () => {
  const plan = buildCleanupPlan(makeInventory());
  assert.equal(
    plan.deletedEstimateEvents.some((event) => event.id === "10"),
    false,
  );
  assert.equal(
    plan.protectedRecords.estimate_generation_events.some(
      (event) => event.id === "10",
    ),
    true,
  );
});

test("protected user's orphaned analytics event is preserved and reported", () => {
  const inventory = makeInventory();
  inventory.estimateEvents.push({
    id: "protected-orphan",
    user_id: "profile-keep",
    source_estimate_id: "missing-protected-estimate",
  });
  const plan = buildCleanupPlan(inventory);
  const report = summarizePlan(plan);

  assert.equal(
    plan.deletedEstimateEvents.some((event) => event.id === "protected-orphan"),
    false,
  );
  assert.equal(
    report.protectedOrphanRecordsByTable.estimate_generation_events.some(
      (event) => event.id === "protected-orphan",
    ),
    true,
  );
});

test("unprotected orphaned analytics event remains scheduled for deletion", () => {
  const inventory = makeInventory();
  inventory.estimateEvents.push({
    id: "unprotected-orphan",
    user_id: "unknown-user",
    source_estimate_id: "missing-estimate",
  });
  const report = summarizePlan(buildCleanupPlan(inventory));

  assert.equal(
    report.deletionCandidatesByTable.estimate_generation_events.includes(
      "unprotected-orphan",
    ),
    true,
  );
  assert.equal(
    report.unrelatedOrphanRecordsByTable.estimate_generation_events.includes(
      "unprotected-orphan",
    ),
    true,
  );
});

test("protected user estimates are excluded from deletion candidates", () => {
  const plan = buildCleanupPlan(makeInventory());
  assert.deepEqual(
    plan.protectedRecords.user_estimates.map((row) => row.id),
    ["1"],
  );
  assert.equal(
    plan.deletedEstimates.some((row) => row.id === "1"),
    false,
  );
});

test("protected user roles are excluded from deletion candidates", () => {
  const plan = buildCleanupPlan(makeInventory());
  assert.deepEqual(
    plan.protectedRecords.user_roles.map((row) => row.user_id),
    ["profile-keep", "REALemmy55@gmail.com"],
  );
  assert.equal(
    plan.deletedRoles.some((row) => row.user_id === "profile-keep"),
    false,
  );
});

test("protected ownership takes precedence over a missing analytics source", () => {
  const inventory = makeInventory();
  inventory.estimateEvents.push({
    id: "owner-wins",
    user_id: "REALemmy55@gmail.com",
    source_estimate_id: "absent-estimate",
  });
  const plan = buildCleanupPlan(inventory);

  assert.equal(
    plan.protectedOrphanRecords.estimate_generation_events.some(
      (event) => event.id === "owner-wins",
    ),
    true,
  );
  assert.equal(
    plan.deletedEstimateEvents.some((event) => event.id === "owner-wins"),
    false,
  );
});

test("protected Auth account cannot enter the deletion set", () => {
  const plan = buildCleanupPlan(makeInventory());
  assert.equal(
    plan.deletedAuthUsers.some(
      (user) =>
        user.id === "auth-keep" || user.email.toLowerCase() === PRESERVED_EMAIL,
    ),
    false,
  );
});

test("protected profile ID cannot enter any user-row deletion set", () => {
  const plan = buildCleanupPlan(makeInventory());
  assert.equal(
    plan.deletedUsers.some((user) => user.id === "profile-keep"),
    false,
  );
  assert.equal(
    plan.deletedRoles.some((role) => role.user_id === "profile-keep"),
    false,
  );
  assert.equal(
    plan.deletedEstimates.some(
      (estimate) => estimate.user_id === "profile-keep",
    ),
    false,
  );
  assert.equal(
    plan.deletedEstimateEvents.some(
      (event) => event.user_id === "profile-keep",
    ),
    false,
  );
  assert.doesNotThrow(() => assertNoProtectedRecordsScheduled(plan));
  assert.equal(summarizePlan(plan).protectedRecordsInDeletionPlan, false);
});

test("confirmed absent migration table is reported as schema drift, not a cleanup blocker", () => {
  const inventory = makeInventory();
  inventory.emailEvents = null;
  inventory.tableStatuses = {
    email_events: {
      status: "confirmed_absent",
      rowCount: 0,
      evidence: "Supabase SQL inspection: to_regclass returned NULL",
    },
  };
  inventory.schemaDrift = [
    "email_events: declared by repository migration, absent from live database",
  ];
  const plan = buildCleanupPlan(inventory);
  const report = summarizePlan(plan);

  assert.equal(plan.records.email_events, 0);
  assert.deepEqual(plan.deletedEmailEvents, []);
  assert.equal(plan.blockers.length, 0);
  assert.deepEqual(report.schemaDrift, inventory.schemaDrift);
  assert.equal(
    report.liveTableStatuses.email_events.status,
    "confirmed_absent",
  );
  assert.equal(report.applicationRecordIdsToDelete.email_events.length, 0);
});

test("existing optional table with zero rows is distinct from confirmed absence", () => {
  const inventory = makeInventory();
  inventory.emailEvents = [];
  inventory.tableStatuses = {
    email_events: { status: "present_zero_rows", rowCount: 0 },
  };
  const report = summarizePlan(buildCleanupPlan(inventory));
  assert.equal(
    report.liveTableStatuses.email_events.status,
    "present_zero_rows",
  );
  assert.equal(report.applicationRecords.email_events, 0);
});

test("existing optional table that cannot be inspected remains a blocker", () => {
  const inventory = makeInventory();
  inventory.emailEvents = null;
  inventory.tableStatuses = {
    email_events: { status: "exists_uninspectable", rowCount: null },
  };
  inventory.schemaWarnings = ["email_events exists but cannot be inspected"];
  const plan = buildCleanupPlan(inventory);
  const report = summarizePlan(plan);
  assert.equal(
    report.liveTableStatuses.email_events.status,
    "exists_uninspectable",
  );
  assert.equal(plan.records.email_events, null);
  assert.equal(plan.blockers.length, 1);
});

test("dry-run planning performs no mutation", () => {
  const inventory = makeInventory();
  const before = structuredClone(inventory);
  buildCleanupPlan(inventory);
  assert.deepEqual(inventory, before);
});

test("preserved email case variations resolve to one protected identity", () => {
  for (const email of [
    "realemmy55@gmail.com",
    "RealEmmy55@gmail.com",
    "REALEMMY55@GMAIL.COM",
  ]) {
    const inventory = makeInventory();
    inventory.authUsers[0].email = email;
    inventory.users[0].email = email;
    const plan = buildCleanupPlan(inventory);
    assert.equal(
      plan.deletedAuthUsers.some((user) => user.id === "auth-keep"),
      false,
    );
    assert.equal(
      plan.deletedUsers.some((user) => user.id === "profile-keep"),
      false,
    );
  }
});

test("cleanup refuses to proceed without the existing preserved admin identity and role", () => {
  const missingAuth = makeInventory();
  missingAuth.authUsers.shift();
  assert.throws(() => buildCleanupPlan(missingAuth), /preserved Auth user/i);

  const missingRole = makeInventory();
  missingRole.roles = missingRole.roles.filter(
    (role) => role.user_id !== "profile-keep",
  );
  missingRole.roles = missingRole.roles.filter(
    (role) => role.user_id !== "REALemmy55@gmail.com",
  );
  assert.throws(
    () => buildCleanupPlan(missingRole),
    /Owner or Super Admin role/i,
  );
});

test("permanent execution requires explicit irreversible confirmation", () => {
  assert.throws(
    () => assertExplicitConfirmation(false, CONFIRMATION),
    /requires --execute/i,
  );
  assert.throws(
    () => assertExplicitConfirmation(true, "DELETE ALL USERS"),
    /confirmation phrase/i,
  );
  assert.doesNotThrow(() => assertExplicitConfirmation(true, CONFIRMATION));
});

test("post-cleanup verification rejects a missing preserved identity", () => {
  const before = makeInventory();
  const plan = buildCleanupPlan(before);
  const after = structuredClone(before);
  after.authUsers = after.authUsers.filter((user) => user.id !== "auth-keep");
  assert.throws(
    () => assertPreservedData(before, after, plan),
    /preserved Auth account/i,
  );
});

test("server startup contains no automatic user-seeding call", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "server.js"),
    "utf8",
  );
  const startup = source.slice(source.lastIndexOf("app.listen"));
  assert.doesNotMatch(startup, /saveUser\s*\(/);
  assert.doesNotMatch(startup, /auth\.admin\.(createUser|updateUserById)/);
});
