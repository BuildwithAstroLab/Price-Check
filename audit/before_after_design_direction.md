# PriceCheck — Before & After Design Direction (Top 5 Corrections)

> [!IMPORTANT]
> **Audit Status:** Phase 11 Complete (Design Transformation Blueprint)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## Top 5 Design Transformations

---

### 1. Admin System Telemetry Card & Log Panel Background Fix

#### Current
Admin Telemetry cards (`.telemetry-card`) and log panel (`.telemetry-logs-panel`) specify `background: var(--bg-surface)`. Because `--bg-surface` is **undefined** in CSS variable declarations, both containers render 100% transparent. Monospaced log lines and metric text bleed directly over underlying page borders, creating a visually broken, unreadable layout.

#### Target
A solid, opaque dark navy surface container (`var(--surface)` / `#131b2e`) featuring a crisp subtle border (`rgba(255,255,255,0.12)`), `12px` corner radius, distinct terminal header bar (`● Server Online`), and high-contrast monospaced log text readability.

#### Change
Replace `background: var(--bg-surface)` with `background: var(--surface)` in `public/styles.css` (lines 4401 and 4512). Apply `border: 1px solid var(--border-subtle); border-radius: var(--radius-card); padding: var(--space-6);` to establish clear optical containment.

---

### 2. Landing Page Header Navigation Un-shielded Scroll Overlap

#### Current
The public landing page navigation header (`header.public-nav` on `public/home.html`) lacks `position: sticky`, `backdrop-filter`, and a background shield. As the user scrolls down the landing page, the header scrolls out of view or collides directly into body text without a translucent background shield, causing visual confusion and removing immediate access to "Log In".

#### Target
A floating sticky header anchored at the top of the viewport during scroll, equipped with a frosted glass backdrop blur (`16px`), dark translucent background (`rgba(10, 15, 29, 0.85)`), and a fine bottom border separating nav links from scrolling page content.

#### Change
Apply `position: sticky; top: 0; z-index: 1000; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-subtle);` to `.public-nav` in `public/styles.css`.

---

### 3. Mobile Navigation Double-Header Stack & Drawer Transformation

#### Current
On mobile viewports (`<768px`), desktop inline navigation links (`Dashboard`, `Estimate`, `History`, `Admin`, `Logout`) wrap into a secondary row beneath the brand logo. This inflates header height to 92px, covers the top 100px of page content, and lacks a mobile hamburger menu drawer.

#### Target
A clean mobile header with brand logo on the left and a touch-friendly 44px x 44px hamburger menu icon on the right. Tapping the icon opens a full-height slide-out navigation drawer (`.nav-drawer`) featuring high-contrast vertical navigation links with 54px touch targets.

#### Change
Hide inline desktop navigation links on mobile via `@media (max-width: 767px) { .nav-links { display: none; } }`. Add a `<button class="mobile-menu-btn" aria-label="Toggle Navigation">` hamburger trigger in HTML. Construct a slide-out drawer container styled with `position: fixed; inset: 0; background: var(--bg); z-index: 1000; padding: 2rem;`.

---

### 4. History Table Mobile Window Overflow & Responsive Card Transformation

#### Current
The 6-column history table (`.history-table`) lacks horizontal overflow containment. On mobile devices (`<600px`), table cells push total table width to 580px, causing the entire webpage body to scroll horizontally by 220px and breaking edge padding margins.

#### Target
On desktop, a clean administrative data table; on mobile (`<600px`), a responsive card layout where each estimate history record transforms into an individual stacked card with client name as header, price amount highlighted on the right, and full-width touch action buttons in the card footer.

#### Change
Wrap table element in a `.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }` container. At `@media (max-width: 600px)`, convert table row markup to `.history-card-mobile` stacked flex card containers.

---

### 5. Estimate Workspace Form Title Accessibility & Hierarchy Restoration

#### Current
Section titles inside the pricing estimate form are injected using CSS `content: "PROJECT / SERVICE"` pseudo-elements on `.quote-form::before`. This renders section titles completely unreadable by screen readers (WCAG 1.3.1 violation) and prevents custom typography scaling.

#### Target
Accessible, semantic HTML section headings (`<h2>`) with crisp typography (`1.25rem` bold), proper document outline structure, and full screen reader announcement support.

#### Change
Remove `content: "PROJECT / SERVICE"` pseudo-element text generation from `public/styles.css` (lines 2166–2174). Insert semantic HTML headings `<h2 class="form-section-title">Project & Service Details</h2>` inside `public/index.html`, and apply standard `.form-section-title` CSS styles.

---

## Visual Summary of Top 5 Transformations

| # | Feature Area | Current Visual Failure | Target Design Outcome | Primary Modification |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Admin Telemetry** | Transparent background crash due to undefined CSS token `--bg-surface`. | Solid dark navy card surface (`#131b2e`) with subtle border. | Replace `--bg-surface` with `var(--surface)` token in `styles.css`. |
| **2** | **Landing Nav** | Nav bar scrolls away / text collides with body copy on scroll. | Sticky frosted glass header bar (`backdrop-filter: blur(16px)`). | Add `position: sticky; top: 0; backdrop-filter: blur(16px)` to `.public-nav`. |
| **3** | **Mobile Nav** | Links wrap to 2 rows, inflating header to 92px height. | Sleek slide-out mobile navigation drawer with 44px targets. | Hide desktop links at `<768px`; add slide-out `.nav-drawer`. |
| **4** | **History Table** | 6 columns break viewport, causing 220px horizontal body scroll. | Mobile estimate cards with full-width touch buttons at `<600px`. | Wrap table in touch scroll container; transform rows to cards at `<600px`. |
| **5** | **Form Titles** | Titles injected via CSS `content:` pseudo-elements (invisible to a11y). | Semantic HTML `<h2>` headings with full screen reader support. | Remove CSS `::before` text; add explicit `<h2>` tags in `index.html`. |

> [!NOTE]
> **Audit Integrity:** Zero codebase files were modified during this phase. All Before/After design specifications are documented for immediate implementation readiness.
