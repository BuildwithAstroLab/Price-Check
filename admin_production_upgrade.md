# PriceCheck Admin Dashboard — Production Upgrade Documentation

## Overview

The PriceCheck Admin Control Center has been upgraded into a production-ready, 4-tier administrative dashboard. It provides complete real-time monitoring, no-code dynamic pricing configuration, role-based access control (RBAC), and server process telemetry — without breaking any existing authentication, pricing logic, Supabase security, PDF generation, or test coverage.

---

## 1. Information Architecture & Navigation

The Admin Dashboard is organized into 4 tab panels accessible via `#admin-view`:

1. **Overview & Analytics** (`#admin-tab-overview` / `#overview`)
   - **Real SaaS KPI Metrics**: Displays total estimates generated, registered users, feedback records, client acceptance rate, and estimate accuracy calibration.
   - **Data Authenticity**: All numbers reflect real backend data. Loading states (`—`), error fallbacks (`Data unavailable`), and empty states (`0` / `0%`) are displayed appropriately without fake trend arrows or fabricated percentage changes.
   - **Visual Visualizations**: Category performance bar charts, outcome distribution donut charts, estimate vs. actual scatter plots, and popular service intelligence tables.

2. **Pricing Studio** (`#admin-tab-pricing` / `#pricing`)
   - **No-Code Dynamic Control**: Admin users can adjust baseline prices, minimum limits, and maximum caps for all supported PriceCheck service categories (Web Development, Mobile App, UI/UX Design, DevOps & Cloud, Consulting & Audit) in real time without altering server code.
   - **Interactive Visualizers**: Synchronized range sliders and numerical inputs for min, base, and max values.
   - **Safety & Validation**: Strict validation prevents negative pricing, zero values, or invalid ranges (e.g., minimum > base, base > maximum). A dynamic **Confirmation Diff Modal** displays exact price changes before committing updates to the production engine.

3. **Access Control RBAC** (`#admin-tab-rbac` / `#rbac`)
   - **4-Tier Administrative Roles**: Supports `Super Admin`, `Pricing Manager`, `Analyst`, and `Standard User`.
   - **Privileges & Governance Matrix**:
     - `Super Admin`: Full administrative access (`pricing`, `access`, `analytics`, `telemetry`).
     - `Pricing Manager`: Pricing Studio baseline & range limit controls (`pricing`, `analytics`).
     - `Analyst`: Read-only access to feedback trends, summaries, and outcomes (`analytics`).
     - `Standard User`: Standard PriceCheck user functionality (no administrative permissions).
   - **Live Search & Filter Toolbar**: Search user table live by name, email, or role, plus quick-filter tab buttons (`All`, `Super Admin`, `Pricing Manager`, `Analyst`, `Standard User`).
   - **Role Confirmation Dialog**: All role updates trigger a confirmation modal (`#rbac-confirm-modal`) displaying target privilege changes and capturing optional audit notes before sending `POST /api/admin/access`.
   - **Strict Backend RBAC Enforcement**: `requirePermission(req, res, requiredPermission)` middleware checks permissions on every admin endpoint, guaranteeing that direct API calls bypassing the UI are rejected with HTTP 403.

4. **System Telemetry & Logs** (`#admin-tab-telemetry` / `#telemetry`)
   - **Real Server-Side Diagnostics**: Powered by `GET /api/admin/health` using Node.js `process.memoryUsage()`, `process.uptime()`, and OS memory diagnostics (`os.freemem()`, `os.totalmem()`).
   - **Zero Secret Exposure**: Returns safe boolean status flags (`geminiStatus`: `"Configured"`, `supabaseStatus`: `"Connected"`, `googleAuthStatus`: `"Configured"`, `billingStatus`: `"Unconfigured"`). Never leaks secret keys or connection strings.
   - **4 Telemetry Diagnostic Cards**: Process Runtime (uptime, Node version, platform/arch, PID, env), Memory Utilization (heap used vs total, percentage bar, RSS, system free memory), Core Integrations (Gemini, Supabase, Google OAuth, Billing), and Diagnostics & Cache (cached estimates count, last sync timestamp, RBAC status).
   - **Live System Event & Audit Logs Feed**: Terminal-styled log stream (`#telemetry-log-terminal`) featuring live keyword search, severity filtering (`All`, `System`, `Feedback`, `Warning`, `Critical`), action type filtering (`All Actions`, `pricing.updated`, `pricing.reset`, `user.role_changed`, `admin.login`, `system.warning`, `system.error`), event counter badge, and one-click log clearing.
   - **Authentic Audit Event Tracking**: Structured audit items capture actor, action, severity, description, entity, and timestamp. Zero fake entries are generated. Displays `"No activity recorded yet."` when empty.
   - **Auto-Refresh Interval Controls**: Selectable auto-polling intervals (`Disabled`, `5 seconds`, `10 seconds`, `30 seconds`) with a visual pulse dot indicator. Respects `prefers-reduced-motion`.

5. **Toast Notification System** (`showToast(message, type, duration)`)
   - **4 Core Notification Types**: `Success` (green), `Error` (red), `Warning` (amber), `Info` (blue).
   - **Event Integrations**: Triggers non-blocking notifications for pricing saved, pricing reset, user role updates, failed API requests, manual refresh actions, clipboard copying, and validation warnings.
   - **Accessibility & UX**: Includes ARIA live regions (`role="status"` / `role="alert"`, `aria-live="polite"`), auto-dismissal timers (4000ms), manual `×` dismiss button, hover-pause, high contrast WCAG ratios, non-blocking floating position (`top: 24px; right: 24px`), and `prefers-reduced-motion` compliance.

6. **Visual Design & SaaS Aesthetics**
   - **Accent Palette**: `#6d7bff` (indigo primary) and `#8a6dff` (violet highlight) used consistently across active navigation tabs, range sliders, focus outlines, and primary action buttons.
   - **Clean Dark Surfaces**: `#0d121f` cards with crisp `1px solid rgba(255, 255, 255, 0.08)` borders. Avoids excessive glass, blur, or decorative neon glows.
   - **Skeleton Loaders**: `.skeleton-box` shimmer loading states for tables and grid cards during data fetching.
   - **Refined Interactivity**: Subtle hover lift (`translateY(-2px)`), high contrast text hierarchy, and accessible focus rings.

7. **Multi-Device Responsive Breakpoints**
   - **Tested Breakpoints**: `320px`, `375px`, `390px`, `430px`, `768px`, `1024px`, and `1440px+`.
   - **Mobile Nav & Toolbar Scaling**: Horizontal touch-scrolling sub-navigation, stacked search/filter toolbars, and full-width touch targets.
   - **Responsive Data Grids & Tables**: Single-column stacking on mobile `<540px`, touch-friendly range sliders, and horizontal scroll wrappers for user access tables.
   - **Viewport-Aware Toasts & Modals**: Fluid toast notification containers (`width: calc(100vw - 24px)`) and responsive modal diff dialogs.

---

## 2. API Architecture & Endpoints

### Existing Reused Endpoints
- `GET /api/pricecheck/admin/summary`: Serves feedback metrics, estimate generation statistics, user counts, and notification drawer history. Protected by `requireAdmin`.
- `DELETE /api/pricecheck/admin/metrics`: Clears pricing feedback metrics. Protected by `requireAdmin`.
- `DELETE /api/pricecheck/admin/notifications`: Clears notification drawer events. Protected by `requireAdmin`.

### New Endpoints Introduced
- `GET /api/admin/pricing`: Retrieves current dynamic category baselines and default configurations.
- `POST /api/admin/pricing`: Validates and saves updated category price baselines with audit logging (`pricing.updated`).
- `POST /api/admin/pricing/reset`: Resets a category back to its hardcoded baseline default with audit logging (`pricing.reset`).
- `GET /api/admin/access`: Lists administrative users and their assigned 4-tier roles.
- `POST /api/admin/access`: Updates role assignment for a target user ID with server-side authorization and audit logging (`user.role_changed`).
- `GET /api/admin/health`: Returns server process health metrics (uptime, memory, service flags) and recent audit events.
- `GET /api/admin/audit-logs`: Retrieves structured audit logs with search, action, and severity query filtering.
- `DELETE /api/admin/audit-logs`: Clears audit event history (with a logged `system.audit_cleared` record).

---

## 3. Security & Integrity

- **Server-Side Enforcement**: All admin routes check `requireAdmin(req, res)` prior to reading or mutating data. Frontend-only checks are strictly avoided.
- **Secret Protection**: Zero API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) or environment secrets are exposed to client JavaScript.
- **Graceful Fallbacks**: When external services (such as Supabase or Gemini) are unconfigured, local memory stores and fallback advice ensure uninterrupted app operation.

---

## 4. Verification & Testing

- **Automated Test Suite**: All **26/26 unit and integration tests** pass clean:
  ```bash
  npm test
  ```
- **Accessibility & UX**: Includes ARIA tablist/tabpanel roles (`role="tablist"`, `aria-selected`, `aria-controls`), keyboard arrow navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`), and URL deep-linking support (`#overview`, `#pricing`, `#rbac`, `#telemetry`).
- **Reduced Motion**: All KPI counter animations respect `@media (prefers-reduced-motion)`.
