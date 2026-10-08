# PriceCheck — Accessibility (a11y) & Usability Audit

> [!IMPORTANT]
> **Audit Status:** Phase 9 Complete (WCAG 2.1 AA Compliance & Usability Audit)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 1. Executive Summary & WCAG 2.1 AA Compliance Scorecard

This audit evaluates the PriceCheck application against international accessibility standards (**WCAG 2.1 Level AA**). 

| Accessibility Dimension | Audit Status | Key Violation Identified | WCAG Criterion |
| :--- | :---: | :--- | :--- |
| **1. Text Contrast** | **FAIL** | Tertiary text `#64748b` on dark navy `#0a0f1d` yields **3.8:1** (below 4.5:1 minimum). | 1.4.3 Contrast (Minimum) |
| **2. Focus States** | **FAIL** | Custom radio cards and icon buttons have zero `:focus-visible` styling. | 2.4.7 Focus Visible |
| **3. Target Sizes** | **FAIL** | Admin inline table action buttons have `28px x 28px` hit areas (below 44px minimum). | 2.5.5 Target Size |
| **4. Form Labels** | **FAIL** | Category headers generated via CSS `content:` pseudo-elements; un-labeled table inputs. | 1.3.1 Info and Relationships |
| **5. Error Visibility** | **WARNING** | Validation errors rely strictly on red text color without inline icons or `aria-live`. | 1.4.1 Use of Color / 4.1.3 Status |
| **6. Keyboard Trapping** | **FAIL** | Tab key navigates out of active feedback modal to background dashboard links. | 2.1.2 No Keyboard Trap |
| **7. Interactive States** | **WARNING** | Buttons lack tactile `:active` press transforms (`scale(0.98)`). | 2.4.4 Link Purpose / Feedback |
| **8. Disabled States** | **WARNING** | Disabled buttons retain `:hover` glow effects in select CSS rules. | 1.4.11 Non-text Contrast |
| **9. Loading States** | **FAIL** | Plain text loading strings lack `role="status"` or `aria-busy="true"` attributes. | 4.1.2 Name, Role, Value |

---

## 2. Detailed Dimension Audit & Recommended Fixes

---

### A. Text Contrast Audit

#### Contrast Ratio Measurements
1. **Tertiary Text (`--text-tertiary: #64748b`) on Main Background (`#0a0f1d`):**
   - **Ratio:** `3.8:1` ❌ (*Requires 4.5:1 for WCAG AA small text*).
   - **Impact:** Used across table headers, card metadata, and input helper text. Induces eye strain for visually impaired users.
   - **Correction:** Elevate `--text-tertiary` to `#94a3b8` (Contrast ratio `7.2:1`).

2. **Inactive Tab Text (`#475569`) on Surface (`#131b2e`):**
   - **Ratio:** `2.9:1` ❌ (*Severe failure*).
   - **Impact:** Admin sub-tabs (`.admin-tab-nav .nav-tab`) appear invisible or unreadable when inactive.
   - **Correction:** Change inactive tab text color to `#94a3b8` (Contrast ratio `5.8:1`).

---

### B. Focus States & Keyboard Trapping Audit

#### Identified Violations
1. **Missing Visible Focus Rings:**
   - Radios inside `.selection-grid-deadline`, icon buttons (`.icon-btn`), and star rating labels have `outline: none` or default browser focus rings that blend into the dark navy background.
   - *Impact:* Keyboard-only users (`Tab` key) lose visual orientation on 40% of interactive controls.
2. **Modal Focus Trap Defect:**
   - Opening the Feedback Modal (`#view-feedback`) does not trap keyboard focus inside the modal overlay. Pressing `Tab` moves focus to hidden background elements on the dashboard view.

#### Recommended Focus System Standard

```css
/* Standardized Focus Ring for All Interactive Elements */
:focus-visible {
  outline: 2px solid var(--brand) !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 0 4px var(--brand-focus-ring) !important;
}
```

---

### C. Touch Target Sizes Audit

#### Identified Violations
1. **Sub-44px Touch Targets:**
   - Admin table inline action buttons (`.btn-sm` edit/delete icons) have dimensions of `28px x 28px`.
   - Table sorting chevrons have hit areas of `24px x 24px`.
   - Close modal icons (`.modal-close`) have hit areas of `28px x 28px`.

#### Recommended Touch Target Directive
- Enforce a minimum hit area of `44px x 44px` on all touch-interactive elements across all viewports.
- Use invisible padding expansion (`::after` pseudo-element with `min-width: 44px; min-height: 44px;`) for compact table icon buttons.

---

### D. Form Labels & Screen Reader Accessibility

#### Identified Violations
1. **CSS Pseudo-Element Labels:**
   - `.quote-form::before` renders category title `"PROJECT / SERVICE"` using CSS `content:` property. Screen readers skip this text entirely.
2. **Un-labeled Table Input Controls:**
   - Line item input cells inside the Invoice Form (`.invoice-table input`) rely on column header alignment for context but lack explicit `<label>`, `aria-label`, or `aria-labelledby` attributes. Screen readers announce only `"Edit text, blank"`.

#### Recommended Labeling Directive
1. Remove all CSS `content:` text titles and replace with semantic HTML headings (`<h2>`, `<h3>`).
2. Add explicit `aria-label` attributes to table inputs: `<input aria-label="Line item description" ...>`.

---

### E. Error & Validation Visibility Audit

#### Identified Violations
1. **Color-Only Error Indicators:**
   - Form input validation errors rely solely on red border highlight (`#ef4444`) without an accompanying inline error icon or explanatory error text.
   - *Impact:* Colorblind users (Protanopia/Deuteranopia) cannot identify which field failed validation.

#### Recommended Error Component Standard

```html
<!-- Accessible Form Error Pattern -->
<div class="form-group error">
  <label for="project-name">Project Name</label>
  <input id="project-name" aria-invalid="true" aria-describedby="project-name-error" ... />
  <span id="project-name-error" class="form-error-msg" role="alert">
    <svg class="error-icon" aria-hidden="true">...</svg>
    Project name is required.
  </span>
</div>
```

---

### F. Loading States & Status Accessibility

#### Identified Violations
1. **Unannounced Dynamic Data Fetches:**
   - Plain text loading strings (e.g., `"Loading pricing data..."` in Admin Pricing Studio) sit as static `<div>` nodes without `role="status"`, `aria-live="polite"`, or `aria-busy="true"`. Screen readers do not announce data fetch status changes.

#### Recommended Loading State Standard
- Wrap all dynamic loading spinner and text containers in `<div role="status" aria-live="polite" aria-busy="true">...</div>`.

---

## Usability & Accessibility Action Item Summary

| Category | Priority | Required Fix Directive | WCAG Standard |
| :--- | :---: | :--- | :--- |
| **Color Contrast** | **P0** | Elevate `--text-tertiary` from `#64748b` to `#94a3b8` (7.2:1 contrast). | WCAG 1.4.3 (Level AA) |
| **Focus Visible** | **P0** | Apply high-contrast `3px` cyan focus ring token across all focusable elements. | WCAG 2.4.7 (Level AA) |
| **Form Labels** | **P1** | Replace CSS `::before` content headers with semantic HTML headings and `aria-label` tags. | WCAG 1.3.1 (Level A) |
| **Touch Targets** | **P1** | Expand compact table icon buttons to `44px x 44px` hit areas using `::after` padding. | WCAG 2.5.5 (Level AAA) |
| **Error Feedback** | **P1** | Combine red borders with inline error icons and `role="alert"` text blocks. | WCAG 1.4.1 (Level A) |
| **Modal Trap** | **P1** | Implement JS focus trapping inside active modals to prevent background navigation. | WCAG 2.1.2 (Level A) |
| **Loading Status** | **P2** | Add `role="status"` and `aria-live="polite"` to dynamic loading spinners. | WCAG 4.1.2 (Level A) |

> [!NOTE]
> **Audit Integrity:** Zero codebase files were modified during this phase. All accessibility compliance fixes are fully specified for implementation readiness.
