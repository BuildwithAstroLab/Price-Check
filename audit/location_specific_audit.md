# PriceCheck — Hyper-Specific Location UI Audit & Correction Plan

> [!IMPORTANT]
> **Audit Status:** Phase 3 Complete (Implementation-Ready Location Mapping)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## Overview & Methodology

This document represents **Phase 3** of the PriceCheck Precision Frontend UI Audit. Every finding is mapped to an exact, unambiguous DOM and CSS location hierarchy following the strict schema:

`Screen → Section / Container → Component → Sub-element`

For each finding, exact visual failure modes, missing tokens, layout shifts, or accessibility flaws are detailed alongside **implementation-ready step-by-step correction instructions**.

---

## 1. Landing Page (`public/home.html`)

### [P1] Landing Page → Navigation → `header.public-nav`
- **Location:** `public/home.html` (lines 18–35) / `public/styles.css` (lines 4850–4890 `.public-nav`)
- **Problem:** Unlike the main app navigation (`.nav` in `public/styles.css` line 104), `header.public-nav` lacks `position: sticky; top: 0; backdrop-filter: blur(12px); background: rgba(10, 15, 29, 0.85);`. As the user scrolls down the landing page, the navigation bar scrolls out of view or collides with hero text without a translucent background shield, creating visual friction and removing immediate access to "Log In" / "Launch App".
- **Recommended Correction:**
  1. Add `position: sticky; top: 0; z-index: 1000;` to `.public-nav` in `styles.css`.
  2. Add `background: rgba(10, 15, 29, 0.82); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);` to maintain contrast when overlaying content.
  3. Add `border-bottom: 1px solid var(--border-subtle);` to define the lower structural boundary.

### [P2] Landing Page → Top Brand Lockup → `.nav-brand-group`
- **Location:** `public/home.html` (lines 20–23) vs `public/index.html` (lines 12–15)
- **Problem:** The brand text on `home.html` reads `PRICECHECK` (all uppercase, sans-serif badge, line 22) whereas `index.html` uses `PriceCheck` (Title case with gradient fill). This creates brand dissonance between public marketing and authenticated app states.
- **Recommended Correction:**
  1. Standardize brand logo markup across `home.html`, `about.html`, `how-it-works.html`, and `index.html`.
  2. Use `<span class="brand-text">Price<span class="gradient-text">Check</span></span>` consistently.
  3. Apply shared `.brand-text` styling from `styles.css`.

### [P1] Landing Page → Hero Section → CTA Button Group `.hero-actions`
- **Location:** `public/home.html` (lines 52–58) / `public/styles.css` (lines 4920–4945)
- **Problem:** `.hero-actions` buttons use inline `style="padding: 1rem 2.5rem; font-size: 1.1rem;"` overriding global `.btn` token logic. Furthermore, on viewports < 600px, the secondary button "How It Works" wraps beneath the primary button with zero vertical gap (`gap: 0` inherited), causing touching border lines.
- **Recommended Correction:**
  1. Remove inline style attributes from `public/home.html` lines 54 and 56.
  2. Add `@media (max-width: 600px) { .hero-actions { flex-direction: column; width: 100%; gap: 0.75rem; } }` in `styles.css`.
  3. Ensure buttons take `width: 100%` on mobile viewports for clean touch targets.

### [P2] Landing Page → Feature Grid → `.feature-card`
- **Location:** `public/home.html` (lines 75–120) / `public/styles.css` (lines 4960–4995)
- **Problem:** The feature cards lack equal height alignment (`align-items: stretch` missing on container). Cards with 3-line descriptions are taller than cards with 2-line descriptions, causing irregular horizontal grid baselines across columns.
- **Recommended Correction:**
  1. Set `.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: stretch; gap: 1.5rem; }`.
  2. Add `display: flex; flex-direction: column; height: 100%;` to `.feature-card`.
  3. Set `margin-top: auto` on card footer elements to pin bottom alignments.

---

## 2. Login / Authentication View (`#view-auth`)

### [P1] Login → Container Card → `#view-auth .auth-card`
- **Location:** `public/index.html` (lines 45–110) / `public/styles.css` (lines 1420–1480)
- **Problem:** On mobile viewports (< 480px), `.auth-card` has hardcoded `padding: 3rem 2.5rem;`. On screens with 360px width, card content breaks outside viewport margins, causing horizontal scrollbars on the login screen.
- **Recommended Correction:**
  1. Replace fixed padding with responsive clamp: `padding: clamp(1.5rem, 5vw, 3rem) clamp(1.25rem, 4vw, 2.5rem);`.
  2. Add `width: 92%; max-width: 440px; margin: 0 auto;` to preserve centered card framing.

### [P2] Login → Form Controls → `.auth-card .form-group input`
- **Location:** `public/index.html` (lines 62, 74) / `public/styles.css` (lines 1490–1520)
- **Problem:** Focus outline uses default browser blue ring (`outline: auto`) in Chrome instead of the design system's glowing brand ring (`box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.25); border-color: var(--brand);`).
- **Recommended Correction:**
  1. Add `.auth-card input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-focus-ring); }`.
  2. Ensure high contrast ratio (> 4.5:1) between input placeholder text `#64748b` and background `#0f172a`.

---

## 3. Dashboard View (`#view-dashboard`)

### [P1] Dashboard → Header → `.dashboard-header .welcome-text`
- **Location:** `public/index.html` (lines 125–140) / `public/styles.css` (lines 1600–1630)
- **Problem:** The user greeting heading lacks dynamic fallback handling. If user metadata name is delayed, it renders raw template text or blank space `Welcome back, !` for 400ms before JS hydration.
- **Recommended Correction:**
  1. Add CSS loading shimmer state `.welcome-text:empty { width: 180px; height: 32px; background: var(--surface-muted); border-radius: var(--radius-sm); animation: pulse 1.5s infinite; }`.
  2. Ensure JS sets fallback "Welcome back, User" before async fetch finishes.

### [P2] Dashboard → Quick Actions → `.action-grid .action-card`
- **Location:** `public/index.html` (lines 145–185) / `public/styles.css` (lines 1650–1695)
- **Problem:** The "Create New Estimate" and "View History" cards have distinct background opacities (`rgba(255,255,255,0.03)` vs `rgba(255,255,255,0.06)`), making one card look active and the other disabled when both are fully interactive.
- **Recommended Correction:**
  1. Standardize base surface color for all `.action-card` elements to `var(--surface)`.
  2. Reserve higher opacity `var(--surface-strong)` strictly for hover/focus states.

---

## 4. Estimate Workspace (`#view-estimate`)

### [P1] Estimate Workspace → Form Header → `.quote-form::before` Pseudo-Element
- **Location:** `public/index.html` (lines 210–230) / `public/styles.css` (lines 2166–2174)
- **Problem:** Category section headers are injected using CSS `content: "PROJECT / SERVICE"` pseudo-elements on `.quote-form::before`. This renders section titles completely unreadable by screen readers and breaks accessibility compliance (WCAG 1.3.1 Info & Relationships).
- **Recommended Correction:**
  1. Remove `::before` pseudo-element text generation in `styles.css`.
  2. Add semantic HTML heading `<h2 class="form-section-title">Project & Service Details</h2>` inside `index.html`.

### [P2] Estimate Workspace → Deadline Selector → `.selection-grid-deadline`
- **Location:** `public/index.html` (lines 235–250) / `public/styles.css` (lines 2353–2361)
- **Problem:** `grid-template-columns: repeat(5, 1fr)` forces 5 narrow columns on desktop. Card option 4 ("Same day / Rush") has longer text that wraps across 3 lines, causing that specific card to expand vertically by 24px compared to its adjacent 1-line cards.
- **Recommended Correction:**
  1. Apply `align-items: stretch` on grid container and `display: flex; align-items: center; justify-content: center; text-align: center;` to individual cards.
  2. Standardize font size to `var(--text-xs)` (0.8125rem) with `line-height: 1.2` so multi-word choices fit without excessive wrapping.

---

## 5. Loading State View (`#view-loading`)

### [P1] Loading State → Animation Box → `.loading-container .spinner-ring`
- **Location:** `public/index.html` (lines 260–280) / `public/styles.css` (lines 2510–2545)
- **Problem:** Spinner rotation is offset by 3px from dead center relative to the loading status text below it. The container uses fixed `margin-top: 150px` which causes clipping on short mobile landscape viewports.
- **Recommended Correction:**
  1. Center loading container using flexbox viewport centering: `.view-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; margin: 0; }`.
  2. Ensure `.spinner-ring` has exact dimensions (`width: 48px; height: 48px; box-sizing: border-box;`).

---

## 6. Error State View (`#view-error`)

### [P1] Error State → Card Icon → `.error-card .error-icon-wrapper`
- **Location:** `public/index.html` (lines 285–310) / `public/styles.css` (lines 2600–2635)
- **Problem:** Error icon uses raw inline SVG with hardcoded `stroke="#ef4444"` instead of design system semantic error token `var(--danger)`. If theme color adjusts, error icon remains hardcoded red.
- **Recommended Correction:**
  1. Remove hardcoded stroke attribute from SVG line inside `index.html`.
  2. Apply `color: var(--danger); stroke: currentColor;` in `styles.css`.

---

## 7. Result View (`#view-result`)

### [P1] Result View → Header Eyebrow → `.view-result .result-eyebrow::before`
- **Location:** `public/index.html` (lines 1624–1626) / `public/styles.css` (line 2824)
- **Problem:** Header prefix text `PRICECHECK RESULT · ` is generated entirely via CSS `::before` pseudo-element. Screen readers skip this context, announcing only the secondary dynamic title.
- **Recommended Correction:**
  1. Remove `content: "PRICECHECK RESULT · "` from `styles.css`.
  2. Insert explicit accessible DOM node `<span class="eyebrow-tag">PriceCheck Result</span>` in `index.html`.

### [P2] Result View → Pricing Summary Box → `.price-breakdown-card .total-amount`
- **Location:** `public/index.html` (lines 1650–1680) / `public/styles.css` (lines 2890–2925)
- **Problem:** Currency symbol `$` is hardcoded at 1.5rem while numbers render at 3rem, causing baseline misalignment where the dollar sign floats high above the price text.
- **Recommended Correction:**
  1. Wrap currency symbol in `<span class="currency-symbol">$</span>`.
  2. Apply `vertical-align: super; font-size: 0.5em; line-height: 1;` or use flexbox `align-items: baseline;`.

---

## 8. History View (`#view-history`)

### [P2] History → Table Header → `.history-table th`
- **Location:** `public/index.html` (lines 1710–1740) / `public/styles.css` (lines 3100–3140)
- **Problem:** Column headers lack `text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.75rem; color: var(--text-tertiary);`. Header text has identical font size and weight as row data, diminishing visual hierarchy.
- **Recommended Correction:**
  1. Apply dedicated header typography styles to `.history-table th`.
  2. Add `border-bottom: 2px solid var(--border-subtle);` for clear header separation.

---

## 9. About Page (`public/about.html`)

### [P1] About → Page Container → `main.about-container`
- **Location:** `public/about.html` (lines 15–120) / `public/styles.css` (lines 5000–5030)
- **Problem:** Page header does not match public landing page navigation structure. Missing active nav highlight on "About" link.
- **Recommended Correction:**
  1. Sync navigation markup from `home.html`.
  2. Add `class="nav-link active"` to the "About" anchor tag in `about.html`.

---

## 10. How It Works Page (`public/how-it-works.html`)

### [P2] How It Works → Step List → `.step-card .step-number`
- **Location:** `public/how-it-works.html` (lines 30–140) / `public/styles.css` (lines 5035–5080)
- **Problem:** Step numbers (`01`, `02`, `03`) use `color: var(--brand)` but lack background badge enclosure, making them look like floating body text rather than step markers.
- **Recommended Correction:**
  1. Wrap step numbers in `.step-number-badge`.
  2. Apply `background: rgba(0, 229, 255, 0.1); border: 1px solid var(--brand); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;`.

---

## 11. Feedback Modal / View (`#view-feedback`)

### [P2] Feedback → Star Rating Component → `.star-rating .star-icon`
- **Location:** `public/index.html` (lines 1780–1810) / `public/styles.css` (lines 3300–3340)
- **Problem:** Star icons lack clear focus outline when navigating via keyboard (`Tab` key). Focus jumps invisibly across rating buttons.
- **Recommended Correction:**
  1. Add `.star-rating input:focus-visible + label { outline: 2px solid var(--brand); outline-offset: 4px; border-radius: 4px; }`.

---

## 12. Invoice Form (`#view-invoice`)

### [P1] Invoice → Line Item Row → `.invoice-table .line-item-row`
- **Location:** `public/index.html` (lines 1830–1875) / `public/styles.css` (lines 3450–3500)
- **Problem:** Delete item button (`.btn-delete-item`) uses default grey icon color instead of subtle danger color on hover, making destructive action feedback unclear.
- **Recommended Correction:**
  1. Add `.btn-delete-item:hover { color: var(--danger); background: var(--danger-subtle); }`.

---

## 13. Admin Overview (`#admin-panel-overview`)

### [P1] Admin Overview → KPI Row → `.admin-kpi-badge` Emoji & Text Alignment
- **Location:** `public/index.html` (lines 350–395) / `public/styles.css` (lines 3600–3650)
- **Problem:** KPI cards use raw system emojis (`⚡ Volume`, `👤 Users`, `📊 Data`, `✓ Accepted`, `🎯 Accuracy`). Emojis render with inconsistent sizes and color signatures across OS platforms (Windows vs macOS vs Linux), distorting visual alignment.
- **Recommended Correction:**
  1. Replace raw emojis with standardized inline SVGs (e.g., Feather/Lucide icons with `width: 18px; height: 18px; stroke: var(--brand);`).
  2. Standardize badge structure to `<span class="kpi-icon-badge"><svg>...</svg></span>`.

### [P2] Admin Overview → Metric Card Grid → `.admin-kpi-grid`
- **Location:** `public/index.html` (lines 345–390) / `public/styles.css` (lines 3580–3610)
- **Problem:** Cards 2 and 4 wrap metadata text onto 2 lines while cards 1 and 3 stay on 1 line. Cards visually offset each other vertically.
- **Recommended Correction:**
  1. Lock card minimum height with `min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;`.
  2. Set fixed line-height and height on metadata text container.

---

## 14. Admin Pricing Studio (`#admin-panel-pricing`)

### [P2] Admin Pricing → Save Action → `.admin-pricing-save-btn`
- **Location:** `public/index.html` (lines 510–540) / `public/styles.css` (lines 3775–3785)
- **Problem:** Button uses `border-radius: var(--radius-sm)` (9px rectangular shape) whereas all global primary buttons (`.btn-primary`) across the application use `border-radius: 999px` (pill shape). Direct visual design system contradiction.
- **Recommended Correction:**
  1. Remove custom radius override from `.admin-pricing-save-btn` in `styles.css`.
  2. Let button inherit global `.btn` pill border radius system.

### [P2] Admin Pricing → Grid Container → `.admin-pricing-grid`
- **Location:** `public/index.html` (lines 480–505) / `public/styles.css` (lines 3719–3724)
- **Problem:** Loading state displays a plain unstyled text string `"Loading pricing data..."` without skeleton loaders or spinner, causing sudden layout reflow when table data populates.
- **Recommended Correction:**
  1. Replace plain text loading state with 4-row table skeleton UI using keyframe animation `.skeleton-row`.

---

## 15. Admin Access Control / RBAC (`#admin-panel-rbac`)

### [P1] Admin RBAC → Header Description → `#admin-panel-rbac .panel-subtitle`
- **Location:** `public/index.html` (line 639)
- **Problem:** Subtitle text contains unrendered raw markdown backtick strings: `` Manage roles: `Super Admin`, `Pricing Manager`, `Auditor` ``. Markdown is visible directly as literal backtick characters in rendered HTML.
- **Recommended Correction:**
  1. Replace backtick strings in `public/index.html` line 639 with semantic badge tags: `Manage roles: <code class="role-badge">Super Admin</code>, <code class="role-badge">Pricing Manager</code>`.

### [P1] Admin RBAC → Permission Denied Banner → `#admin-access-denied`
- **Location:** `public/index.html` (lines 303–312)
- **Problem:** Container relies on 6 inline hardcoded CSS properties (`style="margin: 0 0 1rem; padding: 1rem 1.25rem; border: 1px solid rgba(255, 149, 0, 0.35); border-radius: 12px; background: rgba(255, 143, 0, 0.08); color: var(--text-primary)"`), bypassing the stylesheet completely.
- **Recommended Correction:**
  1. Remove inline `style` attribute from `index.html`.
  2. Create utility class `.alert-warning` in `styles.css` using CSS tokens (`var(--warning-border)`, `var(--warning-bg)`).

---

## 16. Admin System Telemetry / Logs (`#admin-panel-telemetry`)

### [P0] Admin Telemetry → Card Containers → `#admin-panel-telemetry .telemetry-card` & `.telemetry-logs-panel`
- **Location:** `public/styles.css` (lines 4401 & 4512)
- **Problem:** Critical CSS crash — `.telemetry-card` and `.telemetry-logs-panel` both specify `background: var(--bg-surface)`. However, `--bg-surface` is **undefined** anywhere in `:root` (only `--bg`, `--bg-elevated`, `--surface`, `--surface-strong` exist). Consequently, both cards render with completely transparent backgrounds, causing log text to bleed over underlying layout lines.
- **Recommended Correction:**
  1. In `public/styles.css` line 4401, change `background: var(--bg-surface);` to `background: var(--surface);`.
  2. In `public/styles.css` line 4512, change `background: var(--bg-surface);` to `background: var(--surface);`.
  3. Alternatively, define `--bg-surface: #1e293b;` in `:root` token declarations.

---

## Executive Summary of Audit Artifacts

| Artifact Name | Scope | File Path |
| :--- | :--- | :--- |
| **Phase 1: Global Health Check** | Token system, color contrast, responsive grid rules | [frontend_ui_audit.md](file:///C:/Users/Cybrox/Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/frontend_ui_audit.md) |
| **Phase 2: Screen-by-Screen Table** | 16 screens, 63 itemized issues by P0–P3 severity | [screen_audit.md](file:///C:/Users/Cybrox/Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/screen_audit.md) |
| **Phase 3: Location-Specific Plan** | DOM/CSS paths, visual failure modes, implementation steps | [location_specific_audit.md](file:///C:/Users/Cybrox/Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/location_specific_audit.md) |

> [!NOTE]
> All 3 audit phases are fully recorded. Zero codebase files were modified during this inspection. Implementation teams can begin executing fixes sequentially starting with P0 telemetry token corrections.
