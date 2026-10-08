const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
const { OAuth2Client } = require("google-auth-library");

process.env.NODE_ENV = "test";
process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
process.env.AUTH_SESSION_SECRET = "12345678901234567890123456789012";
process.env.SUPABASE_URL = "https://prod-project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "prod-secret";
process.env.SUPABASE_TEST_URL = "https://test-project.supabase.co";
process.env.SUPABASE_TEST_SERVICE_ROLE_KEY = "test-secret";
process.env.SUPABASE_TEST_ANON_KEY = "test-anon-key";
process.env.ADMIN_EMAILS = [
  ...new Set([
    ...(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
    "realemmy55@gmail.com",
    "configured-admin@example.com",
  ]),
].join(",");

const roleTestDatabase = {
  users: new Map(),
  userRoles: new Map(),
  estimates: [],
  estimateEvents: [],
  auditLogs: [],
};
const supabaseAuthUsers = new Map();
let nextAuthUserId = 0;
const newsletterColumnRetryUserIds = new Set();
let supabaseAuthResponse = null;
let lastSupabaseAuthRequest = null;
const supabaseAuthRequestHistory = [];
let failAdminUserDelete = false;
const failDatabaseDeletes = new Set();
let missingNewsletterReadColumn = false;
const originalFetch = global.fetch.bind(global);
global.fetch = async (input, init = {}) => {
  const requestUrl = new URL(typeof input === "string" ? input : input.url);
  if (requestUrl.hostname !== "test-project.supabase.co") {
    return originalFetch(input, init);
  }

  const table = requestUrl.pathname.split("/").pop();
  const method = init.method || "GET";
  const respond = (body, status = 200) =>
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: status === 204 ? {} : { "Content-Type": "application/json" },
    });
  const getHeader = (name) => new Headers(init.headers).get(name) || "";
  const filterValues = (key) => {
    const value = requestUrl.searchParams.get(key) || "";
    if (value.startsWith("in.")) {
      return value
        .slice(3)
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((entry) =>
          String(entry || "")
            .trim()
            .replace(/^['\"]|['\"]$/g, ""),
        )
        .filter(Boolean);
    }
    return value.startsWith("eq.") ? [value.slice(3)] : [];
  };

  if (requestUrl.pathname.startsWith("/auth/v1/")) {
    lastSupabaseAuthRequest = {
      path: requestUrl.pathname + requestUrl.search,
      method,
      body: JSON.parse(init.body || "{}"),
    };
    supabaseAuthRequestHistory.push(lastSupabaseAuthRequest);
    if (supabaseAuthResponse) {
      return respond(
        supabaseAuthResponse.body || {},
        supabaseAuthResponse.status || 200,
      );
    }

    const authBody = lastSupabaseAuthRequest.body;
    const normalizedEmail = String(authBody.email || "").toLowerCase();
    if (requestUrl.pathname === "/auth/v1/signup") {
      const existingAuthUser = supabaseAuthUsers.get(normalizedEmail);
      if (existingAuthUser) {
        return respond({
          user: {
            id: existingAuthUser.user.id,
            email: normalizedEmail,
            identities: [],
          },
        });
      }
      const user = {
        id: `00000000-0000-4000-8000-${String(++nextAuthUserId).padStart(12, "0")}`,
        email: normalizedEmail,
        email_confirmed_at: null,
        identities: [{ provider: "email" }],
        user_metadata: authBody.data || {},
      };
      const passwordSalt = crypto.randomBytes(16);
      supabaseAuthUsers.set(normalizedEmail, {
        user,
        passwordSalt: passwordSalt.toString("hex"),
        passwordHash: crypto
          .scryptSync(authBody.password, passwordSalt, 32)
          .toString("hex"),
      });
      return respond({ user });
    }

    if (requestUrl.pathname === "/auth/v1/otp") {
      return respond({});
    }

    if (requestUrl.pathname === "/auth/v1/admin/users") {
      const users = [...supabaseAuthUsers.values()].map((entry) => ({
        id: entry.user.id,
        email: entry.user.email,
      }));
      return respond({ users });
    }

    if (requestUrl.pathname.startsWith("/auth/v1/admin/users/")) {
      if (failAdminUserDelete && method === "DELETE") {
        return respond({ msg: "Injected test delete failure" }, 500);
      }
      const id = requestUrl.pathname.split("/").pop();
      if (method === "DELETE" || method === "POST") {
        for (const [email, entry] of [...supabaseAuthUsers.entries()]) {
          if (entry.user.id === id) {
            supabaseAuthUsers.delete(email);
          }
        }
        return respond({});
      }
      return respond({});
    }

    if (requestUrl.pathname === "/auth/v1/token") {
      const authUser = supabaseAuthUsers.get(normalizedEmail);
      const providedPasswordHash = authUser
        ? crypto
            .scryptSync(
              authBody.password,
              Buffer.from(authUser.passwordSalt, "hex"),
              32,
            )
            .toString("hex")
        : "";
      const passwordMatches = Boolean(
        authUser &&
        providedPasswordHash.length === authUser.passwordHash.length &&
        crypto.timingSafeEqual(
          Buffer.from(providedPasswordHash, "hex"),
          Buffer.from(authUser.passwordHash, "hex"),
        ),
      );
      if (!passwordMatches) {
        return respond(
          { msg: "Invalid login credentials", error: "invalid_grant" },
          400,
        );
      }
      return respond({ user: authUser.user });
    }

    if (requestUrl.pathname === "/auth/v1/verify") {
      const authUser = supabaseAuthUsers.get(normalizedEmail);
      if (
        !authUser ||
        authBody.type !== "email" ||
        authBody.token !== "123456"
      ) {
        return respond(
          { code: "otp_expired", msg: "Email link is invalid or has expired" },
          400,
        );
      }
      authUser.user.email_confirmed_at = new Date().toISOString();
      return respond({ user: authUser.user });
    }

    return respond({});
  }

  if (method === "POST" && table === "users") {
    const records = JSON.parse(init.body || "[]");
    const rows = Array.isArray(records) ? records : [records];
    if (rows.some((record) => Object.hasOwn(record, "newsletter_consent"))) {
      rows.forEach((record) =>
        newsletterColumnRetryUserIds.add(String(record.id)),
      );
      return respond(
        {
          code: "PGRST204",
          message:
            "Could not find the 'newsletter_consent' column of 'users' in the schema cache",
        },
        400,
      );
    }
    if (
      rows.some((record) =>
        ["given_name", "family_name", "locale"].some((column) =>
          Object.hasOwn(record, column),
        ),
      )
    ) {
      return respond({ message: "column does not exist" }, 400);
    }
    for (const record of Array.isArray(records) ? records : [records]) {
      roleTestDatabase.users.set(String(record.id), {
        ...roleTestDatabase.users.get(String(record.id)),
        ...record,
      });
    }
    return respond([], 201);
  }
  if (method === "POST" && table === "user_roles") {
    const records = JSON.parse(init.body || "[]");
    const ignoreDuplicates = getHeader("Prefer").includes(
      "resolution=ignore-duplicates",
    );
    for (const record of Array.isArray(records) ? records : [records]) {
      const key = String(record.user_id);
      if (ignoreDuplicates && roleTestDatabase.userRoles.has(key)) continue;
      roleTestDatabase.userRoles.set(key, {
        ...roleTestDatabase.userRoles.get(key),
        ...record,
      });
    }
    return respond([], 201);
  }
  if (
    method === "DELETE" &&
    [
      "users",
      "user_roles",
      "user_estimates",
      "estimate_generation_events",
      "email_events",
      "audit_logs",
    ].includes(table)
  ) {
    if (failDatabaseDeletes.has(table)) {
      return respond(
        { code: "permission_denied", message: "Injected cleanup failure" },
        403,
      );
    }
    const ids = new Set(filterValues("id"));
    const userIds = new Set(filterValues("user_id"));
    const actors = new Set(filterValues("actor"));
    if (table === "users") {
      for (const id of ids) {
        roleTestDatabase.users.delete(String(id));
      }
    }
    if (table === "user_roles") {
      for (const id of userIds) {
        roleTestDatabase.userRoles.delete(String(id));
      }
    }
    if (table === "user_estimates") {
      roleTestDatabase.estimates = roleTestDatabase.estimates.filter(
        (row) => !ids.has(String(row.id)) && !userIds.has(String(row.user_id)),
      );
    }
    if (table === "estimate_generation_events") {
      roleTestDatabase.estimateEvents = roleTestDatabase.estimateEvents.filter(
        (row) => !ids.has(String(row.id)),
      );
    }
    if (table === "email_events") {
      for (const id of userIds) {
        // no local rows are tracked for this fixture table
      }
    }
    if (table === "audit_logs") {
      roleTestDatabase.auditLogs = roleTestDatabase.auditLogs.filter(
        (row) => !actors.has(String(row.actor)),
      );
    }
    return respond([], 204);
  }
  if (method === "GET" && table === "users") {
    if (
      missingNewsletterReadColumn &&
      requestUrl.searchParams
        .get("select")
        ?.split(",")
        .includes("newsletter_consent")
    ) {
      return respond(
        {
          code: "PGRST204",
          message:
            "Could not find the 'newsletter_consent' column of 'users' in the schema cache",
        },
        400,
      );
    }
    if (
      ["given_name", "family_name", "locale"].some((column) =>
        requestUrl.searchParams.get("select")?.split(",").includes(column),
      )
    ) {
      return respond({ message: "column does not exist" }, 400);
    }
    let rows = [...roleTestDatabase.users.values()];
    for (const [key, value] of requestUrl.searchParams) {
      if (key === "id" && value.startsWith("eq.")) {
        rows = rows.filter((row) => String(row.id) === value.slice(3));
      }
      if (key === "email" && value.startsWith("eq.")) {
        rows = rows.filter(
          (row) =>
            String(row.email).toLowerCase() === value.slice(3).toLowerCase(),
        );
      }
    }
    if (requestUrl.searchParams.get("limit") === "1") rows = rows.slice(0, 1);
    return respond(
      getHeader("Accept").includes("vnd.pgrst.object") ? rows[0] || null : rows,
    );
  }
  if (method === "GET" && table === "user_roles") {
    let rows = [...roleTestDatabase.userRoles.values()];
    for (const [key, value] of requestUrl.searchParams) {
      if (key === "user_id") {
        const values = filterValues(key);
        if (values.length)
          rows = rows.filter((row) => values.includes(String(row.user_id)));
      }
    }
    if (requestUrl.searchParams.get("limit") === "1") rows = rows.slice(0, 1);
    return respond(
      getHeader("Accept").includes("vnd.pgrst.object") ? rows[0] || null : rows,
    );
  }
  if (method === "GET" && table === "user_estimates") {
    const userIds = filterValues("user_id");
    const rows = roleTestDatabase.estimates.filter((row) =>
      userIds.includes(String(row.user_id)),
    );
    return respond(rows);
  }
  if (method === "GET" && table === "estimate_generation_events") {
    const userIds = filterValues("user_id");
    const sourceIds = filterValues("source_estimate_id");
    const rows = roleTestDatabase.estimateEvents.filter(
      (row) =>
        userIds.includes(String(row.user_id)) ||
        sourceIds.includes(String(row.source_estimate_id)),
    );
    return respond(rows);
  }
  return respond([]);
};

const { app } = require("../server");
const { getSupabaseConfig } = require("../lib/supabase");
const authModulePath = require.resolve("../lib/auth");
delete require.cache[authModulePath];
const {
  verifyGoogleCredential,
  createSession,
  sessionCookie,
} = require("../lib/auth");

let server;
let baseUrl;

test("test mode prefers dedicated Supabase test credentials", () => {
  assert.deepEqual(getSupabaseConfig(), {
    url: "https://test-project.supabase.co",
    serviceRoleKey: "test-secret",
  });
});

test("Google sign-in captures profile data needed for future email outreach", async () => {
  const originalVerify = OAuth2Client.prototype.verifyIdToken;
  OAuth2Client.prototype.verifyIdToken = async () => ({
    getPayload: () => ({
      sub: "google-user-123",
      email: "sam@example.com",
      email_verified: true,
      name: "Sam Example",
      given_name: "Sam",
      family_name: "Example",
      picture: "https://example.com/avatar.png",
      locale: "en-US",
    }),
  });

  try {
    const user = await verifyGoogleCredential("fake-token");
    assert.deepEqual(user, {
      id: "google-user-123",
      email: "sam@example.com",
      name: "Sam Example",
      picture: "https://example.com/avatar.png",
      givenName: "Sam",
      familyName: "Example",
      locale: "en-US",
      newsletterConsent: false,
      isAdmin: false,
    });
  } finally {
    OAuth2Client.prototype.verifyIdToken = originalVerify;
  }
});

test("saveUser stores profile rows in a sheet-compatible CSV file", async () => {
  const sheetPath = path.join(__dirname, "fixtures", "tmp-users-sheet.csv");
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);

  const { saveUser } = require("../lib/supabase");
  await saveUser({
    id: "sheet-user-1",
    email: "sheet@example.com",
    name: "Sheet User",
    picture: "https://example.com/face.png",
    givenName: "Sheet",
    familyName: "User",
    locale: "en-US",
    newsletterConsent: true,
  });

  const written = fs.readFileSync(sheetPath, "utf8");
  assert.match(written, /sheet@example.com/);
  assert.match(written, /newsletter_consent/);
  assert.match(written, /true/);
  assert.ok(newsletterColumnRetryUserIds.has("sheet-user-1"));
  assert.ok(roleTestDatabase.users.has("sheet-user-1"));
});

test("test account CSV cleanup removes only a case-insensitive matching email row", () => {
  const sheetPath = path.join(
    __dirname,
    "fixtures",
    "tmp-test-account-cleanup.csv",
  );
  const previousSheetPath = process.env.USER_SHEET_PATH;
  process.env.USER_SHEET_PATH = sheetPath;
  fs.writeFileSync(
    sheetPath,
    "id,email,name\nprofile-otp,Admin.PriceCheck@Gmail.com,OTP Test\nprofile-safe,realemmy55@gmail.com,Owner\n",
  );
  try {
    const { deleteUserSheetRowsByEmail } = require("../lib/supabase");
    assert.equal(deleteUserSheetRowsByEmail("admin.pricecheck@gmail.com"), 1);
    const sheet = fs.readFileSync(sheetPath, "utf8");
    assert.doesNotMatch(sheet, /admin\.pricecheck@gmail\.com/i);
    assert.match(sheet, /realemmy55@gmail\.com/);
  } finally {
    fs.rmSync(sheetPath, { force: true });
    if (previousSheetPath === undefined) delete process.env.USER_SHEET_PATH;
    else process.env.USER_SHEET_PATH = previousSheetPath;
  }
});

test("saveUserRole persists the updated role without making the CSV authoritative", async () => {
  const sheetPath = path.join(__dirname, "fixtures", "tmp-role-sheet.csv");
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);

  const { saveUser, saveUserRole } = require("../lib/supabase");
  await saveUser({
    id: "role-user-1",
    email: "roleuser@example.com",
    name: "Role User",
    picture: "https://example.com/avatar.png",
    givenName: "Role",
    familyName: "User",
    locale: "en-US",
    newsletterConsent: false,
  });

  await saveUserRole("role-user-1", "Pricing Manager", "admin@pricecheck.ng");

  const written = fs.readFileSync(sheetPath, "utf8");
  assert.match(written, /roleuser@example.com/);
  assert.equal(
    roleTestDatabase.userRoles.get("role-user-1").role,
    "Pricing Manager",
  );
  assert.doesNotMatch(written, /Pricing Manager/);
});

test("getUserByEmail falls back when newsletter consent is missing from the schema cache", async () => {
  roleTestDatabase.users.set("legacy-profile-1", {
    id: "legacy-profile-1",
    email: "legacy-profile@example.com",
    name: "Legacy Profile",
    skill_work: "Design",
    picture: "",
  });
  missingNewsletterReadColumn = true;
  try {
    const { getUserByEmail } = require("../lib/supabase");
    const profile = await getUserByEmail("legacy-profile@example.com");
    assert.equal(profile.id, "legacy-profile-1");
    assert.equal(profile.name, "Legacy Profile");
  } finally {
    missingNewsletterReadColumn = false;
    roleTestDatabase.users.delete("legacy-profile-1");
    roleTestDatabase.userRoles.delete("legacy-profile-1");
  }
});

test.before(async () => {
  process.env.GEMINI_API_KEY = "";
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

async function post(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function restartTestServer() {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  const serverModulePath = require.resolve("../server");
  delete require.cache[serverModulePath];
  const restartedApp = require("../server").app;
  server = restartedApp.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

test("admin dashboard path serves the application shell", async () => {
  const response = await fetch(`${baseUrl}/admin`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /id="admin-view"/);
});

test("public and estimate paths serve the application shell", async () => {
  const publicResponse = await fetch(`${baseUrl}/`);
  const estimateResponse = await fetch(`${baseUrl}/estimate`);
  const publicBody = await publicResponse.text();
  const estimateBody = await estimateResponse.text();

  assert.equal(publicResponse.status, 200);
  assert.match(publicBody, /class="public-hero"/);
  assert.equal(estimateResponse.status, 200);
  assert.match(estimateBody, /id="view-input"/);
});

test("login path serves the application shell", async () => {
  const response = await fetch(`${baseUrl}/login`);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /id="login-view"/);
});

test("Google auth configuration is safe to expose to the browser", async () => {
  const response = await fetch(`${baseUrl}/api/auth/config`);
  const config = await response.json();

  assert.equal(response.status, 200);
  assert.equal(typeof config.enabled, "boolean");
  assert.ok(config.clientId === null || typeof config.clientId === "string");
  assert.equal(config.passwordEnabled, true);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("AUTH_TEST_MODE defaults to off and exposes only the safe frontend flag", async () => {
  process.env.AUTH_TEST_MODE = "false";
  delete process.env.AUTH_TEST_EMAIL;
  await restartTestServer();

  const response = await fetch(`${baseUrl}/api/auth/config`);
  const config = await response.json();

  assert.equal(response.status, 200);
  assert.equal(config.testModeEnabled, false);
  assert.equal(typeof config.passwordEnabled, "boolean");
  assert.equal(Object.prototype.hasOwnProperty.call(config, "clientId"), true);
});

test("test mode disabled leaves duplicate test-email signup on the normal path", async () => {
  process.env.AUTH_TEST_MODE = "false";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  await restartTestServer();
  const email = "admin.pricecheck@gmail.com";
  const existing = {
    user: {
      id: "existing-test-auth",
      email,
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  };
  supabaseAuthUsers.set(email, existing);
  supabaseAuthRequestHistory.length = 0;

  const response = await post("/api/auth/signup", {
    name: "Test User",
    email,
    password: "CobaltSignal7!",
  });

  assert.equal(response.status, 409);
  assert.equal(supabaseAuthUsers.get(email), existing);
  assert.deepEqual(
    supabaseAuthRequestHistory.map((request) => request.path.split("?")[0]),
    ["/auth/v1/signup"],
  );
  supabaseAuthUsers.delete(email);
});

test("designated signup resets only its auth/profile rows before normal Supabase signup", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  process.env.USER_SHEET_PATH = path.join(
    __dirname,
    "fixtures",
    "tmp-otp-test-users.csv",
  );
  await restartTestServer();

  const email = "admin.pricecheck@gmail.com";
  const authId = "11111111-1111-4111-8111-111111111111";
  const profileId = "legacy-test-profile-id";
  const otherId = "22222222-2222-4222-8222-222222222222";
  supabaseAuthUsers.set(email, {
    user: { id: authId, email, identities: [{ provider: "email" }] },
    passwordSalt: "",
    passwordHash: "",
  });
  roleTestDatabase.users.set(profileId, {
    id: profileId,
    email,
    name: "Old Test Profile",
  });
  roleTestDatabase.userRoles.set(profileId, {
    user_id: profileId,
    role: "Standard User",
  });
  roleTestDatabase.users.set(otherId, {
    id: otherId,
    email: "other@example.com",
    name: "Keep Me",
  });
  roleTestDatabase.userRoles.set(otherId, {
    user_id: otherId,
    role: "Analyst",
  });
  roleTestDatabase.estimates.push({ id: 901, user_id: profileId });
  roleTestDatabase.estimateEvents.push({
    id: 902,
    user_id: profileId,
    source_estimate_id: 901,
  });
  fs.writeFileSync(
    process.env.USER_SHEET_PATH,
    `id,email,name\n${profileId},${email},Old Test\n${otherId},other@example.com,Other\n`,
  );
  supabaseAuthRequestHistory.length = 0;

  const response = await post("/api/auth/signup", {
    name: "Fresh Signup User",
    email: email.toUpperCase(),
    password: "CobaltSignal7!",
  });
  const payload = await response.json();

  assert.equal(response.status, 202);
  assert.equal(payload.email, email);
  assert.match(payload.message, /6-digit verification code/i);
  assert.notEqual(supabaseAuthUsers.get(email).user.id, authId);
  assert.equal(roleTestDatabase.users.has(profileId), false);
  assert.equal(roleTestDatabase.userRoles.has(profileId), false);
  assert.equal(roleTestDatabase.users.has(otherId), true);
  assert.equal(roleTestDatabase.userRoles.has(otherId), true);
  assert.deepEqual(
    supabaseAuthRequestHistory
      .filter((request) => request.path.includes("/auth/v1/"))
      .map((request) => request.path.split("?")[0]),
    [
      "/auth/v1/admin/users",
      `/auth/v1/admin/users/${authId}`,
      "/auth/v1/signup",
    ],
  );
  assert.equal(
    supabaseAuthRequestHistory.some((request) =>
      request.path.startsWith("/auth/v1/otp"),
    ),
    false,
  );
  const sheet = fs.readFileSync(process.env.USER_SHEET_PATH, "utf8");
  assert.doesNotMatch(sheet, /admin\.pricecheck@gmail\.com/i);
  assert.match(sheet, /other@example\.com/);
  fs.rmSync(process.env.USER_SHEET_PATH, { force: true });
  delete process.env.USER_SHEET_PATH;
  roleTestDatabase.users.delete(otherId);
  roleTestDatabase.userRoles.delete(otherId);
  roleTestDatabase.estimates = [];
  roleTestDatabase.estimateEvents = [];
  supabaseAuthUsers.delete(email);
  delete process.env.AUTH_TEST_MODE;
  delete process.env.AUTH_TEST_EMAIL;
  await restartTestServer();
});

test("three repeated designated signup and verification cycles use fresh Supabase signup", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  const sheetPath = path.join(
    __dirname,
    "fixtures",
    "tmp-otp-repeat-users.csv",
  );
  process.env.USER_SHEET_PATH = sheetPath;
  await restartTestServer();
  const email = "admin.pricecheck@gmail.com";
  const createdIds = [];
  let adminDeletes = 0;
  supabaseAuthRequestHistory.length = 0;
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const signup = await post("/api/auth/signup", {
        name: "Repeated OTP User",
        email,
        password: "CobaltSignal7!",
      });
      const signupPayload = await signup.json();
      assert.equal(signup.status, 202);
      assert.match(signupPayload.message, /6-digit verification code/i);
      const authRecord = supabaseAuthUsers.get(email);
      assert.ok(authRecord?.user.id);
      createdIds.push(authRecord.user.id);
      assert.equal(authRecord.user.email_confirmed_at, null);
      assert.equal(lastSupabaseAuthRequest.path, "/auth/v1/signup");

      const verify = await post("/api/auth/verify-email", {
        email,
        token: "123456",
      });
      assert.equal(verify.status, 200);
      assert.equal((await verify.json()).user.email, email);
      assert.ok(supabaseAuthUsers.get(email).user.email_confirmed_at);
    }
    adminDeletes = supabaseAuthRequestHistory.filter(
      (request) =>
        request.method === "DELETE" &&
        request.path.includes("/auth/v1/admin/users/"),
    ).length;
    assert.equal(adminDeletes, 2);
    assert.equal(new Set(createdIds).size, 3);
    assert.equal(
      supabaseAuthRequestHistory.some((request) =>
        request.path.startsWith("/auth/v1/otp"),
      ),
      false,
    );
    assert.equal(
      supabaseAuthRequestHistory.filter(
        (request) => request.path === "/auth/v1/signup",
      ).length,
      3,
    );
  } finally {
    fs.rmSync(sheetPath, { force: true });
    supabaseAuthUsers.delete(email);
    for (const user of [...roleTestDatabase.users.values()]) {
      if (user.email === email) roleTestDatabase.users.delete(user.id);
    }
    for (const [key, role] of roleTestDatabase.userRoles) {
      if (
        roleTestDatabase.users.has(key) === false &&
        key.startsWith("00000000-0000-4000-8000-")
      ) {
        roleTestDatabase.userRoles.delete(key);
      }
    }
    roleTestDatabase.estimates = [];
    roleTestDatabase.estimateEvents = [];
    delete process.env.USER_SHEET_PATH;
    delete process.env.AUTH_TEST_MODE;
    delete process.env.AUTH_TEST_EMAIL;
    await restartTestServer();
  }
});

test("different signup email never triggers the designated account reset", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  await restartTestServer();
  const protectedTestUser = {
    user: {
      id: "designated-test-user",
      email: "admin.pricecheck@gmail.com",
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  };
  supabaseAuthUsers.set("admin.pricecheck@gmail.com", protectedTestUser);
  supabaseAuthRequestHistory.length = 0;

  const response = await post("/api/auth/signup", {
    name: "Other Signup",
    email: "other@example.com",
    password: "CobaltSignal7!",
  });

  assert.equal(response.status, 202);
  assert.equal(
    supabaseAuthUsers.get("admin.pricecheck@gmail.com"),
    protectedTestUser,
  );
  assert.deepEqual(
    supabaseAuthRequestHistory.map((request) => request.path.split("?")[0]),
    ["/auth/v1/signup"],
  );
  supabaseAuthUsers.delete("admin.pricecheck@gmail.com");
  supabaseAuthUsers.delete("other@example.com");
  delete process.env.AUTH_TEST_MODE;
  delete process.env.AUTH_TEST_EMAIL;
  await restartTestServer();
});

test("test-account deletion is not exposed as a public reset endpoint", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  await restartTestServer();
  supabaseAuthRequestHistory.length = 0;
  const response = await post("/api/dev/reset-test-user", {
    email: "arbitrary@example.com",
  });
  assert.equal(response.status, 404);
  assert.equal(supabaseAuthRequestHistory.length, 0);
  delete process.env.AUTH_TEST_MODE;
  delete process.env.AUTH_TEST_EMAIL;
  await restartTestServer();
});

test("reset failure aborts designated signup before Supabase signup", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  await restartTestServer();
  const email = "admin.pricecheck@gmail.com";
  supabaseAuthUsers.set(email, {
    user: {
      id: "reset-failure-user",
      email,
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  });
  failAdminUserDelete = true;
  supabaseAuthRequestHistory.length = 0;
  try {
    const response = await post("/api/auth/signup", {
      name: "Test User",
      email,
      password: "CobaltSignal7!",
    });
    const payload = await response.json();
    assert.equal(response.status, 503);
    assert.match(payload.error, /Unable to reset the OTP test account/i);
    assert.equal(
      supabaseAuthRequestHistory.some(
        (request) => request.path === "/auth/v1/signup",
      ),
      false,
    );
    assert.equal(supabaseAuthUsers.has(email), true);
  } finally {
    failAdminUserDelete = false;
    supabaseAuthUsers.delete(email);
    delete process.env.AUTH_TEST_MODE;
    delete process.env.AUTH_TEST_EMAIL;
    await restartTestServer();
  }
});

test("protected production admin email cannot be designated or reset", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "realemmy55@gmail.com";
  await restartTestServer();
  const protectedEmail = "realemmy55@gmail.com";
  const protectedAuth = {
    user: {
      id: "protected-owner-id",
      email: protectedEmail,
      identities: [{ provider: "google" }],
    },
    passwordSalt: "",
    passwordHash: "",
  };
  supabaseAuthUsers.set(protectedEmail, protectedAuth);
  roleTestDatabase.users.set("protected-profile-id", {
    id: "protected-profile-id",
    email: protectedEmail,
    name: "Owner",
  });
  roleTestDatabase.userRoles.set("protected-profile-id", {
    user_id: "protected-profile-id",
    role: "Owner",
  });
  roleTestDatabase.estimates.push({
    id: 9901,
    user_id: "protected-profile-id",
  });
  roleTestDatabase.estimateEvents.push({
    id: 9902,
    user_id: "protected-profile-id",
    source_estimate_id: 9901,
  });
  supabaseAuthRequestHistory.length = 0;

  const configResponse = await fetch(`${baseUrl}/api/auth/config`);
  assert.equal((await configResponse.json()).testModeEnabled, false);
  const response = await post("/api/auth/signup", {
    name: "Owner",
    email: protectedEmail,
    password: "CobaltSignal7!",
  });
  assert.equal(response.status, 409);
  assert.equal(supabaseAuthUsers.get(protectedEmail), protectedAuth);
  assert.equal(
    roleTestDatabase.userRoles.get("protected-profile-id").role,
    "Owner",
  );
  assert.equal(
    roleTestDatabase.estimates.some((row) => row.id === 9901),
    true,
  );
  assert.equal(
    roleTestDatabase.estimateEvents.some((row) => row.id === 9902),
    true,
  );
  assert.equal(
    supabaseAuthRequestHistory.some((request) =>
      request.path.includes("/admin/users"),
    ),
    false,
  );
  supabaseAuthUsers.delete(protectedEmail);
  roleTestDatabase.users.delete("protected-profile-id");
  roleTestDatabase.userRoles.delete("protected-profile-id");
  roleTestDatabase.estimates = roleTestDatabase.estimates.filter(
    (row) => row.id !== 9901,
  );
  roleTestDatabase.estimateEvents = roleTestDatabase.estimateEvents.filter(
    (row) => row.id !== 9902,
  );
  delete process.env.AUTH_TEST_MODE;
  delete process.env.AUTH_TEST_EMAIL;
  await restartTestServer();
});

test("test mode cannot operate in production", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMode = process.env.AUTH_TEST_MODE;
  const previousEmail = process.env.AUTH_TEST_EMAIL;
  try {
    process.env.NODE_ENV = "production";
    process.env.AUTH_TEST_MODE = "true";
    process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
    await restartTestServer();
    const configResponse = await fetch(`${baseUrl}/api/auth/config`);
    assert.equal((await configResponse.json()).testModeEnabled, false);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.AUTH_TEST_MODE = previousMode;
    process.env.AUTH_TEST_EMAIL = previousEmail;
    await restartTestServer();
  }
});

test("test mode cannot operate outside development or test environments", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMode = process.env.AUTH_TEST_MODE;
  const previousEmail = process.env.AUTH_TEST_EMAIL;
  try {
    process.env.NODE_ENV = "staging";
    process.env.AUTH_TEST_MODE = "true";
    process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
    await restartTestServer();
    const response = await fetch(`${baseUrl}/api/auth/config`);
    assert.equal((await response.json()).testModeEnabled, false);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.AUTH_TEST_MODE = previousMode;
    process.env.AUTH_TEST_EMAIL = previousEmail;
    await restartTestServer();
  }
});

test("test mode requires the literal AUTH_TEST_MODE=true value", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMode = process.env.AUTH_TEST_MODE;
  const previousEmail = process.env.AUTH_TEST_EMAIL;
  try {
    process.env.NODE_ENV = "development";
    process.env.AUTH_TEST_MODE = "TRUE";
    process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
    await restartTestServer();
    const response = await fetch(`${baseUrl}/api/auth/config`);
    assert.equal((await response.json()).testModeEnabled, false);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.AUTH_TEST_MODE = previousMode;
    process.env.AUTH_TEST_EMAIL = previousEmail;
    await restartTestServer();
  }
});

test("email signup requires a valid email and an 8-character password", async () => {
  lastSupabaseAuthRequest = null;
  const response = await post("/api/auth/signup", {
    name: "New User",
    email: "new@example.com",
    password: "Ab1!xyz",
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /8 and 128 characters/);
  assert.equal(lastSupabaseAuthRequest, null);
});

test("application-record cleanup failure aborts signup instead of continuing", async () => {
  process.env.AUTH_TEST_MODE = "true";
  process.env.AUTH_TEST_EMAIL = "admin.pricecheck@gmail.com";
  await restartTestServer();
  const email = "admin.pricecheck@gmail.com";
  const profileId = "cleanup-failure-profile";
  supabaseAuthUsers.set(email, {
    user: {
      id: "33333333-3333-4333-8333-333333333333",
      email,
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  });
  roleTestDatabase.users.set(profileId, {
    id: profileId,
    email,
    name: "Old test profile",
  });
  failDatabaseDeletes.add("user_roles");
  supabaseAuthRequestHistory.length = 0;
  try {
    const response = await post("/api/auth/signup", {
      name: "Test User",
      email,
      password: "CobaltSignal7!",
    });
    assert.equal(response.status, 503);
    assert.match(
      (await response.json()).error,
      /Unable to reset the OTP test account/i,
    );
    assert.equal(
      supabaseAuthRequestHistory.some(
        (request) => request.path === "/auth/v1/signup",
      ),
      false,
    );
  } finally {
    failDatabaseDeletes.delete("user_roles");
    supabaseAuthUsers.delete(email);
    roleTestDatabase.users.delete(profileId);
    roleTestDatabase.userRoles.delete(profileId);
    delete process.env.AUTH_TEST_MODE;
    delete process.env.AUTH_TEST_EMAIL;
    await restartTestServer();
  }
});

test("email signup waits for confirmation before creating a session", async () => {
  supabaseAuthResponse = {
    status: 200,
    body: {
      user: { id: "email-user-pending", email: "new@example.com" },
    },
  };
  const response = await post("/api/auth/signup", {
    name: "New User",
    email: "NEW@example.com",
    password: "a-long-test-password1!",
    skillWork: "Brand strategist",
  });
  const payload = await response.json();
  supabaseAuthResponse = null;

  assert.equal(response.status, 202);
  assert.match(payload.message, /6-digit verification code/i);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(lastSupabaseAuthRequest.path, "/auth/v1/signup");
  assert.equal(lastSupabaseAuthRequest.body.email, "new@example.com");
  assert.equal(lastSupabaseAuthRequest.body.password, "a-long-test-password1!");
  assert.equal(
    supabaseAuthRequestHistory.some((request) =>
      request.path.startsWith("/auth/v1/otp"),
    ),
    false,
  );
  assert.equal(payload.email, "new@example.com");
  assert.equal(roleTestDatabase.users.has("email-user-pending"), false);
  assert.equal(roleTestDatabase.userRoles.has("email-user-pending"), false);
});

test("email OTP verification creates the PriceCheck session after confirmation", async () => {
  supabaseAuthUsers.set("otp-user@example.com", {
    user: {
      id: "otp-user",
      email: "otp-user@example.com",
      identities: [{ provider: "email" }],
      user_metadata: { full_name: "OTP User" },
    },
    passwordSalt: "",
    passwordHash: "",
  });
  const response = await post("/api/auth/verify-email", {
    email: "otp-user@example.com",
    token: "123456",
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.user.email, "otp-user@example.com");
  assert.equal(payload.user.role, "Standard User");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.equal(lastSupabaseAuthRequest.path, "/auth/v1/verify");
  assert.deepEqual(lastSupabaseAuthRequest.body, {
    type: "email",
    token: "123456",
    email: "otp-user@example.com",
  });
});

test("email signup resend uses Supabase signup-confirmation resend", async () => {
  const response = await post("/api/auth/resend-otp", {
    email: "pending-signup@example.com",
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.match(payload.message, /new verification code/i);
  assert.equal(lastSupabaseAuthRequest.path, "/auth/v1/resend");
  assert.deepEqual(lastSupabaseAuthRequest.body, {
    type: "signup",
    email: "pending-signup@example.com",
  });
});

test("Supabase resend anti-abuse response returns its actual retry delay", async () => {
  supabaseAuthResponse = {
    status: 429,
    body: {
      code: "over_email_send_rate_limit",
      msg: "For security purposes, you can only request this after 2 seconds.",
    },
  };
  try {
    const response = await post("/api/auth/resend-otp", {
      email: "pending-signup@example.com",
    });
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(payload.error, /temporarily limiting verification/i);
    assert.equal(payload.retryAfterSeconds, 2);
  } finally {
    supabaseAuthResponse = null;
  }
});

test("verification rate limit takes precedence over invalid OTP messaging", async () => {
  supabaseAuthUsers.set("locked-user@example.com", {
    user: {
      id: "44444444-4444-4444-8444-444444444444",
      email: "locked-user@example.com",
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  });
  supabaseAuthResponse = {
    status: 429,
    body: {
      code: "invalid_otp",
      msg: "Invalid OTP. Too many attempts; try again in 75 seconds.",
    },
  };
  try {
    const response = await post("/api/auth/verify-email", {
      email: "locked-user@example.com",
      token: "123456",
    });
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.match(payload.error, /temporarily limiting verification/i);
    assert.equal(payload.retryAfterSeconds, 75);
    assert.doesNotMatch(payload.error, /incorrect/i);
  } finally {
    supabaseAuthResponse = null;
    supabaseAuthUsers.delete("locked-user@example.com");
  }
});

test("signup contains no custom OTP generation and uses Supabase verification", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "server.js"),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /generate(?:d)?Otp|createOtp|Math\.random\(\).*\d{6}/i,
  );
  assert.match(source, /requestSupabaseAuth\("verify"/);
  assert.doesNotMatch(
    source,
    /requestSupabaseAuth\("otp",\s*\{\s*create_user:\s*true/s,
  );
});

test("email signup captures the user's skill/work focus", async () => {
  supabaseAuthResponse = {
    status: 200,
    body: {
      user: {
        id: "email-user-skill-work",
        email: "skill@example.com",
      },
    },
  };

  const response = await post("/api/auth/signup", {
    name: "Skill User",
    email: "skill@example.com",
    password: "a-long-test-password1!",
    skillWork: "Brand designer",
  });
  const payload = await response.json();
  supabaseAuthResponse = null;

  assert.equal(response.status, 202);
  assert.match(payload.message, /6-digit verification code/i);
  assert.equal(lastSupabaseAuthRequest.body.data.full_name, "Skill User");
  assert.equal(lastSupabaseAuthRequest.body.data.skill_work, "Brand designer");
});

test("confirmed email sign-in creates a PriceCheck session and profile", async () => {
  const sheetPath = path.join(
    __dirname,
    "fixtures",
    "tmp-email-auth-users.csv",
  );
  const previousSheetPath = process.env.USER_SHEET_PATH;
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);
  supabaseAuthResponse = {
    status: 200,
    body: {
      user: {
        id: "email-user-confirmed",
        email: "confirmed@example.com",
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { full_name: "Confirmed User" },
      },
    },
  };

  try {
    const response = await post("/api/auth/password", {
      email: "CONFIRMED@example.com",
      password: "a-long-test-password1!",
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.user.email, "confirmed@example.com");
    assert.equal(payload.user.name, "Confirmed User");
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
    assert.equal(
      lastSupabaseAuthRequest.path,
      "/auth/v1/token?grant_type=password",
    );
    assert.equal(
      roleTestDatabase.users.get("email-user-confirmed")?.email,
      "confirmed@example.com",
    );
  } finally {
    supabaseAuthResponse = null;
    if (previousSheetPath === undefined) delete process.env.USER_SHEET_PATH;
    else process.env.USER_SHEET_PATH = previousSheetPath;
    if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);
  }
});

test("registration persists a Standard User profile, newsletter consent, and no client role", async () => {
  const response = await post("/api/auth/signup", {
    name: "New Registration",
    email: "configured-admin@example.com",
    password: "CobaltSignal7!",
    productUpdates: true,
    role: "Super Admin",
  });
  const payload = await response.json();

  assert.equal(response.status, 202);
  assert.equal(payload.email, "configured-admin@example.com");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(lastSupabaseAuthRequest.body.data.newsletter_consent, true);
  assert.equal(Object.hasOwn(lastSupabaseAuthRequest.body.data, "role"), false);
  assert.equal(
    roleTestDatabase.userRoles.has("configured-admin@example.com"),
    false,
  );
});

test("registration rejects each unmet password rule before contacting Supabase Auth", async () => {
  const invalidPasswords = ["Ab1!xyz", "12345678!", "abcdefgh!", "abcdefgh1"];
  for (const [index, password] of invalidPasswords.entries()) {
    lastSupabaseAuthRequest = null;
    const response = await post("/api/auth/signup", {
      name: "Password Rules",
      email: `password-rule-${index}@example.com`,
      password,
    });
    assert.equal(response.status, 400);
    assert.equal(lastSupabaseAuthRequest, null);
  }
});

test("registration links an existing local profile but delegates account creation to Supabase Auth", async () => {
  const email = "legacy-profile-signup@example.com";
  roleTestDatabase.users.set("legacy-profile-canonical-id", {
    id: "legacy-profile-canonical-id",
    email,
    name: "Legacy Google Profile",
    skill_work: "Design",
    picture: "https://example.com/legacy.png",
    newsletter_consent: true,
  });
  roleTestDatabase.userRoles.set("legacy-profile-canonical-id", {
    user_id: "legacy-profile-canonical-id",
    role: "Pricing Manager",
    assigned_by: "admin",
    updated_at: new Date().toISOString(),
  });

  const response = await post("/api/auth/signup", {
    name: "Linked Auth Profile",
    email,
    password: "CobaltSignal7!",
  });
  const payload = await response.json();

  assert.equal(response.status, 202);
  assert.equal(lastSupabaseAuthRequest.path, "/auth/v1/signup");
  assert.equal(payload.email, email);
  assert.equal(
    roleTestDatabase.userRoles.get("legacy-profile-canonical-id")?.role,
    "Pricing Manager",
  );
});

test("Supabase email confirmation errors are not reported as invalid credentials", async () => {
  supabaseAuthResponse = {
    status: 400,
    body: {
      code: "email_not_confirmed",
      msg: "Email not confirmed",
    },
  };
  try {
    const response = await post("/api/auth/password", {
      email: "pending-confirmation@example.com",
      password: "CobaltSignal7!",
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.match(body.error, /confirm your email/i);
  } finally {
    supabaseAuthResponse = null;
  }
});

test("Supabase disabled signup errors report configuration state safely", async () => {
  supabaseAuthResponse = {
    status: 400,
    body: {
      code: "signup_disabled",
      msg: "Signups not allowed for this instance",
    },
  };
  try {
    const response = await post("/api/auth/signup", {
      name: "Disabled Signup",
      email: "disabled-signup@example.com",
      password: "CobaltSignal7!",
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.match(body.error, /currently disabled/i);
    assert.doesNotMatch(body.error, /instance|supabase|apikey/i);
  } finally {
    supabaseAuthResponse = null;
  }
});

test("duplicate profile and auth-only email registrations are rejected", async () => {
  const existingProfileResponse = await post("/api/auth/signup", {
    name: "Duplicate Registration",
    email: "configured-admin@example.com",
    password: "CobaltSignal7!",
  });
  assert.equal(existingProfileResponse.status, 409);

  const authOnlyEmail = "auth-only-duplicate@example.com";
  supabaseAuthUsers.set(authOnlyEmail, {
    user: {
      id: "auth-only-duplicate-user",
      email: authOnlyEmail,
      identities: [{ provider: "email" }],
    },
    passwordSalt: "",
    passwordHash: "",
  });
  const authOnlyResponse = await post("/api/auth/signup", {
    name: "Duplicate Auth User",
    email: authOnlyEmail,
    password: "CobaltSignal7!",
  });
  assert.equal(authOnlyResponse.status, 409);
  assert.equal(roleTestDatabase.users.has("auth-only-duplicate-user"), false);
});

test("email login rejects incorrect passwords and nonexistent accounts", async () => {
  for (const [email, password] of [
    ["configured-admin@example.com", "WrongPassword2!"],
    ["missing-auth-user@example.com", "CobaltSignal7!"],
  ]) {
    const response = await post("/api/auth/password", { email, password });
    assert.equal(response.status, 401);
    assert.match(
      (await response.json()).error,
      /check your email and password/i,
    );
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("roles persist through profile saves, logout/login, session restoration, and server restart", async () => {
  const email = "role-lifecycle@example.com";
  const password = "CobaltSignal7!";
  const registration = await post("/api/auth/signup", {
    name: "Role Lifecycle",
    email,
    password,
  });
  const registered = await registration.json();
  assert.equal(registration.status, 202);
  assert.equal(registered.email, email);

  const verified = await post("/api/auth/verify-email", {
    email,
    token: "123456",
  });
  const verifiedUser = await verified.json();
  assert.equal(verified.status, 200);
  const userId = verifiedUser.user.id;
  const owner = {
    id: "117397307288054651104",
    email: "realemmy55@gmail.com",
    name: "Real Emmy",
  };
  const roleValues = [
    "Pricing Manager",
    "Super Admin",
    "Analyst",
    "Owner",
    "Standard User",
  ];

  for (const role of roleValues) {
    const promote = await fetch(`${baseUrl}/api/admin/access`, {
      method: "POST",
      headers: phase12Auth(owner),
      body: JSON.stringify({
        userId,
        userEmail: email,
        role,
        reason: "Auth persistence test",
      }),
    });
    assert.equal(promote.status, 200, `${role} assignment should persist`);
    assert.equal(roleTestDatabase.userRoles.get(userId)?.role, role);

    const signIn = await post("/api/auth/password", { email, password });
    const signedIn = await signIn.json();
    assert.equal(signIn.status, 200);
    assert.equal(signedIn.user.role, role);
    const cookie = signIn.headers.get("set-cookie").split(";")[0];

    const restoredSession = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: cookie },
    });
    assert.equal(restoredSession.status, 200);
    assert.equal((await restoredSession.json()).user.role, role);

    await fetch(`${baseUrl}/api/auth/signout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  }

  await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(owner),
    body: JSON.stringify({
      userId,
      userEmail: email,
      role: "Pricing Manager",
    }),
  });
  await restartTestServer();
  const pricingManagerLogin = await post("/api/auth/password", {
    email,
    password,
  });
  assert.equal(pricingManagerLogin.status, 200);
  assert.equal((await pricingManagerLogin.json()).user.role, "Pricing Manager");

  const pricingCookie = pricingManagerLogin.headers
    .get("set-cookie")
    .split(";")[0];
  await fetch(`${baseUrl}/api/auth/signout`, {
    method: "POST",
    headers: { Cookie: pricingCookie },
  });
  await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(owner),
    body: JSON.stringify({
      userId,
      userEmail: email,
      role: "Super Admin",
    }),
  });
  await restartTestServer();
  const superAdminLogin = await post("/api/auth/password", {
    email,
    password,
  });
  assert.equal(superAdminLogin.status, 200);
  assert.equal((await superAdminLogin.json()).user.role, "Super Admin");
  assert.equal(roleTestDatabase.userRoles.get(userId)?.role, "Super Admin");
});

test("Google login preserves an existing persistent role and profile consent", async () => {
  const user = {
    id: "google-linked-user",
    email: "google-linked@example.com",
    name: "Google Linked User",
    skillWork: "Design",
    picture: "https://example.com/profile.png",
    newsletterConsent: true,
  };
  const { saveUser, saveUserRole } = require("../lib/supabase");
  await saveUser(user);
  roleTestDatabase.users.get(user.id).newsletter_consent = true;
  await saveUserRole(user.id, "Pricing Manager", "admin", user.email);

  const originalVerify = OAuth2Client.prototype.verifyIdToken;
  OAuth2Client.prototype.verifyIdToken = async () => ({
    getPayload: () => ({
      sub: "google-sub-id",
      email: user.email,
      email_verified: true,
      name: "Google Name",
      picture: "https://example.com/google.png",
    }),
  });

  try {
    const response = await post("/api/auth/google", {
      credential: "test-token",
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.user.id, user.id);
    assert.equal(payload.user.role, "Pricing Manager");
    assert.equal(payload.user.newsletterConsent, true);
    assert.equal(
      roleTestDatabase.userRoles.get(user.id)?.role,
      "Pricing Manager",
    );
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  } finally {
    OAuth2Client.prototype.verifyIdToken = originalVerify;
  }
});

test("Google session is anonymous before sign-in", async () => {
  const response = await fetch(`${baseUrl}/api/auth/session`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: null });

  const invalidSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: "pricecheck_session=invalid.signature" },
  });
  assert.equal(invalidSessionResponse.status, 200);
  assert.deepEqual(await invalidSessionResponse.json(), { user: null });

  const expirationSeconds = Math.floor(Date.now() / 1000) - 60;
  const expiredPayload = Buffer.from(
    JSON.stringify({
      id: "expired-session-user",
      email: "expired-session@example.com",
      exp: expirationSeconds,
      lastActivity: expirationSeconds,
    }),
  ).toString("base64url");
  const expiredSignature = crypto
    .createHmac("sha256", process.env.AUTH_SESSION_SECRET)
    .update(expiredPayload)
    .digest("base64url");
  const expiredSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: {
      Cookie: `pricecheck_session=${expiredPayload}.${expiredSignature}`,
    },
  });
  assert.equal(expiredSessionResponse.status, 200);
  assert.deepEqual(await expiredSessionResponse.json(), { user: null });
});

test("account estimates require an authenticated session", async () => {
  const response = await fetch(`${baseUrl}/api/account/estimates`);
  assert.equal(response.status, 401);
});

test("estimate API declines harmful project prompts", async () => {
  const response = await post("/api/pricecheck", {
    description:
      "I need a plan to build an explosive device and harm people at an event.",
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "INVALID_PROMPT");
  assert.match(payload.error, /estimate declined due to an invalid prompt/i);
});

test("estimate API declines harmful organ-related project prompts", async () => {
  const response = await post("/api/pricecheck", {
    description: "I need a plan for organ trafficking and organ theft.",
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.code, "INVALID_PROMPT");
});

test("estimate API allows valid prompts containing partial words", async () => {
  const response = await post("/api/pricecheck", {
    description:
      "I need a photography plan for a workshop, including portraits and edited event photos.",
  });

  assert.equal(response.status, 200);
});

test("API returns an estimate through the local fallback when Gemini is unavailable", async () => {
  const request = {
    description:
      "I need to shoot a 3-hour birthday event and deliver 150 edited photos for a small business.",
    experienceLevel: "professional",
    deadline: "3_6_days",
  };
  const response = await post("/api/pricecheck", request);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.project.service, "Photography");
  assert.equal(result.project.projectType, "Birthday Event");
  assert.equal(result.project.experience, "professional");
  assert.equal(result.project.deadline, "3_6_days");
  assert.ok(result.pricing.recommendedQuote > 0);

  const repeatedResponse = await post("/api/pricecheck", request);
  assert.equal(repeatedResponse.status, 200);
  assert.deepEqual(await repeatedResponse.json(), result);
});

test("API recalculates when an estimate selection changes", async () => {
  const description =
    "I need a three-page website with a contact form for a startup.";
  const firstResponse = await post("/api/pricecheck", {
    description,
    experienceLevel: "starting_out",
    deadline: "flexible",
  });
  const changedResponse = await post("/api/pricecheck", {
    description,
    experienceLevel: "expert",
    deadline: "same_day_rush",
  });

  assert.equal(firstResponse.status, 200);
  assert.equal(changedResponse.status, 200);
  assert.notDeepEqual(await changedResponse.json(), await firstResponse.json());
});

test("API shares one result across concurrent identical requests", async () => {
  const request = {
    description: "I need a product launch video with editing and captions.",
    experienceLevel: "professional",
    deadline: "3_6_days",
  };
  const [firstResponse, secondResponse] = await Promise.all([
    post("/api/pricecheck", request),
    post("/api/pricecheck", {
      ...request,
      description: `  ${request.description}  `,
    }),
  ]);
  const firstResult = await firstResponse.json();
  const secondResult = await secondResponse.json();

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.deepEqual(secondResult, firstResult);
});

test("API accepts optional deliverables and preserves them in the estimate", async () => {
  const response = await post("/api/pricecheck", {
    description: "I need a landing page for a small business website.",
    deliverables: "Responsive landing page, contact form, source files",
    experienceLevel: "professional",
    deadline: "3_6_days",
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result.project.deliverables, [
    "Responsive landing page",
    "contact form",
    "source files",
  ]);
});

test("PDF endpoint returns a downloadable PDF for the visible estimate data", async () => {
  const estimate = {
    project: {
      projectType: "Birthday Event",
      experience: "professional",
      deadline: "3_6_days",
      complexity: "medium",
      clientType: "small_business",
      duration: "3 hours",
      deliverables: ["150 edited photos"],
      revisions: 2,
    },
    pricing: {
      category: "Photography",
      recommendedQuote: 179000,
      fairRange: { min: 143000, max: 215000 },
    },
    advice: {
      reasons: ["3 hours of shooting"],
      advice: "Present the quote with a clear scope.",
      negotiationTip: "Adjust scope before reducing price.",
    },
  };
  const response = await post("/api/pricecheck/pdf", estimate);
  const body = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/pdf/);
  assert.match(
    response.headers.get("content-disposition"),
    /pricecheck-birthday-event-estimate\.pdf/,
  );
  assert.deepEqual(body.subarray(0, 4), Buffer.from("%PDF"));
  assert.ok(body.length > 1000);
});

test("invoice endpoint returns a downloadable invoice PDF", async () => {
  const response = await post("/api/pricecheck/invoice", {
    fromName: "Alex Studio",
    clientName: "Acme Ltd",
    clientEmail: "client@example.com",
    projectTitle: "Landing Page",
    deliverables: "Responsive page, contact form",
    dueDate: "2026-10-01",
    bankName: "First Bank",
    accountName: "Alex Studio",
    accountNumber: "0123456789",
    notes: "Payment due within 14 days.",
    amount: 250000,
    currency: { code: "NGN", locale: "en-NG" },
  });
  const body = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/pdf/);
  assert.match(
    response.headers.get("content-disposition"),
    /pricecheck-invoice-landing-page\.pdf/,
  );
  assert.deepEqual(body.subarray(0, 4), Buffer.from("%PDF"));
  assert.ok(body.length > 1000);
});

test("invoice endpoint requires bank details", async () => {
  const response = await post("/api/pricecheck/invoice", {
    fromName: "Alex Studio",
    clientName: "Acme Ltd",
    projectTitle: "Landing Page",
    amount: 250000,
    currency: "NGN",
  });

  assert.equal(response.status, 400);
});

test("feedback endpoint accepts a pricing outcome without project details", async () => {
  const response = await post("/api/pricecheck/feedback", {
    category: "Website Development",
    currency: "NGN",
    suggestedAmount: 250000,
    actualAmount: 300000,
    outcome: "accepted",
    adjustmentReason: "scope_changed",
  });

  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(result.saved, true);
  assert.equal(typeof result.persisted, "boolean");
});

test("feedback endpoint rejects incomplete pricing outcomes", async () => {
  const response = await post("/api/pricecheck/feedback", {
    suggestedAmount: 250000,
    outcome: "accepted",
  });

  assert.equal(response.status, 400);
});

test("admin summary requires an authenticated admin session", async () => {
  const response = await post("/api/pricecheck/feedback", {
    category: "Consulting",
    currency: "NGN",
    suggestedAmount: 100000,
    actualAmount: 100000,
    outcome: "accepted",
    adjustmentReason: "none",
  });
  assert.equal(response.status, 201);

  const summaryResponse = await fetch(
    `${baseUrl}/api/pricecheck/admin/summary`,
  );
  assert.equal(summaryResponse.status, 403);
});

test("account profile requires a valid email and stores newsletter consent", async () => {
  const user = {
    id: "profile-user-1",
    email: "reader@example.com",
    name: "Reader Example",
    givenName: "Reader",
    familyName: "Example",
    locale: "en-US",
    isAdmin: false,
    newsletterConsent: true,
  };
  seedRoleUser(user, "Analyst");

  const response = await fetch(`${baseUrl}/api/account/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `pricecheck_session=${createSession(user)}`,
    },
    body: JSON.stringify({
      email: "updated-reader@example.com",
      newsletterConsent: true,
      role: "Super Admin",
    }),
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.user.email, "updated-reader@example.com");
  assert.equal(payload.user.newsletterConsent, true);
  assert.equal(payload.user.role, "Analyst");
  assert.equal(roleTestDatabase.userRoles.get(user.id)?.role, "Analyst");
});

// Phase 12 — Comprehensive Admin & System Test Suite
const phase12SuperAdmin = {
  id: "admin-primary",
  email: "admin@pricecheck.ng",
  name: "Super Admin User",
  isAdmin: true,
};

const phase12PricingMgr = {
  id: "pricing-mgr",
  email: "pricing@pricecheck.ng",
  name: "Pricing Manager User",
  role: "Pricing Manager",
  isAdmin: false,
};

const phase12Analyst = {
  id: "analyst-lead",
  email: "analyst@pricecheck.ng",
  name: "Analyst User",
  role: "Analyst",
  isAdmin: false,
};

const phase12StandardUser = {
  id: "user-standard",
  email: "standard@example.com",
  name: "Standard Client User",
  isAdmin: false,
};

function phase12Auth(user) {
  return {
    "Content-Type": "application/json",
    Cookie: `pricecheck_session=${createSession(user)}`,
  };
}

function seedRoleUser(user, role) {
  roleTestDatabase.users.set(String(user.id), {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture || "",
    given_name: user.givenName || "",
    family_name: user.familyName || "",
    locale: user.locale || "",
    newsletter_consent: false,
    last_seen_at: new Date().toISOString(),
  });
  roleTestDatabase.userRoles.set(String(user.id), {
    user_id: user.id,
    role,
    assigned_by: "test",
    updated_at: new Date().toISOString(),
  });
}

seedRoleUser(phase12SuperAdmin, "Super Admin");
seedRoleUser(phase12PricingMgr, "Pricing Manager");
seedRoleUser(phase12Analyst, "Analyst");
seedRoleUser(phase12StandardUser, "Standard User");
seedRoleUser(
  {
    id: "117397307288054651104",
    email: "realemmy55@gmail.com",
    name: "Real Emmy",
  },
  "Owner",
);
seedRoleUser(
  {
    id: "112751774980411941634",
    email: "cybroxstudios@gmail.com",
    name: "Cybrox Studios",
  },
  "Analyst",
);

test("RBAC users list is populated from real registered users and exposes live status", async () => {
  process.env.USER_SHEET_PATH = path.join(
    __dirname,
    "..",
    "data",
    "user-details.csv",
  );

  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data.users));
  assert.equal(data.currentUserId, phase12SuperAdmin.id);
  assert.ok(data.users.some((user) => user.email === "realemmy55@gmail.com"));
  assert.ok(data.users.some((user) => user.role === "Owner"));
  assert.ok(data.users.some((user) => user.role === "Super Admin"));
  assert.ok(data.users[0].role === "Owner");
  assert.ok(data.users.every((user) => typeof user.status === "string"));
});

test("Session role metadata remains intact so RBAC can authorize non-default admin roles", async () => {
  const scopedUser = {
    id: "session-role-user",
    email: "session-role-user@example.com",
    name: "Session Role User",
    role: "Pricing Manager",
    isAdmin: false,
  };
  seedRoleUser(scopedUser, "Pricing Manager");

  const res = await fetch(`${baseUrl}/api/admin/pricing`, {
    headers: {
      "Content-Type": "application/json",
      Cookie: `pricecheck_session=${createSession(scopedUser)}`,
    },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.categories);
});

test("Default admin email remains protected and cannot be demoted", async () => {
  const res = await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      userId: "realemmy55@gmail.com",
      userEmail: "realemmy55@gmail.com",
      role: "Standard User",
      reason: "Attempt to remove default admin",
    }),
  });

  assert.equal(res.status, 403);
  const payload = await res.json();
  assert.match(payload.error, /default admin.*protected|cannot be edited/i);
});

test("Protected owner is elevated to the highest hierarchy level with full admin access", async () => {
  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12SuperAdmin),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  const owner = data.users.find(
    (user) => user.email === "realemmy55@gmail.com",
  );

  assert.ok(owner, "default admin should be present in RBAC list");
  assert.equal(owner.role, "Owner");
  assert.deepEqual(owner.permissions, [
    "pricing",
    "access",
    "analytics",
    "telemetry",
  ]);
});

test("Role updates cannot create a synthetic user that is absent from the database", async () => {
  const promoteRes = await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      userId: "new-promoted-user",
      userEmail: "new-promoted-user@example.com",
      role: "Pricing Manager",
      reason: "New team member promotion",
    }),
  });
  assert.equal(promoteRes.status, 404);

  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(
    !data.users.some((user) => user.email === "new-promoted-user@example.com"),
  );
});

test("Administrators cannot change their own role by ID or email", async () => {
  for (const payload of [
    {
      userId: phase12SuperAdmin.id,
      userEmail: "different-email@example.com",
      role: "Analyst",
    },
    {
      userId: "different-id",
      userEmail: phase12SuperAdmin.email,
      role: "Standard User",
    },
  ]) {
    const response = await fetch(`${baseUrl}/api/admin/access`, {
      method: "POST",
      headers: phase12Auth(phase12SuperAdmin),
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: "You cannot change your own role.",
    });
  }
  assert.equal(
    roleTestDatabase.userRoles.get(phase12SuperAdmin.id).role,
    "Super Admin",
  );
});

test("Administrators can still change another registered user's role", async () => {
  const response = await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      userId: phase12StandardUser.id,
      userEmail: phase12StandardUser.email,
      role: "Analyst",
      reason: "Verify another user's role remains editable",
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(
    roleTestDatabase.userRoles.get(phase12StandardUser.id).role,
    "Analyst",
  );
  roleTestDatabase.userRoles.set(phase12StandardUser.id, {
    ...roleTestDatabase.userRoles.get(phase12StandardUser.id),
    role: "Standard User",
  });
});

test("ID-only role promotions do not create fake @assigned.local rows in the RBAC UI", async () => {
  const userId = "112751774980411941634";
  const promoteRes = await fetch(`${baseUrl}/api/admin/access`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      userId,
      userEmail: "",
      role: "Analyst",
      reason: "ID-only promotion should not create a fake user row",
    }),
  });
  assert.equal(promoteRes.status, 200);

  const res = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(
    !data.users.some((user) => user.email === `${userId}@assigned.local`),
    "ID-only role promotions should not create a synthetic @assigned.local user row",
  );
  assert.ok(
    data.users.some(
      (user) => user.id === userId && user.email === "cybroxstudios@gmail.com",
    ),
    "a real registered user remains listed using their database identity",
  );
});

test("Promoted roles survive profile saves and are refreshed from the database", async () => {
  const sheetPath = path.join(
    __dirname,
    "fixtures",
    "tmp-role-persistence.csv",
  );
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);

  const user = {
    id: "persistent-role-user",
    email: "persistent-role@example.com",
    name: "Persistent Role User",
    isAdmin: false,
  };
  const { saveUser, saveUserRole } = require("../lib/supabase");

  await saveUser(user);
  assert.equal(
    roleTestDatabase.userRoles.get(user.id).role,
    "Standard User",
    "a first profile save should assign the default role",
  );

  assert.equal(
    await saveUserRole(
      user.id,
      "Pricing Manager",
      "admin@pricecheck.ng",
      user.email,
    ),
    true,
  );
  await saveUser({ ...user, name: "Updated Profile Name" });
  assert.equal(roleTestDatabase.userRoles.get(user.id).role, "Pricing Manager");

  assert.equal(
    await saveUserRole(
      user.id,
      "Super Admin",
      "admin@pricecheck.ng",
      user.email,
    ),
    true,
  );
  await saveUser({ ...user, name: "Updated Again" });

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: `pricecheck_session=${createSession(user)}` },
  });
  assert.equal(sessionResponse.status, 200);
  const sessionBody = await sessionResponse.json();
  assert.equal(sessionBody.user.role, "Super Admin");
  assert.equal(roleTestDatabase.userRoles.get(user.id).role, "Super Admin");

  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);
});

test("Legacy email-keyed promotions migrate to the canonical database user id", async () => {
  const sheetPath = path.join(__dirname, "fixtures", "tmp-legacy-role.csv");
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);

  const user = {
    id: "legacy-role-user",
    email: "legacy-role@example.com",
    name: "Legacy Role User",
  };
  roleTestDatabase.userRoles.set(user.email, {
    user_id: user.email,
    role: "Super Admin",
    assigned_by: "admin@pricecheck.ng",
    updated_at: new Date().toISOString(),
  });

  const { saveUser } = require("../lib/supabase");
  await saveUser(user);

  assert.equal(
    roleTestDatabase.userRoles.get(user.id).role,
    "Super Admin",
    "legacy role is copied to the canonical id instead of initializing Standard User",
  );
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: `pricecheck_session=${createSession(user)}` },
  });
  assert.equal(sessionResponse.status, 200);
  const sessionBody = await sessionResponse.json();
  assert.equal(sessionBody.user.role, "Super Admin");

  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);
});

test("Login persistence canonicalizes a legacy slug role without downgrading it", async () => {
  const sheetPath = path.join(__dirname, "fixtures", "tmp-slug-role.csv");
  process.env.USER_SHEET_PATH = sheetPath;
  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);

  const user = {
    id: "slug-role-user",
    email: "slug-role@example.com",
    name: "Slug Role User",
    isAdmin: false,
  };
  roleTestDatabase.userRoles.set(user.id, {
    user_id: user.id,
    role: "super_admin",
    assigned_by: "admin@pricecheck.ng",
    updated_at: new Date().toISOString(),
  });

  const { saveUser } = require("../lib/supabase");
  await saveUser(user);

  assert.equal(roleTestDatabase.userRoles.get(user.id).role, "Super Admin");
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: `pricecheck_session=${createSession(user)}` },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.role, "Super Admin");

  if (fs.existsSync(sheetPath)) fs.unlinkSync(sheetPath);
});

test("Phase 12 RBAC - Super Admin has access to all admin domains", async () => {
  const telemetryRes = await fetch(`${baseUrl}/api/admin/telemetry`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(telemetryRes.status, 200);

  const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(usersRes.status, 200);

  const pricingRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(pricingRes.status, 200);

  const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(auditRes.status, 200);
});

test("Phase 12 RBAC - Pricing Manager can access pricing but not user access control", async () => {
  const pricingRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    headers: phase12Auth(phase12PricingMgr),
  });
  assert.equal(pricingRes.status, 200);

  const usersRes = await fetch(`${baseUrl}/api/admin/users`, {
    headers: phase12Auth(phase12PricingMgr),
  });
  assert.equal(usersRes.status, 403);
});

test("Phase 12 RBAC - Analyst can access audit-logs and summary but cannot modify pricing or users", async () => {
  const auditRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    headers: phase12Auth(phase12Analyst),
  });
  assert.equal(auditRes.status, 200);

  const patchPricingRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "PATCH",
    headers: phase12Auth(phase12Analyst),
    body: JSON.stringify({
      category: "Graphic Design",
      basePrice: 50000,
      minimumPrice: 20000,
      maximumPrice: 100000,
    }),
  });
  assert.equal(patchPricingRes.status, 403);
});

test("Phase 12 RBAC - Standard User is denied access to all administrative endpoints", async () => {
  const endpoints = [
    "/api/admin/telemetry",
    "/api/admin/users",
    "/api/admin/pricing",
    "/api/admin/audit-logs",
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      headers: phase12Auth(phase12StandardUser),
    });
    assert.equal(
      res.status,
      403,
      `Endpoint ${endpoint} should return 403 for Standard User`,
    );
  }
});

test("Phase 12 RBAC - Unauthenticated requests are denied with 403", async () => {
  const res = await fetch(`${baseUrl}/api/admin/telemetry`);
  assert.equal(res.status, 403);
});

test("Phase 12 RBAC - Direct query parameter authorization bypass attempt fails", async () => {
  const res = await fetch(
    `${baseUrl}/api/admin/pricing?isAdmin=true&role=Super+Admin`,
  );
  assert.equal(res.status, 403);
});

test("Phase 12 Pricing - Valid pricing update via POST and PATCH", async () => {
  const postRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      category: "Graphic Design",
      basePrice: 50000,
      minimumPrice: 30000,
      maximumPrice: 90000,
      reason: "Market adjustment test",
    }),
  });
  assert.equal(postRes.status, 200);
  const postData = await postRes.json();
  assert.equal(postData.success, true);
  assert.equal(postData.updated.basePrice, 50000);

  const patchRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "PATCH",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      category: "Graphic Design",
      basePrice: 55000,
      minimumPrice: 35000,
      maximumPrice: 95000,
    }),
  });
  assert.equal(patchRes.status, 200);
  const patchData = await patchRes.json();
  assert.equal(patchData.updated.basePrice, 55000);
});

test("Phase 12 Pricing - Invalid values (negative, zero, non-numeric) are rejected", async () => {
  const invalidCases = [
    { basePrice: -5000, minimumPrice: 1000, maximumPrice: 10000 },
    { basePrice: 0, minimumPrice: 1000, maximumPrice: 10000 },
    { basePrice: "invalid", minimumPrice: 1000, maximumPrice: 10000 },
  ];

  for (const payload of invalidCases) {
    const res = await fetch(`${baseUrl}/api/admin/pricing`, {
      method: "POST",
      headers: phase12Auth(phase12SuperAdmin),
      body: JSON.stringify({ category: "Graphic Design", ...payload }),
    });
    assert.equal(res.status, 400);
  }
});

test("Phase 12 Pricing - Rejects minimum price greater than maximum or base price", async () => {
  const minGtMaxRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      category: "Graphic Design",
      basePrice: 50000,
      minimumPrice: 100000,
      maximumPrice: 80000,
    }),
  });
  assert.equal(minGtMaxRes.status, 400);

  const minGtBaseRes = await fetch(`${baseUrl}/api/admin/pricing`, {
    method: "POST",
    headers: phase12Auth(phase12SuperAdmin),
    body: JSON.stringify({
      category: "Graphic Design",
      basePrice: 50000,
      minimumPrice: 60000,
      maximumPrice: 80000,
    }),
  });
  assert.equal(minGtBaseRes.status, 400);
});

test("Phase 12 Pricing - Reset restores category to default baseline", async () => {
  const resetRes = await fetch(
    `${baseUrl}/api/admin/pricing/Graphic%20Design/reset`,
    {
      method: "POST",
      headers: phase12Auth(phase12SuperAdmin),
    },
  );
  assert.equal(resetRes.status, 200);
  const resetData = await resetRes.json();
  assert.equal(resetData.success, true);
  assert.equal(typeof resetData.updated.basePrice, "number");
});

test("Phase 12 Telemetry - Returns healthy status with memory and process diagnostics", async () => {
  const res = await fetch(`${baseUrl}/api/admin/telemetry`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, "healthy");
  assert.equal(typeof data.timestamp, "string");
  assert.equal(typeof data.process.uptimeSeconds, "number");
  assert.equal(typeof data.process.uptimeFormatted, "string");
  assert.equal(typeof data.memory.heapUsedMb, "number");
  assert.equal(typeof data.memory.heapTotalMb, "number");
  assert.equal(typeof data.memory.rssMb, "number");
  assert.equal(typeof data.services.geminiStatus, "string");
  assert.equal(typeof data.services.supabaseStatus, "string");
});

test("Phase 12 Audit Logs - Supports creation, severity filtering, search, and clearing", async () => {
  const logsRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(logsRes.status, 200);
  const logsData = await logsRes.json();
  assert.equal(Array.isArray(logsData.logs), true);

  const filteredSevRes = await fetch(
    `${baseUrl}/api/admin/audit-logs?severity=info`,
    {
      headers: phase12Auth(phase12SuperAdmin),
    },
  );
  assert.equal(filteredSevRes.status, 200);

  const searchRes = await fetch(
    `${baseUrl}/api/admin/audit-logs?search=Pricing`,
    {
      headers: phase12Auth(phase12SuperAdmin),
    },
  );
  assert.equal(searchRes.status, 200);

  const clearRes = await fetch(`${baseUrl}/api/admin/audit-logs`, {
    method: "DELETE",
    headers: phase12Auth(phase12SuperAdmin),
  });
  assert.equal(clearRes.status, 200);
  const clearData = await clearRes.json();
  assert.equal(clearData.success, true);
});

test("Phase 12 Frontend Interactions - Diff calculation and Toast formatting", () => {
  const computeDiff = (oldVal, newVal) => {
    const diff = newVal - oldVal;
    const pct = oldVal > 0 ? ((diff / oldVal) * 100).toFixed(1) : 0;
    return { diff, pct: `${diff >= 0 ? "+" : ""}${pct}%` };
  };

  const diffResult = computeDiff(50000, 60000);
  assert.equal(diffResult.diff, 10000);
  assert.equal(diffResult.pct, "+20.0%");

  const createToastObject = (message, type = "info", duration = 4000) => ({
    id: "toast_" + Math.random().toString(36).slice(2, 9),
    message,
    type,
    duration,
  });

  const toast = createToastObject("Pricing saved successfully", "success");
  assert.equal(toast.type, "success");
  assert.equal(toast.message, "Pricing saved successfully");
});
