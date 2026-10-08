# PriceCheck — Component Consistency Audit & Standardized Patterns

> [!IMPORTANT]
> **Audit Status:** Phase 6 Complete (Component Cross-Comparison & Pattern Unification)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 1. Buttons Audit & Unified Pattern

### Cross-View Comparison Matrix

| Button Type | Height | Padding | Border Radius | Typography | Icon Alignment | Hover Effect |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary (`.btn-primary`)** | `44px` | `0.75rem 1.5rem` | `999px` (Pill) | `0.95rem / 600` | `gap: 0.5rem` | Cyan glow + translateY(-1px) |
| **Admin Save (`.admin-pricing-save-btn`)** | `36px` | `0.5rem 1.0rem` | `9px` (Rectangular) | `0.85rem / 500` | None | Background brightness shift |
| **Secondary (`.btn-secondary`)** | `44px` | `0.75rem 1.5rem` | `999px` (Pill) | `0.95rem / 500` | `gap: 0.5rem` | Surface background shift |
| **Ghost (`.btn-ghost`)** | `36px` | `0.5rem 1.0rem` | `6px` (Subtle) | `0.875rem / 500` | None | Background opacity fill |
| **Destructive (`.btn-danger`)** | `38px` | `0.5rem 1.0rem` | Inline 8px / 999px | `0.875rem / 600` | `gap: 0.35rem` | Red fill (`var(--danger)`) |
| **Icon Button (`.icon-btn`)** | 32px–40px | `0.5rem` square | Circle / 8px | N/A | Centered SVG | Border color highlight |

### Inconsistencies Identified
1. **Radius Contradiction:** `.admin-pricing-save-btn` uses `9px` rectangular radius while all other main buttons use `999px` pill radius.
2. **Height Variance:** Button height spans 4 arbitrary heights (`32px`, `36px`, `38px`, `44px`).
3. **Icon Alignment:** Inline SVGs in buttons lack standard `vertical-align: middle` or explicit flex alignment, causing icons to sit 1.5px above text baseline.

### Recommended Unified Button Pattern

```css
/* Unified Button Standard */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 42px; /* Standard medium height */
  padding: 0 1.5rem;
  border-radius: var(--radius-full); /* 999px Pill */
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: 1;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

/* Button Sizing Scale */
.btn-sm { height: 34px; padding: 0 1rem; font-size: var(--text-xs); }
.btn-md { height: 42px; padding: 0 1.5rem; font-size: var(--text-sm); }
.btn-lg { height: 50px; padding: 0 2rem; font-size: var(--text-base); }

/* Variants */
.btn-primary   { background: var(--brand); color: #0a0f1d; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: var(--glow-interactive); }

.btn-secondary { background: var(--surface-strong); border-color: var(--border-subtle); color: var(--text-primary); }
.btn-ghost     { background: transparent; color: var(--text-secondary); border-radius: var(--radius-subtle); }
.btn-danger    { background: rgba(239, 68, 68, 0.15); color: var(--danger); border-color: rgba(239, 68, 68, 0.3); }
```

---

## 2. Inputs Audit & Unified Pattern

### Cross-View Comparison Matrix

| Input Element | Height | Padding | Border & Radius | Focus Ring | Text Alignment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text Input (`.form-control`)** | `44px` | `0.75rem 1rem` | `1px solid var(--border-subtle)` / `8px` | Default browser ring | Left |
| **Select Dropdown (`select`)** | `44px` | `0.75rem 1rem` | `1px solid var(--border-subtle)` / `8px` | Custom cyan ring | Left (Custom arrow) |
| **Search Input (`.search-input`)** | `40px` | `0.5rem 1rem 0.5rem 2.5rem` | Pill shape (`999px`) | Glowing cyan ring | Left (Icon inset) |
| **Range Slider (`input[type="range"]`)** | `6px track` | `0` | Custom cyan thumb in estimate; unstyled in admin | Focus outline | Horizontal track |
| **Textarea (`textarea`)** | `100px+` | `0.75rem` | `1px solid var(--border-subtle)` / `8px` | Mixed | Top Left |

### Inconsistencies Identified
1. **Select Arrow Rendering:** Public forms use custom SVG dropdown chevron arrows embedded as background-images, while admin forms fall back to standard OS native dropdown chevrons.
2. **Slider Styling Disparity:** Estimate form sliders feature custom cyan glowing thumbs (`::-webkit-slider-thumb`), whereas Admin Pricing Studio range controls use default unstyled browser grey knobs.

### Recommended Unified Input Pattern

```css
/* Standardized Input Control Pattern */
.form-control, .form-select {
  width: 100%;
  height: 42px;
  padding: 0 1rem;
  background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-subtle); /* 6px */
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus, .form-select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-focus-ring);
}
```

---

## 3. Cards Audit & Unified Pattern

### Cross-View Comparison Matrix

| Card Variant | Internal Padding | Radius | Background Surface | Border Styling | Title Typography |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth Card (`.auth-card`)** | `3rem 2.5rem` | `20px` | `var(--surface)` | `1px solid var(--border-subtle)` | `1.5rem / 700` |
| **Action Card (`.action-card`)** | `1.5rem` | `16px` | `rgba(255,255,255,0.03)` | `1px solid var(--border-subtle)` | `1.25rem / 600` |
| **KPI Card (`.kpi-card`)** | `1.25rem` | `12px` | `var(--surface)` | `1px solid var(--border-subtle)` | `0.875rem / 500` |
| **Telemetry Card (`.telemetry-card`)** | `1rem` | `12px` | `var(--bg-surface)` *(BUG)* | `1px solid var(--border-subtle)` | `1rem / 600` |

### Inconsistencies Identified
1. **Undefined Background Bug:** `.telemetry-card` references `--bg-surface` which does not exist in CSS variable declarations, causing it to render transparent.
2. **Padding Hierarchy Disconnect:** Card internal padding varies arbitrarily across 4 values (`1rem`, `1.25rem`, `1.5rem`, `3rem`).

### Recommended Unified Card Pattern

```css
/* Standard Card System */
.card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card); /* 12px */
  padding: var(--space-6); /* 24px */
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.card-interactive:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
```

---

## 4. Badges Audit & Unified Pattern

### Cross-View Comparison Matrix

| Badge Type | Padding | Border Radius | Typography | Background Fill | Border |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Role Badge (`.role-badge`)** | `0.25rem 0.6rem` | `4px` | `0.75rem / 500` | `rgba(0,229,255,0.1)` | None |
| **Status Badge (`.badge-success`)** | `0.2rem 0.5rem` | `999px` | `0.7rem / 700 / Upper` | `rgba(16,185,129,0.15)` | `1px solid rgba(16,185,129,0.3)` |
| **Category Badge (`.category-badge`)** | `0.3rem 0.75rem` | `6px` | `0.8125rem / 500` | `var(--surface-strong)` | `1px solid var(--border-subtle)` |
| **Notification Badge (`.badge-count`)** | `20px x 20px` | `50%` | `0.7rem / 700` | `var(--brand)` | None |

### Inconsistencies Identified
1. **Radius Mismatch:** Role badges use `4px` rectangular corners, category badges use `6px`, while status badges use `999px` pills.
2. **Text Transformation:** Status badges enforce uppercase transform, whereas role and category badges use standard sentence case.

### Recommended Unified Badge Pattern

```css
/* Standard Badge System */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full); /* 999px Pill */
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
  border: 1px solid transparent;
}

.badge-brand   { background: rgba(0, 229, 255, 0.1); color: var(--brand); border-color: rgba(0, 229, 255, 0.25); }
.badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border-color: rgba(16, 185, 129, 0.25); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); border-color: rgba(245, 158, 11, 0.25); }
.badge-danger  { background: rgba(239, 68, 68, 0.1); color: var(--danger); border-color: rgba(239, 68, 68, 0.25); }
```

---

## 5. Tables Audit & Unified Pattern

### Cross-View Comparison Matrix

| Table Component | Header (`th`) Styling | Row Height | Cell Padding | Action Alignment | Empty State Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **History Table (`.history-table`)** | `1rem padding / 600 / Mixed case` | `54px` | `0.85rem 1rem` | Right-aligned buttons | Vector illustration + CTA |
| **Pricing Table (`.admin-pricing-table`)** | `0.75rem padding / 700 / Upper` | `42px` | `0.5rem 0.75rem` | Inline input fields | Plain text loading message |
| **RBAC Table (`.rbac-table`)** | `0.85rem padding / 600 / Upper` | `48px` | `0.75rem 1rem` | Inline dropdowns | Unstyled plain text `<tr>` |

### Inconsistencies Identified
1. **Header Text Case:** History table headers use Title Case (`Date Created`), while Pricing and RBAC tables use UPPERCASE (`DATE CREATED`).
2. **Row Height Variance:** Row heights range from `42px` (compressed matrix) to `54px` (history rows).
3. **Empty State Disparity:** History view features a rich empty state illustration with a recovery CTA button, whereas admin tables fall back to unstyled raw text rows (`<tr><td colspan="4">No data available</td></tr>`).

### Recommended Unified Table Pattern

```css
/* Standard Table System */
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.table th {
  padding: 0.875rem 1rem;
  background: var(--surface-muted);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  color: var(--text-primary);
  vertical-align: middle;
}

.table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}
```

---

## Component Unification Roadmap Summary

| Component Area | Key Refactoring Directive | Primary Impact |
| :--- | :--- | :--- |
| **Buttons** | Enforce global `--radius-full` (pill shape) on all primary/secondary buttons; eliminate rectangular admin save button. | Restores visual brand identity across admin/app boundaries. |
| **Inputs** | Standardize input height to `42px`, apply `--radius-subtle` (`6px`), and unify focus ring color token. | Creates consistent form entry experience. |
| **Cards** | Fix `--bg-surface` undefined bug on telemetry cards; lock card padding scale (`var(--space-6)`). | Eliminates visual layout crashes and fixes card transparency errors. |
| **Badges** | Unify all status, role, and category badges under pill shape (`--radius-full`). | Standardizes micro-data presentation. |
| **Tables** | Apply uppercase `0.75rem` headers, standard `0.875rem 1rem` cell padding, and shared empty state components. | Enhances table scanning speed and administrative usability. |

> [!NOTE]
> **Audit Integrity:** Zero codebase files were modified during this phase. All component unification schemas are documented above for implementation readiness.
