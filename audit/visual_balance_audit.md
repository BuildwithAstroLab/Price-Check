# PriceCheck — Visual Balance, Density & Hierarchy Audit

> [!IMPORTANT]
> **Audit Status:** Phase 4 Complete (Visual Balance & Weight Analysis)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## Executive Overview

This audit evaluates the **visual composition**, **spatial distribution**, **information density**, and **visual weight hierarchy** across all 16 screens of the PriceCheck application. 

### Key Structural Findings Across the Platform
1. **Asymmetric Heavy-Left Tendency:** Most admin and workspace views place high-saturation accents and heavy typography on the left half of the viewport while leaving the right half either empty or filled with low-contrast metadata.
2. **Density Mismatch:** Public marketing pages (`home.html`, `about.html`) skew **Too Sparse** with excessive 120px+ vertical gaps, whereas complex workspace forms (`#view-estimate`, `#admin-panel-pricing`) skew **Too Dense** with tightly packed inputs lacking optical breathing room.
3. **Hierarchy Inversion:** On 7 out of 16 screens, the visually strongest element (e.g., secondary banners, decorative icons, background glow cards) is **not** the most functionally important element (e.g., primary action buttons, price output, validation errors).

---

## Screen-by-Screen Visual Balance & Hierarchy Audit

---

### 1. Landing Page (`public/home.html`)

- **Horizontal Balance:**
  - **Distribution:** Left-heavy hero text block vs right-aligned hero graphic placeholder.
  - **Grid Integrity:** 2-column hero grid collapses cleanly on mobile, but at 1024px desktop breakpoint, right graphic feels floating and unanchored due to lack of card container boundary.
- **Vertical Balance:**
  - **Spacing:** Excessive top margin above hero section (`margin-top: 140px`). Hero section feels disconnected from header navigation.
  - **Section Heights:** Feature section (`.feature-grid`) has unbalanced vertical padding (`8rem top` vs `3rem bottom`).
- **Density Classification:** **Too Sparse**
  - *Reason:* Huge vertical whitespace gaps between hero, feature grid, and footer create fragmented scrolling with low information density.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Large gradient headline text (`<h1>`)
    2. Primary "Launch App" CTA button with glowing box-shadow
    3. Hero illustration background radial glow
  - **Matches Functional Importance?** **Yes.** The primary value proposition and call to action draw immediate focus.

---

### 2. Login / Authentication View (`#view-auth`)

- **Horizontal Balance:**
  - **Distribution:** Perfectly centered card (`.auth-card`), but internal form fields align inputs to left while submit button spans full width.
  - **Grid Integrity:** Single column layout; crisp alignment.
- **Vertical Balance:**
  - **Spacing:** Balanced vertical centering inside viewport (`min-height: 85vh`).
  - **Section Heights:** Good proportions; form controls are evenly spaced (1.25rem gaps).
- **Density Classification:** **Balanced**
  - *Reason:* Card padding (3rem) provides clear boundary without visual overcrowding.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. High-contrast "Log In" primary button (`.btn-primary`)
    2. App logo mark & brand text at card header
    3. Dark card surface border (`1px solid var(--border-subtle)`)
  - **Matches Functional Importance?** **Yes.** User focus flows naturally from logo header -> input fields -> login action button.

---

### 3. Dashboard View (`#view-dashboard`)

- **Horizontal Balance:**
  - **Distribution:** Highly unbalanced. Left side contains large welcome header and primary estimate CTA card; right side has smaller secondary stats cards with empty right-edge whitespace.
  - **Grid Integrity:** 2-column grid (`2fr 1fr`) feels lopsided on ultra-wide screens (>1440px).
- **Vertical Balance:**
  - **Spacing:** Top margin under main navbar is too tight (`1rem`), causing header text to hug the navigation bar.
  - **Section Heights:** Quick actions grid is compressed vertically compared to the broad history summary container below.
- **Density Classification:** **Too Sparse**
  - *Reason:* Broad expanse of dark background with relatively small cards leaves ~40% of screen real estate unutilized.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Glowing "Create New Estimate" action card
    2. User avatar badge icon
    3. Quick stats numeric counters
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* The quick action card is visually dominant, but the user's primary workflow focus on the dashboard should be split between **starting a new estimate** AND **reviewing recent estimate activity**. Recent history table has lower visual weight despite containing higher operational detail.

---

### 4. Estimate Workspace (`#view-estimate`)

- **Horizontal Balance:**
  - **Distribution:** Left-aligned form controls vs right-aligned summary sticky card (`.estimate-summary-panel`). Right sticky card feels visually heavy due to high border-contrast.
  - **Grid Integrity:** Radio selection grids (`.selection-grid-deadline`) use equal 5-column split, forcing text wrapping in column 4 while column 1 remains half-empty.
- **Vertical Balance:**
  - **Spacing:** Extremely tight vertical spacing between form groups (`gap: 0.75rem`), making complex pricing option inputs feel cramped.
  - **Section Heights:** Deadline selector section is compressed relative to slider inputs above it.
- **Density Classification:** **Too Dense**
  - *Reason:* High density of form fields, range sliders, radio cards, and summary figures packed into a single scrolling view without distinct visual break cards.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Estimated Total Price number display in right summary panel
    2. High-saturation active selection radio cards (bright brand cyan border)
    3. "Calculate Price" main action button
  - **Matches Functional Importance?** **Yes.** Price feedback and selection triggers are given proper primary weight.

---

### 5. Loading State View (`#view-loading`)

- **Horizontal Balance:**
  - **Distribution:** Centered single column. Perfectly balanced horizontally.
- **Vertical Balance:**
  - **Spacing:** Excessive top margin (`margin-top: 150px` fixed). Off-center vertically on taller desktop screens, floating too high up.
- **Density Classification:** **Too Sparse**
  - *Reason:* A single spinner ring and text string floating in vast dark space.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Rotating cyan spinner ring (`.spinner-ring`)
    2. Dynamic status message text
    3. Background glow backdrop
  - **Matches Functional Importance?** **Yes.** Focus is entirely focused on the background process indicator.

---

### 6. Error State View (`#view-error`)

- **Horizontal Balance:**
  - **Distribution:** Centered card layout. Excellent horizontal balance.
- **Vertical Balance:**
  - **Spacing:** Good vertical alignment; card sits in optical center of screen.
- **Density Classification:** **Balanced**
  - *Reason:* Appropriate framing for an alert state.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Red error icon wrapper badge
    2. Error headline "Something went wrong"
    3. "Try Again" recovery action button
  - **Matches Functional Importance?** **Yes.** Red icon signals issue immediately; primary button provides immediate recovery path.

---

### 7. Result View (`#view-result`)

- **Horizontal Balance:**
  - **Distribution:** Center-left total price hero box balanced against right-hand breakdown breakdown cards. Good structural balance.
- **Vertical Balance:**
  - **Spacing:** Top margin above result title is compressed (`1.5rem`), causing eyebrow text to press against main header.
  - **Section Heights:** Total price hero box is tall (220px) while breakdown item rows are compressed (32px height each).
- **Density Classification:** **Balanced**
  - *Reason:* Clear visual separation between total summary figure and detailed granular cost rows.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Oversized 3rem total dollar figure (`$X,XXX.XX`)
    2. Primary "Export PDF / Invoice" action button
    3. Result status pill badge ("Final Quote")
  - **Matches Functional Importance?** **Yes.** Price total is unequivocally the top user priority.

---

### 8. History View (`#view-history`)

- **Horizontal Balance:**
  - **Distribution:** Full-width table container (`.history-table`). Left-aligned client names vs right-aligned monetary values and action buttons.
  - **Grid Integrity:** Table columns lack fixed width percentages; "Actions" column stretches dynamically on wide monitors, leaving large empty gaps between date and action buttons.
- **Vertical Balance:**
  - **Spacing:** Excessive bottom spacing inside table card container (`padding-bottom: 4rem`).
- **Density Classification:** **Balanced**
  - *Reason:* Standard administrative table density with clean row borders.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Table search / filter input bar at top right
    2. Action buttons ("View", "Re-calculate") in rightmost table column
    3. Total cost values in table data rows
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* Search/Filter bar has stronger visual weight (bright border and white background) than the actual historical estimate row data. The estimate titles and dates should have elevated contrast to draw primary scanning focus.

---

### 9. About Page (`public/about.html`)

- **Horizontal Balance:**
  - **Distribution:** Centered column (`max-width: 800px`). Balanced horizontal margins.
- **Vertical Balance:**
  - **Spacing:** Excessive top spacing (`margin-top: 120px`). Large blank gap between nav and page title.
- **Density Classification:** **Too Sparse**
  - *Reason:* Short copy block centered in an expansive container with minimal visual graphics or structural dividers.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Main H1 title "About PriceCheck"
    2. Gradient brand tag
    3. Footer link list
  - **Matches Functional Importance?** **Yes.**

---

### 10. How It Works Page (`public/how-it-works.html`)

- **Horizontal Balance:**
  - **Distribution:** 3-column process card layout (`.steps-grid`). Even distribution across desktop viewports.
- **Vertical Balance:**
  - **Spacing:** Good top and bottom section padding (4rem).
- **Density Classification:** **Balanced**
  - *Reason:* 3 distinct step cards provide structured bite-sized information readability.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Oversized step numbers (`01`, `02`, `03`)
    2. Card title headers
    3. Primary CTA button at bottom of page
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* Step numbers (`01`, `02`) dominate visual attention due to high contrast cyan text, overpowering the step title and explanatory description copy beneath them.

---

### 11. Feedback Modal / View (`#view-feedback`)

- **Horizontal Balance:**
  - **Distribution:** Centered modal container (`.feedback-card`). Equal left and right padding.
- **Vertical Balance:**
  - **Spacing:** Perfectly centered vertically in viewport modal backdrop.
- **Density Classification:** **Balanced**
  - *Reason:* Clean single-purpose interactive modal.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Interactive star rating icon row
    2. "Submit Feedback" primary button
    3. Feedback header title
  - **Matches Functional Importance?** **Yes.** Star rating and submit action command primary user focus.

---

### 12. Invoice Form (`#view-invoice`)

- **Horizontal Balance:**
  - **Distribution:** Unbalanced. Invoice header meta (Client Name, Issue Date, Due Date) is stacked on the left, leaving the top-right corner of the invoice preview completely blank.
- **Vertical Balance:**
  - **Spacing:** Line item table has tight vertical row padding (`0.5rem`), making input fields within line items hard to click.
- **Density Classification:** **Too Dense**
  - *Reason:* Multiple input fields, tax calculations, line item controls, and action buttons packed into a single form view without clear visual hierarchy separators.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. "Generate PDF Invoice" primary action button
    2. Grand Total dollar output box at table footer
    3. "Add Line Item" secondary button
  - **Matches Functional Importance?** **Yes.**

---

### 13. Admin Overview (`#admin-panel-overview`)

- **Horizontal Balance:**
  - **Distribution:** 4-column KPI card grid (`.admin-kpi-grid`). Horizontal alignment is even, but cards 2 and 4 wrap metadata text onto 2 lines, visually skewing the row symmetry.
- **Vertical Balance:**
  - **Spacing:** Gap between KPI card grid and system charts section below is compressed (`1rem`), making the two sections bleed together visually.
- **Density Classification:** **Too Dense**
  - *Reason:* High visual noise from multiple KPI badges, emojis, percentage indicators, charts, and secondary lists packed tightly.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. KPI card numerical values (e.g., `1,420`, `$84.2K`)
    2. Emoji icons (`⚡`, `👤`, `📊`, `🎯`) inside KPI badges
    3. Primary chart graphic lines
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* System emojis draw immediate visual attention away from the metric trends and status values. Emojis have higher visual weight than the actual metric titles.

---

### 14. Admin Pricing Studio (`#admin-panel-pricing`)

- **Horizontal Balance:**
  - **Distribution:** Heavy left-hand sidebar tab list (`.pricing-category-tabs`) vs broad right-hand pricing matrix table.
  - **Grid Integrity:** 2-column shell (`220px 1fr`). Sidebar fits well, but table headers on right suffer from text overflow on smaller screens.
- **Vertical Balance:**
  - **Spacing:** Table control bar at top has excessive bottom margin (`2.5rem`), creating an unanchored gap before the data table starts.
- **Density Classification:** **Too Dense**
  - *Reason:* Numerical input boxes inside table cells lack vertical padding (`padding: 0.25rem`), forcing text to hug input borders.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Rectangular "Save Pricing Matrix" button
    2. Active category tab item (bright cyan background)
    3. Base multiplier number inputs
  - **Matches Functional Importance?** **Yes.** Primary focus remains on active editing category and save action.

---

### 15. Admin Access Control / RBAC (`#admin-panel-rbac`)

- **Horizontal Balance:**
  - **Distribution:** Left-aligned role definition list vs right-aligned user assignment table. Right table feels compressed on screens <1200px.
- **Vertical Balance:**
  - **Spacing:** Warning banner (`#admin-access-denied`) has zero top margin, sticking directly to the tab header nav.
- **Density Classification:** **Balanced**
  - *Reason:* Clear separation between role permission definitions and user assignment matrices.
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. Warning banner orange background (`rgba(255, 143, 0, 0.08)`)
    2. "Edit Permissions" action buttons
    3. Role title badges
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* The permission warning banner dominates the screen visually even when access is granted, drawing eyes away from the user permission table below it.

---

### 16. Admin System Telemetry / Logs (`#admin-panel-telemetry`)

- **Horizontal Balance:**
  - **Distribution:** Unbalanced due to missing background token (`--bg-surface`). Telemetry cards float transparently on the left, while log panel stretches full width below.
- **Vertical Balance:**
  - **Spacing:** Log text inside `.telemetry-logs-panel` touches the bottom edge of the container (`padding-bottom: 0px`).
- **Density Classification:** **Too Dense**
  - *Reason:* Monospaced terminal log output is crammed into a fixed-height scrollbox without line height buffers (`line-height: 1.1`).
- **Visual Weight Analysis:**
  - **Top 3 Visually Strongest Elements:**
    1. High-contrast white log timestamps
    2. Green "ONLINE" server status badge
    3. "Clear Logs" secondary action button
  - **Matches Functional Importance?** **No.**
    - *Correction Required:* Log timestamps have higher optical brightness than error log messages (`[ERROR]` tags), making scanning for system errors difficult.

---

## Summary Classification Matrix

| Density Classification | Screen Count | Screens |
| :--- | :---: | :--- |
| **Too Sparse** | 4 | Landing Page, Dashboard, Loading State, About Page |
| **Balanced** | 7 | Login, Error State, Result View, History View, How It Works, Feedback Modal, RBAC |
| **Too Dense** | 5 | Estimate Workspace, Invoice Form, Admin Overview, Admin Pricing Studio, Admin Telemetry |

---

## Hierarchy Inversion Summary (Action Required)

On **7 screens**, visual weight does not align with functional importance:
1. **Dashboard:** Action card overpowers estimate history summary.
2. **History View:** Search bar border overpowers data table rows.
3. **How It Works:** Decorative step numbers overpower instructional titles.
4. **Admin Overview:** System emojis overpower metric trend numbers.
5. **Admin RBAC:** Static warning banner overpowers permission table.
6. **Admin Telemetry:** Log timestamps overpower error message tags.
7. **Estimate Workspace:** Deadline choice cards wrap inconsistently, distorting row baselines.

> [!TIP]
> Resolving these 7 hierarchy inversions will directly improve user task completion speed and eliminate visual confusion across both public and administrative application paths.
