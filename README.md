# PriceCheck

**Know what to charge. Before you quote.**

PriceCheck helps freelancers and small service providers — especially African and Nigerian creatives — figure out a practical price for a project before they send a quote. Describe the project in plain language, and PriceCheck returns a recommended quote, a fair price range, a breakdown of the project, and the reasoning behind the number.

PriceCheck does **not** let AI invent a price out of thin air. Gemini only reads your description and extracts structured facts (service type, duration, deliverables, complexity, etc.). A deterministic pricing engine, configured in `config/pricing.js`, turns those facts into the actual number. Gemini is then used a second time to explain that already-calculated price in plain language.

---

## 1. What PriceCheck is

- A single-page web app: describe a project, get an estimate.
- Backend does all AI calls — your Gemini API key never touches the browser.
- Pricing values live in one plain config file, so anyone can update them without touching app logic.
- Optional Supabase persistence for anonymous pricing feedback; local fallback remains available.

## 2. Installation

Requirements: Node.js 18 or later.

```bash
cd pricecheck
npm install
```

## 3. How to create a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with a Google account.
3. Click **Create API key** and choose or create a Google Cloud project.
4. Copy the generated key — you'll paste it into `.env` in the next step.

## 4. How to configure `.env`

A `.env` file is already included at the project root. Open it and replace the placeholder with your real key:

```
GEMINI_API_KEY=your_key_here
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
# Alternatively, set SUPABASE_PUBLISHABLE_KEY to the Supabase publishable key.
ADMIN_DASHBOARD_KEY=your_admin_dashboard_key
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
AUTH_SESSION_SECRET=a_random_secret_at_least_32_characters_long
```

`.env` is listed in `.gitignore`, so it will never be committed to version control. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never put credentials in any file inside `public/` — those files are sent straight to the browser.

### Google sign-in setup

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure the OAuth consent screen, then create an **OAuth client ID** for a **Web application**.
2. Add your development and production addresses to **Authorized JavaScript origins** (for example, `http://localhost:3000`).
3. Put its client ID in `GOOGLE_CLIENT_ID`. A client ID is safe to send to the browser; do not add a Google client secret.
4. Generate a unique `AUTH_SESSION_SECRET` with at least 32 characters, add it to `.env`, then restart the server.

When both variables are set, Google sign-in is available on `/login`. The server verifies the returned Google ID token and creates a seven-day HTTP-only session cookie. If either variable is missing, Google sign-in is hidden while other configured sign-in methods remain available.

## 5. Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL, service role key, and publishable/anon key into `.env`. Keep the service role key server-only; the anon key is intended for client-facing authentication, but this app uses it only from the server.
4. Optionally set `ADMIN_DASHBOARD_KEY` to protect the admin summary endpoint.
5. Restart the server after changing `.env`.

To enable traditional email/password accounts, configure Supabase Auth email signup and email confirmations, set the Supabase Site URL and allowed redirect URLs for your app, and configure production SMTP for reliable confirmation delivery. Set `AUTH_SESSION_SECRET` to a unique random value of at least 32 characters. Passwords must be at least 8 characters and contain a letter, number, and symbol; Supabase Auth stores and verifies password hashes. When email confirmation is enabled, the account profile is created at signup, but PriceCheck creates an app session only after confirmation. Google and email sign-in use the same PriceCheck profile when their email addresses match.

### Transactional email

Supabase Auth remains responsible for verification codes and other Auth emails. Custom notifications use SMTP through the service-authorized `send-email-notifications` Edge Function. Express queues events in the existing Supabase outbox; delivery status, attempts, backoff retries, consent checks, unsubscribe handling, and transactional role/status updates remain unchanged. The SMTP message ID is stable per event, but SMTP does not provide provider-level idempotency, so a rare duplicate is possible if delivery succeeds and the worker fails before recording success. An SMTP outage does not undo a successful role or status change.

For existing Supabase projects, apply any outstanding role migration, then `supabase/migrations/20260930_add_email_events.sql` and `supabase/migrations/20261001_email_notification_outbox.sql`. Fresh projects should run `supabase/schema.sql`, `supabase/migrations/20260930_add_owner_role.sql`, `supabase/migrations/20260930_add_email_events.sql`, and `supabase/migrations/20261001_email_notification_outbox.sql`, in that order. Deploy the Edge Function with the Supabase CLI:

```sh
supabase functions deploy send-email-notifications
supabase secrets set SMTP_HOST=mail.example.com SMTP_PORT=465 SMTP_USER=... SMTP_PASS=... EMAIL_FROM="PriceCheck <verified-sender@example.com>" EMAIL_REPLY_TO=support@example.com
```

Keep SMTP credentials and the service-role key exclusively in server/Edge Function secrets. Set `APP_URL` to the public HTTPS application URL and `EMAIL_UNSUBSCRIBE_SECRET` to a unique random value of at least 32 characters in the Express host (Render). `SMTP_PORT` defaults to 465 (implicit TLS); port 2525 can be used with STARTTLS when supported by the mail host. Supabase Edge Functions block outbound ports 25 and 587. Configure the SMTP host/account and sender authorization, plus Supabase Auth SMTP, Site URL, allowed redirect URLs, and OTP template separately in their dashboards; repository configuration cannot confirm live setup or delivery.

Invoke the function after deploying it to verify its protected worker configuration. Also schedule a trusted Supabase Cron invocation of `send-email-notifications` at least once per minute, using the service-role authorization from Supabase Vault, so queued and retryable events are delivered even when an immediate Express invocation fails. Never put the service-role key in a frontend, source file, or public Vercel configuration.

The worker handles verified-account welcome emails, role changes, alerts to other administrators when Owner/Super Admin access changes, account suspension/restoration, and consented promotional campaigns. Admins may enqueue a campaign using `POST /api/admin/marketing-campaigns` with a stable UUID `campaignId`, `subject`, and `html` and/or `text`; the API targets opted-in active users only. The worker checks consent and unsubscribe status again immediately before sending. `GET /unsubscribe?token=...` shows a confirmation page and `POST /unsubscribe` applies the revocable unsubscribe token. Account status changes are available at `PATCH /api/admin/users/:userId/status`. Both admin endpoints require the existing `access` permission. Account/security notices are not affected by promotional unsubscribe. The app does not currently generate new-device sign-in or password-change alerts; configure and verify any desired authentication-security emails through Supabase Auth.

The account profile endpoint records the user's explicit marketing preference. Missing SMTP configuration or a failed SMTP delivery is logged and leaves events queued/retryable; it does not fail signup or roll back a role/status change. Run `npm test` to validate auth, role authorization, queueing, consent, unsubscribe, SMTP configuration, and email template behavior.

For an existing Supabase project, run `supabase/migrations/20260930_add_owner_role.sql` after `supabase/schema.sql`. It adds `Owner` to the database role constraint and backfills role rows only for existing profiles, carrying forward email-keyed legacy role rows where present. New profiles receive `Standard User`; existing role rows are never overwritten by login or profile updates.

If you use `ADMIN_EMAILS`, assign each already-registered admin's intended role in `user_roles` before deploying DB-authoritative authorization. For example, replace the email literal and role below with that real existing profile's values; this updates no profile and creates no user:

```sql
insert into public.user_roles (user_id, role, assigned_by)
select id, 'Owner', 'deployment-migration'
from public.users
where lower(email) = lower('owner@example.com')
on conflict (user_id) do update
set role = excluded.role,
    assigned_by = excluded.assigned_by,
    updated_at = now();
```

When the Supabase variables are blank, feedback is accepted locally but is not durable, and email/password authentication is unavailable. When Google sign-in or email/password sign-in and Supabase are configured, each signed-in user's estimates are saved to their account and restored in their history. Run `supabase/schema.sql` after updating the app to create the `user_estimates` table.

## 6. How to run it

```bash
npm start
```

Then open **http://localhost:3001** in your browser.

## 7. Project structure

```
pricecheck/
  package.json          Dependencies and the "start" script
  server.js              Express server + /api/pricecheck endpoint
  .env                    Your Gemini API key (not committed)
  .gitignore

  config/
    pricing.js            All pricing data: category base prices and modifiers

  lib/
    geminiClient.js        Wraps both Gemini calls (extraction + advice)
    pricingEngine.js        Deterministic price calculator
    validateProjectData.js   Defensive validation of Gemini's output
    supabase.js              Optional server-only Supabase persistence

  supabase/
    schema.sql                Pricing feedback table and RLS policy

  public/
    index.html              App shell (input, loading, error, result views)
    styles.css               Dark, glass-surface fintech-style UI
    app.js                   Frontend logic: submit, render, copy quote
```

### How a request flows

1. The browser posts `{ description, experienceLevel, deadline }` to `POST /api/pricecheck`.
2. `lib/geminiClient.js` sends the description to Gemini with a strict JSON response schema and gets back structured project facts (service, complexity, duration, deliverables, etc.).
3. `lib/validateProjectData.js` sanity-checks every field — anything missing or malformed falls back to a safe default instead of breaking the app.
4. `lib/pricingEngine.js` combines the category base price from `config/pricing.js` with modifiers for experience, complexity, deadline, client type, duration, deliverables, and revisions to calculate a recommended quote and a fair range.
5. Gemini is called a second time, given the already-calculated price, to write 3–5 short reasons, a piece of advice, and a negotiation tip.
6. The full result is returned to the browser and rendered.
7. `POST /api/pricecheck/pdf` creates a download from the completed result without recalculating it.

## 8. How pricing values can be modified

Everything pricing-related lives in **`config/pricing.js`**. You do not need to touch any other file to change how PriceCheck prices projects.

- **Change a category's price range** — edit `basePrice`, `minimumPrice`, or `maximumPrice` inside `CATEGORIES`:

  ```js
  Photography: { basePrice: 60000, minimumPrice: 25000, maximumPrice: 600000 },
  ```

- **Change how much an attribute affects price** — edit the matching multiplier inside `MODIFIERS`. For example, to make "expert" experience worth more:

  ```js
  experience: {
    starting_out: 0.75,
    intermediate: 1.0,
    professional: 1.2,
    expert: 1.45   // increase this to reward experience more
  }
  ```

- **Add a brand-new service category** — copy an existing line inside `CATEGORIES`, give it a new key, and add it to the `enum` list Gemini is told to choose from (this list is generated automatically from `CATEGORIES`, so no other file needs updating).

The Nigerian Naira values shipped in this MVP are estimates for demonstration purposes, not claims of official market rates. Adjust them to match real data as you gather it.

---

## Notes on scope

This MVP includes optional Google and Supabase email/password sign-in for authenticated sessions. Supabase Auth handles password credentials and email confirmation; PriceCheck issues its own HTTP-only session cookie. Account history uses the existing Supabase profile and estimate tables.
