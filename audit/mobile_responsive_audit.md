# PriceCheck — Mobile & Responsive Breakpoint Audit

> [!IMPORTANT]
> **Audit Status:** Phase 8 Complete (Viewport-Specific Responsive Audit)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 1. Viewport Spectrum Overview

This audit evaluates the PriceCheck user interface across 5 standardized mobile and tablet device viewports:

| Viewport Width | Target Class | Devices Represented | Primary Failure Risk |
| :---: | :--- | :--- | :--- |
| **320px** | Ultra-Compact Mobile | iPhone SE (1st gen), Galaxy Z Fold (outer) | Card overflow, text wrapping clipping |
| **375px** | Standard Compact | iPhone SE (2nd/3rd gen), iPhone 12/13 Mini | Header nav overflow, table horizontal scroll |
| **390px** | Standard Mobile | iPhone 12 / 13 / 14 / 15 / 16 | Touch target squishing, inline button wrapping |
| **430px** | Large Mobile | iPhone 14/15/16 Pro Max, Plus series | Excessive vertical scroll depth to reach CTAs |
| **768px** | Tablet Portrait | iPad, Galaxy Tab, Surface in portrait mode | Grid column orphans, split-panel squishing |

---

## 2. Screen-by-Screen Viewport Audit & Specific Transformations

---

### A. Navigation Bar (`header.nav` / `header.public-nav`)

#### Identified Failures across Viewports
- **320px & 375px:** Navigation links (`Dashboard`, `Estimate`, `History`, `Admin`, `Logout`) sit in a horizontal `flex-row` without a mobile hamburger menu drawer or collapsible accordion. Links wrap beneath the logo, forcing the navigation header to double its height (92px) and obscure the top 100px of page content.
- **390px & 430px:** User profile avatar badge and logout button press tightly against the right screen margin (`padding-right: 0.5rem`).
- **768px:** Public nav links sit far right with excessive blank horizontal gap between brand logo and links.

#### Specific Responsive Transformation Directive
1. **At `< 768px`:** Hide desktop inline nav links (`display: none;`).
2. **Add Mobile Hamburger Trigger Button (`.mobile-menu-btn`):** Display a 44px x 44px touch-friendly toggle button at the top right corner.
3. **Implement Full-Screen Slide-Out Drawer (`.nav-drawer`):** When open, slide out a clean vertical drawer containing high-contrast stacked navigation anchors (`font-size: 1.25rem`, height `54px` touch targets).

---

### B. Landing Page (`public/home.html`)

#### Identified Failures across Viewports
- **320px:** `.hero-actions` CTA buttons sit side-by-side with hardcoded horizontal inline padding (`padding: 1rem 2.5rem`). On 320px, the secondary button "How It Works" is squeezed to 90px width, clipping button text to `"How It..."`.
- **375px & 390px:** Hero heading `<h1>` at `3rem` (48px) causes single long words (e.g., "Automated") to break hyphenated across 2 lines.
- **768px:** Feature grid (`.feature-grid`) converts to 2 columns, leaving 1 orphaned 3rd card stretching 100% width across the bottom row.

#### Specific Responsive Transformation Directive
1. **At `< 480px`:** Apply `.hero-actions { flex-direction: column; width: 100%; gap: 0.75rem; }` so primary and secondary buttons take full width (`100%`) with 48px height touch targets.
2. **At `< 480px`:** Scale `h1` using dynamic fluid typography: `font-size: clamp(2rem, 8vw, 3rem); line-height: 1.15;`.
3. **At `768px`:** Force feature grid to 3 columns (`grid-template-columns: repeat(3, 1fr)`) or 1 column on mobile to eliminate orphaned cards.

---

### C. Login / Authentication View (`#view-auth`)

#### Identified Failures across Viewports
- **320px:** `.auth-card` has fixed hardcoded `padding: 3rem 2.5rem;` (80px horizontal padding). On a 320px screen, remaining card content width is only 240px. Input fields overflow card borders, causing horizontal window scroll.
- **375px & 390px:** Password toggle icon inside input field has a small touch hit area (`20px x 20px`), making it difficult to tap reliably with a thumb.

#### Specific Responsive Transformation Directive
1. **At `< 480px`:** Reduce card padding to `.auth-card { padding: 1.5rem 1.25rem; width: 100%; max-width: 100%; border-radius: var(--radius-card); }`.
2. **For Input Field Accessories:** Increase password toggle button touch target to `44px x 44px` overlay wrapper with `display: flex; align-items: center; justify-content: center;`.

---

### D. Estimate Workspace (`#view-estimate`)

#### Identified Failures across Viewports
- **320px:** Radio selection grid `.selection-grid-deadline` forces 5 equal columns (`repeat(5, 1fr)`). On 320px screen, each column is only ~55px wide! Choice card 4 ("Same day / Rush") wraps text onto 4 illegible vertical lines.
- **375px & 390px:** Slider inputs (`input[type="range"]`) have thumb knobs (`16px x 16px`) that are too small for accurate mobile touch dragging.
- **430px:** Right summary panel (`.estimate-summary-panel`) wraps below the main form. Users must scroll 1200px down to hit the primary "Calculate Price" button.

#### Specific Responsive Transformation Directive
1. **At `< 600px`:** Convert `.selection-grid-deadline` from 5 columns to a **2-column grid** for choices 1–4, with choice 5 spanning full width:
   `grid-template-columns: repeat(2, 1fr);`.
2. **Touch Drag Optimization:** Increase slider thumb size to `28px x 28px` on touch viewports (`@media (pointer: coarse)`).
3. **Fixed Bottom Mobile Sticky Action Bar:** On mobile (`< 768px`), pin a sticky bottom bar to the viewport:
   `position: fixed; bottom: 0; left: 0; right: 0; padding: 1rem; background: var(--surface-strong); z-index: 900;` containing current estimated price and "Calculate Price" button.

---

### E. Result View (`#view-result`)

#### Identified Failures across Viewports
- **320px & 375px:** Total price figure display (`$12,450.00`) rendered at `3rem` (48px) font size overflows the right edge of the hero breakdown box.
- **390px & 430px:** Action button group ("Export PDF", "Send Email", "Recalculate") stacks awkwardly with uneven gap heights.

#### Specific Responsive Transformation Directive
1. **At `< 480px`:** Scale result price numeral dynamically: `font-size: clamp(2rem, 10vw, 3rem); text-wrap: nowrap;`.
2. **At `< 600px`:** Stack action buttons in single column: `.result-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }`.

---

### F. History View (`#view-history`)

#### Identified Failures across Viewports
- **320px, 375px & 390px:** `.history-table` contains 6 columns (Client Name, Estimate ID, Date, Service, Amount, Actions). The table lacks an `overflow-x: auto` wrapper, causing the entire webpage body to scroll horizontally by 220px, breaking layout boundaries.

#### Specific Responsive Transformation Directive
1. **At `< 768px`:** Wrap table inside `.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }`.
2. **Mobile Card Transformation (Recommended):** At `< 600px`, convert table rows into individual **Mobile Estimate Cards** (`.history-card-mobile`), displaying Client Name as card header, Amount as bold right text, and Action buttons spanning the card footer.

---

### G. Invoice Form (`#view-invoice`)

#### Identified Failures across Viewports
- **320px & 375px:** Line item table (`.invoice-table`) cell inputs (Description, Qty, Rate, Amount) overflow horizontally. Delete item button (`.btn-delete-item`) gets pushed offscreen.

#### Specific Responsive Transformation Directive
1. **At `< 600px`:** Transform line items from table grid into stacked form cards:
   - Each item gets a distinct card block with full-width Description textarea.
   - Qty and Rate sit side-by-side in a 2-column inline row.
   - Delete item button is positioned cleanly in top-right card corner.

---

### H. Admin Overview & Pricing Studio (`#admin-panel-overview` / `#admin-panel-pricing`)

#### Identified Failures across Viewports
- **320px & 375px:** Admin KPI grid (`.admin-kpi-grid`) wraps 4 cards into 2 columns (145px each). Numerical values (`$84.2K`) clip against card boundaries.
- **768px:** Admin Pricing Studio sidebar tab list (`.pricing-category-tabs`) takes 220px width, leaving only 528px for a 6-column pricing matrix. Matrix cells compress to 80px, causing number inputs to clip.

#### Specific Responsive Transformation Directive
1. **At `< 480px` (KPI Grid):** Stack KPI cards in a single column (`grid-template-columns: 1fr`).
2. **At `< 768px` (Pricing Studio):** Convert vertical sidebar tab list into a **Horizontal Scrollable Pill Bar** (`display: flex; overflow-x: auto; scrollbar-width: none; gap: 0.5rem; padding-bottom: 0.5rem;`).

---

## Summary Matrix of Mobile Responsive Fixes

| Screen / Component | Primary Viewport Defect | Required Responsive Fix Directive |
| :--- | :--- | :--- |
| **Navigation Header** | Links overflow header width on 320px–430px. | Hide desktop links at `<768px`; launch slide-out drawer with 44px touch targets. |
| **Landing Hero** | Text clips at 320px; buttons squeeze. | Apply fluid typography `clamp()`; stack CTA buttons in 1 column at `<480px`. |
| **Auth Card** | 80px horizontal padding breaks 320px screens. | Reduce padding to `1.25rem` at `<480px`; increase password icon target to 44px. |
| **Deadline Grid** | 5 columns squeeze choice 4 text to 4 lines. | Convert to 2-column grid at `<600px`. |
| **Estimate Summary** | Sticky card forces 1200px vertical scroll to CTA. | Pin fixed bottom mobile CTA bar (`position: fixed; bottom: 0`) at `<768px`. |
| **History Table** | 6 columns break viewport width, causing window scroll. | Wrap table in touch scroll container; convert to mobile cards at `<600px`. |
| **Invoice Form** | Line item table inputs push delete button offscreen. | Convert line item rows to stacked input card blocks at `<600px`. |
| **Pricing Studio** | 220px sidebar leaves 528px for 6-column matrix at 768px. | Transform vertical sidebar into horizontal scrollable tab pills at `<768px`. |

> [!NOTE]
> Implementing these explicit viewport transformation directives will achieve full mobile usability across all 5 device tiers without layout clipping or horizontal window scrolling.
