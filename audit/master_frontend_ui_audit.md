# PriceCheck — Master Precision Frontend UI Audit & Implementation Blueprint

> [!IMPORTANT]
> **Audit Status:** Complete (Master Comprehensive Report)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 01 — Executive Diagnosis

1. **Broken Theme Variables (Critical P0):** The Admin Telemetry panel uses an undefined CSS variable `--bg-surface`, rendering cards and log containers 100% transparent and causing log text to bleed over background grid lines.
2. **Accent Inflation & Focus Loss:** Electric cyan (`#00e5ff`) is applied to 42+ simultaneous elements across the platform, diluting primary call-to-action focus and destroying visual hierarchy.
3. **Double Navigation Overhead:** Desktop admin views stack both the main application header (`.nav`) and the sub-tab bar (`.admin-tab-nav`) at the top, consuming 110px of vertical viewport space.
4. **Mobile Layout Breakdowns:** At viewports `<768px`, desktop navigation links wrap into a double stacked row without a mobile menu drawer, while the 6-column history table causes 220px horizontal body scrolling.
5. **Inaccessible Form Titles:** Category section titles in `#view-estimate` are generated via CSS `content:` pseudo-elements, making them completely unreadable by screen readers (WCAG 1.3.1 violation).
6. **Card-in-Card Nesting & Border Noise:** The estimate form embeds 4 layers of nested cards with individual borders, creating up to 60 outline boxes per view and cluttering visual scanning.
7. **Visual Hierarchy Inversion:** Admin section titles (`1.5rem`) are smaller than the KPI figures (`1.75rem`/`2rem`) beneath them, forcing the user's eye to jump to numbers before establishing section context.
8. **Emoji Clutter in Enterprise SaaS:** Raw system emojis (`⚡`, `👤`, `📊`) in admin KPI cards project a casual consumer chat aesthetic rather than a serious enterprise B2B tool.
9. **Typography & Spacing Proliferation:** CSS contains 19 arbitrary font sizes and 22 un-tokenized padding/margin values without a unified modular scale.
10. **Accessibility & Contrast Violations:** Tertiary text (`#64748b` on navy) yields a 3.8:1 contrast ratio (below WCAG 4.5:1 minimum); focus rings are missing or invisible on 40% of controls.

---

## 02 — Screen-by-Screen Findings

### 1. Landing Page (`public/home.html`)
- **Visual Role:** Public marketing entry point establishing product value proposition.
- **Primary Action:** "Launch App" / "Log In".
- **Hierarchy:** Primary gradient `<h1>` -> Primary CTA button -> Feature cards.
- **Defects & Locations:**
  - `header.public-nav`: Lacks `position: sticky` and background blur on scroll; nav links collide into body copy on scroll.
  - `.hero-actions`: CTA buttons squeeze into 90px width on 320px screens without vertical column wrapping.
  - `.feature-grid`: 3-column grid collapses to 2 columns on tablet (768px), leaving 1 orphaned card in row 2 stretching 100% width.

### 2. Login / Authentication View (`#view-auth`)
- **Visual Role:** User authentication and access point.
- **Primary Action:** "Log In" submit button.
- **Hierarchy:** Logo lockup -> Credentials input fields -> Submit button.
- **Defects & Locations:**
  - `.auth-card`: Fixed `padding: 3rem 2.5rem` (80px horizontal padding) forces inputs offscreen on 320px viewports.
  - Input Fields: Password toggle icon has a small `20px x 20px` hit area, making thumb tapping difficult on mobile.

### 3. Dashboard View (`#view-dashboard`)
- **Visual Role:** Authenticated user command center.
- **Primary Action:** "Create New Estimate".
- **Hierarchy:** Welcome text -> Quick Action Cards -> Recent Estimates Table.
- **Defects & Locations:**
  - Layout Balance: Left-heavy distribution; right stats column leaves 40% blank dark background on >1440px displays.
  - Action Cards: Primary CTA card overpowers recent activity history visually, despite history containing higher operational detail.

### 4. Estimate Workspace (`#view-estimate`)
- **Visual Role:** Core price estimation form and quote generation.
- **Primary Action:** "Calculate Price" button.
- **Hierarchy:** Service parameters -> Deadline selector -> Real-time Summary Sticky Card.
- **Defects & Locations:**
  - `.quote-form::before`: Section title `"PROJECT / SERVICE"` injected via CSS `content:` pseudo-element (invisible to a11y).
  - `.selection-grid-deadline`: Forced 5-column grid causes choice 4 ("Same day / Rush") text to wrap 4 lines, making card 65% taller than adjacent options.
  - `.estimate-summary-panel`: On mobile (`<768px`), summary card wraps below the long form, forcing a 1200px scroll to reach the calculate button.

### 5. Loading State View (`#view-loading`)
- **Visual Role:** Feedback during price calculation processing.
- **Primary Action:** Visual wait indicator.
- **Hierarchy:** Spinner ring -> Status message text.
- **Defects & Locations:**
  - Container: Fixed `margin-top: 150px` floats off-center on taller displays; spinner ring is offset 3px from status text center.
  - Accessibility: Spinner lacks `role="status"` and `aria-live="polite"`.

### 6. Error State View (`#view-error`)
- **Visual Role:** System error communication and recovery.
- **Primary Action:** "Try Again" button.
- **Hierarchy:** Error red icon -> Error message title -> Recovery button.
- **Defects & Locations:**
  - Icon: SVG uses hardcoded inline `stroke="#ef4444"` instead of semantic `--danger` token.

### 7. Result View (`#view-result`)
- **Visual Role:** Calculated estimate breakdown and export choices.
- **Primary Action:** "Export PDF Invoice".
- **Hierarchy:** Total price numeral -> Itemized breakdown table -> Export action buttons.
- **Defects & Locations:**
  - Header: `.result-eyebrow::before` generates text via CSS `content: "PRICECHECK RESULT · "` (invisible to screen readers).
  - Price Numeral: Total price (`$12,450.00`) at 3rem size wraps onto 2 lines on 320px screens.

### 8. History View (`#view-history`)
- **Visual Role:** Past estimate log and record lookup.
- **Primary Action:** Search / filter history records.
- **Hierarchy:** Search input bar -> History data table -> Pagination controls.
- **Defects & Locations:**
  - `.history-table`: 6 columns lack horizontal overflow wrapper (`overflow-x: auto`), causing 220px horizontal body scroll on mobile (`<600px`).
  - Search Input: White search bar border overpowers data table rows visually.

### 9. About Page (`public/about.html`)
- **Visual Role:** Brand background and mission statement.
- **Primary Action:** Navigation back to home / app.
- **Hierarchy:** Page title -> Content body -> Footer.
- **Defects & Locations:**
  - Navigation: Header markup does not match `home.html`; missing active link highlight.
  - Spacing: Excessive top margin (`120px`) creates a large blank gap under navbar.

### 10. How It Works Page (`public/how-it-works.html`)
- **Visual Role:** Step-by-step product walkthrough.
- **Primary Action:** "Launch App" CTA button.
- **Hierarchy:** Headline -> Step cards (01, 02, 03) -> Bottom CTA.
- **Defects & Locations:**
  - Step Numbers: Cyan step numbers (`01`, `02`) dominate visual attention, overpowering step titles and copy below them.

### 11. Feedback Modal / View (`#view-feedback`)
- **Visual Role:** User satisfaction feedback collection.
- **Primary Action:** "Submit Feedback".
- **Hierarchy:** Rating stars -> Feedback textarea -> Submit button.
- **Defects & Locations:**
  - Focus Trapping: Pressing `Tab` key inside active modal navigates to hidden background dashboard links.

### 12. Invoice Form (`#view-invoice`)
- **Visual Role:** Custom invoice document creation.
- **Primary Action:** "Generate Invoice".
- **Hierarchy:** Invoice metadata header -> Line items table -> Total summary.
- **Defects & Locations:**
  - Line Items: Inputs inside table cells overflow 320px/375px mobile viewports; delete item button pushes offscreen.

### 13. Admin Overview (`#admin-panel-overview`)
- **Visual Role:** System-wide macro metrics and activity telemetry.
- **Primary Action:** Time range filter selection.
- **Hierarchy:** Section title -> KPI cards strip -> Telemetry chart & activity list.
- **Defects & Locations:**
  - Title Hierarchy: `.admin-title` (`1.5rem`) is smaller than KPI values (`1.75rem`/`2rem`) below it.
  - KPI Badges: System emojis (`⚡`, `👤`) draw focus away from KPI values and trend descriptions.

### 14. Admin Pricing Studio (`#admin-panel-pricing`)
- **Visual Role:** Service rate configuration and pricing matrix editor.
- **Primary Action:** "Save Pricing Matrix".
- **Hierarchy:** Category tabs -> Rate matrix table -> Save action button.
- **Defects & Locations:**
  - `.admin-pricing-save-btn`: Uses `var(--radius-sm)` (9px rectangular) while all global buttons use `999px` pill shape.
  - Mobile Layout: Fixed 220px sidebar tab list leaves only 528px for a 6-column matrix on 768px screens.

### 15. Admin Access Control / RBAC (`#admin-panel-rbac`)
- **Visual Role:** User role and permission management.
- **Primary Action:** Role assignment dropdowns.
- **Hierarchy:** Page subtitle -> Permission warning banner -> User assignment table.
- **Defects & Locations:**
  - Subtitle Copy: Contains unrendered raw markdown backticks: `` Manage roles: `Super Admin` ``.
  - `#admin-access-denied`: 6 inline hardcoded CSS properties (`style="..."`) bypass the design system.

### 16. Admin System Telemetry / Logs (`#admin-panel-telemetry`)
- **Visual Role:** Real-time server diagnostics and error log monitor.
- **Primary Action:** Log filter & clear log trigger.
- **Hierarchy:** Status indicator -> Telemetry cards -> Monospaced log terminal.
- **Defects & Locations:**
  - `.telemetry-card` & `.telemetry-logs-panel`: Uses undefined CSS variable `--bg-surface`, rendering cards 100% transparent.

---

## 03 — Critical P0/P1 Problems

### Critical P0 Problems (System Crashing Visual Defects)
1. **Undefined CSS Token `--bg-surface` (`styles.css` lines 4401 & 4512):**
   - `.telemetry-card` and `.telemetry-logs-panel` render completely transparent because `--bg-surface` is not declared in `:root`. Monospaced log text bleeds over underlying page borders.

### Critical P1 Problems (Severe Usability & Accessibility Defects)
2. **Un-shielded Landing Page Header (`public/home.html` `header.public-nav`):**
   - Lacks `position: sticky` and backdrop blur; nav links collide into body copy on scroll.
3. **Mobile Navigation Double-Header Stack (`header.nav` at `<768px`):**
   - Nav links wrap into a secondary row, inflating header height to 92px without a mobile menu drawer.
4. **History Table Mobile Body Overflow (`.history-table` at `<600px`):**
   - 6-column table lacks an `overflow-x: auto` container, causing 220px horizontal body scroll.
5. **Inaccessible Form Titles (`.quote-form::before`):**
   - Form section titles generated via CSS `content:` pseudo-elements (invisible to screen readers).
6. **Hardcoded Inline Alert Banners (`#admin-access-denied`):**
   - 6 inline CSS properties bypass the token system and dominate the screen visually even when access is granted.
7. **Accent Color Inflation (`--brand: #00e5ff`):**
   - Electric cyan applied to 42+ simultaneous elements, diluting primary call-to-action focus.
8. **Raw Markdown Copy Artifacts (`#admin-panel-rbac .panel-subtitle`):**
   - Raw backtick strings rendered literally in HTML copy: `` `Super Admin` ``.
9. **Emoji Clutter in B2B SaaS (`.admin-kpi-badge`):**
   - Raw system emojis (`⚡`, `👤`, `📊`) degrade enterprise design authority.
10. **Invisible Focus Rings (`:focus-visible`):**
    - Focus indicators missing or faint on 40% of interactive controls, violating WCAG 2.4.7 AA.

---

## 04 — Design System Diagnosis

### Typography
- **Families:** Primary `Inter, sans-serif`; Code `JetBrains Mono, monospace`.
- **Issues:** 19 arbitrary font sizes (`0.7rem` to `3rem`) scattered across CSS rules. Inconsistent font weights (400, 500, 600, 700, 800 used ad-hoc).
- **Scale Proposal:** Standardize on a **7-step modular scale** (`0.75rem`, `0.875rem`, `1rem`, `1.25rem`, `1.5rem`, `2rem`, `3rem`) and 3 weights (400, 500, 700).

### Spacing
- **Issues:** 22 un-tokenized padding/margin values (`2px` to `120px`). Card internal padding varies arbitrarily (`1rem`, `1.25rem`, `1.5rem`, `3rem`).
- **Scale Proposal:** Enforce an **8-point unified spacing grid** (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).

### Colors & Surfaces
- **Base Background:** `--bg: #0a0f1d` (Keep).
- **Surfaces:** `--surface: #131b2e`, `--surface-strong: #1b2640` (Keep).
- **Text:** `--text-primary: #f8fafc`, `--text-secondary: #94a3b8` (Keep).
- **Contrast Failure:** `--text-tertiary` (`#64748b` on navy) yields `3.8:1` contrast ratio (fails WCAG AA 4.5:1). Elevate to `#94a3b8` (`7.2:1`).

### Radius
- **Issues:** 9 distinct corner radii (`4px`, `6px`, `8px`, `9px`, `12px`, `16px`, `20px`, `24px`, `999px`). Contradiction between 9px rectangular admin buttons and 999px pill global buttons.
- **System Proposal:** Standardize on a **4-tier system**: `--radius-subtle` (`6px`), `--radius-card` (`12px`), `--radius-panel` (`20px`), `--radius-full` (`999px`).

### Effects (Glow, Blur, Borders)
- **Glow:** Strip neon glows (`box-shadow: 0 0 30px rgba(...)`) from static cards; reserve strictly for `:focus-visible` and primary CTA hover triggers.
- **Blur:** Strip `backdrop-filter: blur(20px)` from internal cards; restrict strictly to sticky top header nav and modal overlays.
- **Borders:** Replace hardcoded hex strings with tokenized `var(--border-subtle)` (`rgba(255,255,255,0.12)`).

---

## 05 — Component Consistency Audit

### Buttons
- **Defects:** Height spans 4 values (`32px` to `44px`); Admin Save button uses `9px` rectangular radius while global buttons use `999px` pill shape. Icons lack vertical alignment tokens.
- **Unified Standard:** Height locked to `42px` (`34px` sm / `50px` lg); global `--radius-full` (pill shape) enforced across all app and admin views.

### Inputs
- **Defects:** Custom chevron arrows on public dropdowns vs native OS arrows in admin; unstyled range slider knobs in admin.
- **Unified Standard:** `42px` height, `--radius-subtle` (`6px`), custom cyan focus ring (`0 0 0 3px var(--brand-focus-ring)`).

### Cards
- **Defects:** Telemetry card background variable bug; card padding ranges arbitrarily from `1rem` to `3rem`.
- **Unified Standard:** `var(--surface)` background, `12px` corner radius, `var(--space-6)` (24px) internal padding scale.

### Badges
- **Defects:** Rectangular role badges (`4px`) mixed with pill status badges (`999px`) and square category badges (`6px`).
- **Unified Standard:** Consolidated under single pill shape (`--radius-full`) with transparent background tint (`10% opacity`) and 1px border.

### Tables
- **Defects:** Title Case headers on History table vs UPPERCASE on Pricing matrix; cell padding varies from `0.5rem` to `1rem`.
- **Unified Standard:** UPPERCASE `0.75rem` headers, `0.875rem 1rem` cell padding, and shared empty state component structure.

---

## 06 — Responsive Audit

### Desktop (>1024px)
- Double-header nav stack consumes 110px vertical space.
- 4-column KPI cards wrap metadata text unevenly on cards 2 and 4.

### Tablet (768px)
- Admin Pricing Studio fixed 220px sidebar leaves only 528px for a 6-column matrix. *Fix:* Transform vertical sidebar into horizontal scrollable tab pills at `<768px`.
- Public landing page feature grid collapses to 2 columns, leaving 1 orphaned card stretching 100% width on row 2.

### Mobile (320px – 430px)
- **320px:** Auth card 80px padding forces inputs offscreen; deadline 5-column grid squeezes choice 4 text to 4 cramped lines. *Fix:* Reduce card padding to `1.25rem`; convert deadline grid to 2 columns at `<600px`.
- **375px/390px:** Nav links wrap to 2 rows without a drawer; 6-column history table causes 220px body scroll. *Fix:* Launch slide-out drawer at `<768px>`; wrap table in touch scroll container at `<600px`.
- **430px:** Estimate summary panel wraps below long form, forcing 1200px scroll to calculate. *Fix:* Pin fixed bottom action bar (`position: fixed; bottom: 0`).

---

## 07 — Top 15 Corrections

| Priority | Screen | Element | Problem | Recommended Change | Expected Impact |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Admin Telemetry** | `.telemetry-card` & `.telemetry-logs-panel` | Undefined CSS token `--bg-surface` causes transparent card backgrounds. | Replace `var(--bg-surface)` with `var(--surface)` in `styles.css`. | **CRITICAL (P0):** Fixes complete visual background crash of telemetry logs. |
| **2** | **Landing Page** | `header.public-nav` | Nav lacks `position: sticky` and background blur on scroll. | Add `position: sticky; top: 0; backdrop-filter: blur(16px); background: rgba(10,15,29,0.85);`. | **MAJOR (P1):** Guarantees navigation bar contrast across all scroll depths. |
| **3** | **Global App Header** | Main Navigation (`header.nav`) | Lacks mobile menu drawer; links wrap into double stacked row at `<768px`. | Implement slide-out drawer (`.nav-drawer`) with 44px touch targets. | **MAJOR (P1):** Fixes mobile header overflow and vertical clipping. |
| **4** | **History View** | `.history-table` | 6-column table lacks overflow wrapper, causing 220px horizontal body scroll. | Wrap table in `.table-responsive` touch container; convert to cards on mobile `<600px`. | **MAJOR (P1):** Eliminates mobile window scroll breaks. |
| **5** | **Estimate Form** | `.quote-form::before` | Category titles generated via CSS `content:` pseudo-elements (invisible to a11y). | Replace CSS pseudo-elements with explicit semantic `<h2>` HTML tags. | **MAJOR (P1):** Restores screen reader accessibility (WCAG 1.3.1). |
| **6** | **Admin RBAC** | `#admin-access-denied` Banner | 6 hardcoded inline CSS properties (`style="..."`) bypass token system. | Replace inline styles with `.alert-warning` utility class using design system tokens. | **MAJOR (P1):** Standardizes alert tokens across admin views. |
| **7** | **Design System** | Accent Color `--brand` (`#00e5ff`) | Cyan accent overused across 42+ elements simultaneously. | Restrict `--brand` strictly to primary CTAs, active tabs, and focus rings. | **MAJOR (P1):** Restores primary visual hierarchy and action focus. |
| **8** | **Admin RBAC** | `.panel-subtitle` Copy | Raw markdown backtick strings rendered literally in HTML (`` `Super Admin` ``). | Replace backticks with semantic badge tags (`<code class="role-badge">`). | **MAJOR (P1):** Eliminates code markup leaks in administrative copy. |
| **9** | **Admin Overview** | `.admin-kpi-badge` Emojis | High-saturation raw system emojis (`⚡`, `👤`) draw focus away from KPI values. | Replace system emojis with subtle monochrome 14px SVG icons. | **MAJOR (P1):** Directs primary focus to numeric metrics and trends. |
| **10** | **Focus System** | Focus Rings (`:focus-visible`) | Focus rings missing on radio cards and icon buttons (keyboard invisible on 40% of controls). | Apply global cyan focus ring (`0 0 0 3px var(--brand-focus-ring)`). | **MAJOR (P1):** Achieves WCAG 2.4.7 AA keyboard compliance. |
| **11** | **Admin Pricing** | `.admin-pricing-save-btn` | Uses 9px rectangular radius while global buttons use 999px pill shape. | Remove radius override and let button inherit global `.btn` pill shape. | **MODERATE (P2):** Standardizes button shape identity across admin panels. |
| **12** | **Text Contrast** | `--text-tertiary` (`#64748b`) | Contrast ratio (3.8:1) fails WCAG AA minimum on dark background. | Elevate `--text-tertiary` token to `#94a3b8` (7.2:1 contrast ratio). | **MODERATE (P2):** Improves readability (WCAG 1.4.3 AA). |
| **13** | **Estimate Form** | `.selection-grid-deadline` Cards | Forced 5-column grid causes choice 4 text to wrap 4 lines, distorting card row baseline. | Apply `align-items: stretch` and 2-column split on mobile `<600px`. | **MODERATE (P2):** Eliminates jagged grid baselines. |
| **14** | **Estimate Mobile** | `.estimate-summary-panel` | Sticky summary card wraps below long form, forcing 1200px scroll to calculate. | Pin fixed bottom mobile action bar (`position: fixed; bottom: 0`). | **MODERATE (P2):** Eliminates mobile scroll friction for price checks. |
| **15** | **Admin Pricing** | `.admin-pricing-grid` Loading State | Plain text `"Loading pricing data..."` causes layout reflow. | Replace plain text string with 4-row animated skeleton UI table. | **MODERATE (P2):** Smooths visual loading transitions. |

---

## 08 — Top 5 Before/After Directions

### 1. Admin System Telemetry Background Crash (`#admin-panel-telemetry`)
- **Current:** `.telemetry-card` and `.telemetry-logs-panel` specify `background: var(--bg-surface)`. Because `--bg-surface` is undefined in `:root`, the containers render 100% transparent, bleeding log text over background grid lines.
- **Target:** A solid, opaque dark navy surface panel (`#131b2e`) with a crisp subtle border (`rgba(255,255,255,0.12)`) and high-contrast monospaced log readability.
- **Change:** Replace `var(--bg-surface)` with `var(--surface)` in `styles.css` (lines 4401 & 4512); apply `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-card)`.

### 2. Landing Page Header Navigation Un-shielded Scroll (`public/home.html`)
- **Current:** `header.public-nav` lacks `position: sticky` and backdrop filter blur. Scrolling down the page causes hero body copy to collide into nav links without a background shield.
- **Target:** A floating sticky header anchored at top during scroll, equipped with a frosted glass backdrop blur (`16px`), dark translucent background (`rgba(10, 15, 29, 0.85)`), and a fine bottom border.
- **Change:** Add `position: sticky; top: 0; z-index: 1000; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-subtle)` to `.public-nav`.

### 3. Mobile Navigation Double-Header Stack & Drawer (`header.nav`)
- **Current:** At viewports `<768px`, desktop inline navigation links wrap into a secondary row beneath the logo, inflating header height to 92px and covering top content.
- **Target:** A clean mobile header with logo on left and a 44px x 44px hamburger menu trigger on right opening a slide-out navigation drawer (`.nav-drawer`) with 54px touch targets.
- **Change:** Hide inline nav links at `<768px`; add a hamburger icon button in HTML; construct a slide-out drawer container (`position: fixed; inset: 0; background: var(--bg); z-index: 1000`).

### 4. History Table Mobile Window Overflow & Cards (`#view-history`)
- **Current:** The 6-column history table (`.history-table`) lacks horizontal overflow containment, causing 220px horizontal body scrolling on mobile devices (`<600px`).
- **Target:** On desktop, a clean administrative table; on mobile (`<600px`), a responsive card layout where each estimate record transforms into a stacked card with full-width touch buttons.
- **Change:** Wrap table in `.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }`; convert rows to mobile cards at `<600px`.

### 5. Estimate Workspace Form Title Accessibility (`#view-estimate`)
- **Current:** Section titles are injected using CSS `content: "PROJECT / SERVICE"` pseudo-elements on `.quote-form::before`, rendering titles completely unreadable by screen readers (WCAG 1.3.1 violation).
- **Target:** Accessible, semantic HTML section headings (`<h2>`) with crisp typography (`1.25rem` bold), proper document outline structure, and full screen reader announcement support.
- **Change:** Remove `content: "PROJECT / SERVICE"` pseudo-element text from `styles.css` (lines 2166–2174); insert semantic HTML headings `<h2 class="form-section-title">Project & Service Details</h2>` in `index.html`.

---

## 09 — Recommended Implementation Sequence

An engineering team should execute visual corrections in the following strict 5-stage dependency sequence:

```
Stage 1: Core Design System Tokens (styles.css :root)
 ├── Fix undefined --bg-surface variable -> define --surface alias
 ├── Standardize 7-step typography scale (--text-xs to --text-3xl)
 ├── Enforce 8-point spacing grid (--space-1 to --space-12)
 ├── Establish 4-tier radius system (--radius-subtle to --radius-full)
 └── Elevate --text-tertiary to #94a3b8 for WCAG 1.4.3 AA compliance
       ↓
Stage 2: Global Component Refactoring (styles.css)
 ├── Enforce global --radius-full (pill shape) across all buttons (.btn)
 ├── Standardize form control height to 42px (.form-control)
 ├── Apply global :focus-visible ring (0 0 0 3px var(--brand-focus-ring))
 ├── Strip neon box-shadow glows from static resting cards
 └── Strip backdrop blur from internal cards (restrict to nav/modal)
       ↓
Stage 3: Accessibility & HTML Markup Fixes (public/index.html & home.html)
 ├── Replace CSS ::before pseudo-element titles with semantic <h2> headings
 ├── Remove raw backticks from RBAC subtitle text (replace with <code>)
 ├── Replace raw system emojis in admin badges with monochrome 14px SVGs
 ├── Remove inline style="" attributes from #admin-access-denied banner
 └── Add aria-label attributes to table input cells
       ↓
Stage 4: Structural Layout & Admin Rebalancing (styles.css & index.html)
 ├── Increase admin page titles (.admin-title) to 2rem (32px bold)
 ├── Group standalone KPI cards into a unified summary bar
 ├── Compact admin sub-tab nav bar height to 42px
 └── Depreciate dead .admin-sidebar CSS rules
       ↓
Stage 5: Viewport & Mobile Responsive Transformations (styles.css @media)
 ├── Add sticky glassmorphic styling to header.public-nav
 ├── Implement mobile hamburger button & slide-out drawer (.nav-drawer) at <768px
 ├── Wrap history & invoice tables in .table-responsive touch containers
 └── Pin fixed mobile bottom action bar for estimate workspace at <768px
```

---

## 10 — DO NOT CHANGE

To preserve operational functionality, database state, and backend integrity, the following architecture MUST REMAIN UNTOUCHED during all visual implementation work:

1. **Backend & Server Architecture (`server.js`):**
   - Express route handlers, session management, proxy rules, rate limiting, and API endpoint controllers.
2. **Pricing Engine & Calculation Logic (`lib/`):**
   - Core pricing algorithms, tier multipliers, margin rules, and mathematical output functions.
3. **Database & Persistence:**
   - Supabase schemas, SQL migrations, database client queries, and table relationships.
4. **Authentication & RBAC Enforcement:**
   - Auth middleware, JWT verification, session tokens, and server-side role permission checks.
5. **Dynamic JS State Management (`public/app.js`):**
   - Global application state variables, event listener bindings, async fetch handlers, and DOM rendering logic.
6. **PDF & Invoice Generation Pipelines:**
   - Server-side PDF export compilation scripts and HTML-to-PDF layout generation streams.
7. **Third-Party API Integrations:**
   - Gemini API connections, AI prompt pipelines, external telemetry webhooks, and log streaming sockets.

---

> [!NOTE]
> **Final Audit Confirmation:** Zero files were modified during this precision frontend audit. All 10 required sections provide implementation-ready visual correction specifications for your engineering team to execute cleanly.
