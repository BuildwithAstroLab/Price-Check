# PriceCheck — Admin Dashboard Composition Audit & Architectural Rebalancing

> [!IMPORTANT]
> **Audit Status:** Phase 7 Complete (Product Composition & Visual Hierarchy Audit)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 1. Product Composition & Reading Path Analysis

The Admin Dashboard must guide administrative users through a logical, top-down reading flow:

$$\text{Navigation (Header / Tabs)} \longrightarrow \text{Page Context (Title / Subtitle)} \longrightarrow \text{Global Filters / Controls} \longrightarrow \text{Macro Metrics (KPIs)} \longrightarrow \text{Primary Workspace / Tables} \longrightarrow \text{Secondary Logs / Audit Trail}$$

### Structural Audit Breakdown

```
Current Admin Layout Stack (public/index.html & styles.css)
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. Main App Nav (.nav)                                       │ -> Double Stacked Nav Headers!
 ├─────────────────────────────────────────────────────────────┤
 │ 2. Admin Tab Nav (.admin-tab-nav)                          │
 ├─────────────────────────────────────────────────────────────┤
 │ 3. [Commented Out] Sidebar (.admin-sidebar)                │ -> Dead CSS & markup in codebase!
 ├─────────────────────────────────────────────────────────────┤
 │ 4. Admin Header & Title (.admin-title - 1.5rem)            │ -> Title smaller than KPI values!
 ├─────────────────────────────────────────────────────────────┤
 │ 5. KPI Metrics Grid (.admin-kpi-grid - 4 cards)             │ -> Emojis overpower metric text!
 ├─────────────────────────────────────────────────────────────┤
 │ 6. Main Content Area (Charts / Pricing Studio / RBAC Table) │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Structural Composition Deficiencies

### A. Navigation Architecture (Double Stack Friction)
- **Observation:** `public/index.html` lines 248–268 contains a commented-out vertical sidebar (`<!-- <div class="admin-sidebar">...</div> -->`). Instead, admin navigation relies on a top sub-navigation bar (`.admin-tab-nav`).
- **Deficiency:** Having both the main application header (`.nav`) and the admin tab header (`.admin-tab-nav`) stacked at the top creates 110px of vertical header overhead before the admin page title even begins.
- **Reading Flow Impact:** Fails to anchor page scope; user eyes wander between two competing horizontal navigation bars.

### B. Hierarchy Inversion (Page Title vs KPI Figures)
- **Observation:** The admin section title (`.admin-title`) is styled at `font-size: 1.5rem` (24px), whereas the primary KPI values (`.kpi-value`) below it are styled at `1.75rem` / `2rem` (28px–32px).
- **Deficiency:** The page context title feels secondary to the numeric figures beneath it. The eye jumps straight to the metric cards without first establishing section context ("Overview", "Pricing Studio", or "Access Control").

### C. Visual Noise & Element Competition (Emojis vs Metrics)
- **Observation:** KPI cards use bright raw emojis (`⚡ Volume`, `👤 Active Users`, `📊 Data`, `🎯 Accuracy`) in header badges.
- **Deficiency:** The high-saturation emoji graphics draw eye focus away from the actual numerical values and percentage change indicators.

---

## 3. Specific Composition Directives

### What Should Be Larger
1. **Admin Section Page Title (`.admin-title`):**
   - *Current:* `1.5rem` (24px)
   - *Target:* Increase to `var(--text-2xl)` (32px / `2rem`) with `font-weight: 700`. It must stand unequivocally as the top visual anchor of the workspace.
2. **KPI Primary Metric Numerals (`.kpi-value`):**
   - *Current:* `1.75rem` (28px)
   - *Target:* Increase to `2.25rem` (36px) with `font-weight: 700` to establish clear contrast between metric numbers and secondary labels.

---

### What Should Be Smaller
1. **Admin Tab Navigation Bar (`.admin-tab-nav`):**
   - *Current:* Height `54px` with `padding: 0.75rem 1.25rem`.
   - *Target:* Compact tab bar height to `42px` with `padding: 0.5rem 1rem` and `font-size: var(--text-xs)` (12px uppercase). Reduces header vertical stack clutter.
2. **System Emojis / KPI Badge Icons (`.admin-kpi-badge`):**
   - *Current:* Full-size system font emojis (20px).
   - *Target:* Replace with subtle monochrome SVG icons (`14px x 14px` stroked with `var(--text-tertiary)`).

---

### What Should Move
1. **Time Range & Filter Controls (`.admin-filter-bar`):**
   - *Current:* Filter dropdowns are scattered inside individual panel headers or placed inline next to table search bars.
   - *Target:* Consolidate into a unified **Global Admin Header Control Bar** positioned directly to the right of the Admin Page Title:
     `[Admin Overview Title] ----------- [Time Range: Last 30 Days ▼] [Export CSV]`

2. **Dead Sidebar CSS Cleanup:**
   - *Current:* `.admin-sidebar` CSS rules (~100 lines in `styles.css`) sit dead because the HTML element is commented out.
   - *Target:* Formally depreciate `.admin-sidebar` CSS rules and clean up `.admin-shell` grid columns to use single-column workspace layout.

---

### What Should Be Grouped
1. **KPI Metric Row Cards (`.admin-kpi-grid`):**
   - *Current:* 4 standalone cards with irregular text wrapping on cards 2 and 4.
   - *Target:* Enclose all 4 metrics inside a single unified **KPI Summary Bar** with vertical divider lines (`1px solid var(--border-subtle)`), ensuring locked equal heights (`min-height: 120px`).

2. **Admin Action Toolbar:**
   - *Current:* "Add User", "Export Logs", and "Save Matrix" buttons are placed at different visual alignments in their respective views.
   - *Target:* Group all primary administrative page actions into the top right utility container of the view header.

---

### What Should Be Removed Visually
1. **Raw System Emojis:** Remove all raw system emojis from KPI cards, table headers, and tab labels.
2. **Commented-Out Sidebar Markup:** Remove `<!-- <div class="admin-sidebar">...</div> -->` dead markup from `public/index.html`.
3. **Hardcoded Inline Style Banners (`#admin-access-denied`):** Remove inline `style=""` attributes and replace with standardized CSS alert tokens.

---

### What Should Become More Prominent
1. **Telemetry Error Logs (`.telemetry-logs-panel`):**
   - *Current:* Obscured by an undefined CSS background bug (`var(--bg-surface)` rendering transparent) and low font contrast.
   - *Target:* Give the telemetry log panel a solid surface background (`var(--surface)`), a distinct code header with a live status indicator dot (`● Server Online`), and high-contrast monospaced log text.
2. **Pricing Matrix Category Tabs (`.pricing-category-tabs`):**
   - *Current:* Left tab items blend into background surface.
   - *Target:* Elevate active category tab with a distinct cyan accent indicator bar (`border-left: 3px solid var(--brand)`) for clear workspace orientation.

---

## Target Admin Composition Structure

```
Target Rebalanced Layout Structure
┌─────────────────────────────────────────────────────────────────────────────┐
│ Main App Header (.nav - 56px)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Compact Admin Sub-Nav (.admin-tab-nav - 42px)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Page Title: Admin Overview]                 [Filters: Last 30 Days ▼]      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Unified KPI Summary Bar (4 Equal Columns - Locked Height)                   │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐               │
│ │ Volume: 1,420│ Active: 342  │ Accuracy:98% │ Accept: 74%  │               │
│ └──────────────┴──────────────┴──────────────┴──────────────┘               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Primary Workspace Grid                                                      │
│ ┌──────────────────────────────────────────┬──────────────────────────────┐ │
│ │ Main Chart / Matrix / RBAC Table (2fr)   │ Secondary List / Logs (1fr)  │ │
│ └──────────────────────────────────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Rebalancing the Admin Dashboard according to these 6 composition directives will establish a clear, single-scan reading path, eliminate header visual noise, and resolve structural layout inconsistencies across all administrative sub-panels.
