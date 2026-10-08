# PriceCheck — Final Visual Priority Matrix (Top 15 Corrections)

> [!IMPORTANT]
> **Audit Status:** Phase 10 Complete (Final Master Deliverable)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.  
> **Ranking Logic:** Ordered strictly by **Visual & Product Impact** (Severity + Usability Friction), NOT by implementation ease.

---

## Master Priority Matrix

| Priority | Screen | Element | Problem | Recommended Change | Expected Impact |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Admin System Telemetry** | `.telemetry-card` & `.telemetry-logs-panel` | Undefined CSS variable `--bg-surface` causes telemetry cards and log panel to render completely transparent, bleeding log text over background lines. | Replace `var(--bg-surface)` with `var(--surface)` in `styles.css` lines 4401 and 4512. | **CRITICAL (P0):** Restores card background surfaces and fixes complete visual breakdown of administrative system logs. |
| **2** | **Landing Page** | `header.public-nav` | Navigation bar lacks `position: sticky`, `backdrop-filter`, and dark background color on scroll. Scrolling down causes hero text to collide into nav text. | Add `position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(16px); background: rgba(10,15,29,0.85); border-bottom: 1px solid var(--border-subtle);`. | **MAJOR (P1):** Guarantees navigation legibility across the entire landing page scroll depth. |
| **3** | **Global App Header** | Main Navigation (`header.nav`) | Lacks mobile hamburger menu drawer. At viewports `<768px`, nav links wrap into a double stacked row, inflating header height to 92px and covering content. | Hide inline desktop links at `<768px`; implement slide-out drawer (`.nav-drawer`) triggered by a 44px x 44px hamburger icon button. | **MAJOR (P1):** Fixes mobile header overflow and provides clean touch navigation for all mobile users. |
| **4** | **History View** | `.history-table` | 6-column data table lacks horizontal overflow container (`overflow-x: auto`), causing 220px horizontal body scrolling on mobile devices (`<600px`). | Wrap table in `.table-responsive` touch container (`-webkit-overflow-scrolling: touch`); transform table rows into mobile cards on screens `<600px`. | **MAJOR (P1):** Eliminates horizontal window scrolling and enables fluid mobile estimate tracking. |
| **5** | **Estimate Workspace** | `.quote-form::before` | Category headers injected via CSS `content: "PROJECT / SERVICE"` pseudo-elements. Completely invisible to screen readers, violating WCAG 1.3.1. | Remove CSS `::before` pseudo-element text and add explicit semantic `<h2>` headings in HTML. | **MAJOR (P1):** Restores screen reader accessibility and structural document hierarchy for pricing forms. |
| **6** | **Admin Access Control** | `#admin-access-denied` Banner | 6 inline hardcoded CSS properties (`style="..."`) bypass the design system. Banner dominates screen visually even when user is authorized. | Remove inline styles; create `.alert-warning` utility class with tokenized background (`var(--warning-bg)`) and border (`var(--warning-border)`). | **MAJOR (P1):** Standardizes warning alert components and aligns admin access control with global design tokens. |
| **7** | **Global Design Tokens** | Accent Color `--brand` (`#00e5ff`) | Accent color applied to 42+ simultaneous elements (buttons, active tabs, radio borders, icons, text gradients, table borders). Dilutes primary action focus. | Restrict `--brand` strictly to primary action triggers, active tabs, and focus rings; use `--surface-strong` for secondary borders. | **MAJOR (P1):** Restores primary visual hierarchy and emphasizes critical action triggers. |
| **8** | **Admin Access Control** | Subtitle Copy (`.panel-subtitle`) | Raw markdown backtick strings rendered literally in HTML: `` Manage roles: `Super Admin`, `Pricing Manager` ``. | Replace backticks with semantic badge elements: `<code class="role-badge">Super Admin</code>`. | **MAJOR (P1):** Eliminates visible code markup artifacts from user-facing admin copy. |
| **9** | **Admin Overview** | `.admin-kpi-badge` Emojis | High-saturation raw system emojis (`⚡`, `👤`, `📊`, `🎯`) draw focus away from KPI values and trend descriptions. | Replace system emojis with subtle monochrome 14px SVG icons. | **MAJOR (P1):** Eliminates visual noise and directs primary focus to metric numbers and percentage trends. |
| **10** | **Global Focus System** | Focus Rings (`:focus-visible`) | Focus indicators missing or faint on radios, icon buttons, and star icons, making keyboard navigation invisible on 40% of controls. | Implement global `:focus-visible` ring (`0 0 0 3px var(--brand-focus-ring)`). | **MAJOR (P1):** Achieves WCAG 2.4.7 AA compliance for keyboard accessibility. |
| **11** | **Admin Pricing Studio** | `.admin-pricing-save-btn` | Button uses `var(--radius-sm)` (9px rectangular) while all global primary buttons use `999px` (pill shape). Direct design system contradiction. | Remove custom radius override and let button inherit global `.btn` pill shape. | **MODERATE (P2):** Enforces brand identity consistency across administrative toolbars. |
| **12** | **Global Text Contrast** | `--text-tertiary` (`#64748b`) | Low contrast ratio (3.8:1 and 2.9:1) fails WCAG AA 4.5:1 minimum on dark navy background. | Elevate `--text-tertiary` token to `#94a3b8` (7.2:1 contrast ratio). | **MODERATE (P2):** Improves text legibility and achieves WCAG 1.4.3 AA compliance. |
| **13** | **Estimate Workspace** | `.selection-grid-deadline` Cards | Forced 5-column grid causes choice 4 ("Same day / Rush") text to wrap across 3–4 lines, making card height 65% taller than adjacent cards. | Apply `align-items: stretch` on grid and `2-column` split on mobile `<600px`. | **MODERATE (P2):** Standardizes card row heights and eliminates jagged grid baselines. |
| **14** | **Estimate Workspace Mobile** | `.estimate-summary-panel` | Sticky summary card wraps below the long pricing form on mobile, forcing 1200px vertical scroll to reach the calculate button. | Pin a fixed bottom action bar (`position: fixed; bottom: 0; left: 0; right: 0`) containing current price and primary calculate button. | **MODERATE (P2):** Dramatically reduces mobile scroll friction and speeds up price calculation workflow. |
| **15** | **Admin Pricing Studio** | `.admin-pricing-grid` Loading State | Plain unstyled text string `"Loading pricing data..."` causes sudden layout reflow when table populates. | Replace text string with 4-row animated skeleton UI table. | **MODERATE (P2):** Smooths visual loading transitions and prevents layout shifts. |

---

## Executive Audit Summary & Complete Master Catalog

All 10 Audit Deliverables are fully recorded and saved in the conversation artifacts directory:

1. **[Phase 1: Global Health Check](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/frontend_ui_audit.md)**
2. **[Phase 2: Screen-by-Screen Table Audit](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/screen_audit.md)**
3. **[Phase 3: Hyper-Specific Location Plan](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/location_specific_audit.md)**
4. **[Phase 4: Visual Balance & Density Audit](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/visual_balance_audit.md)**
5. **[Phase 5: Design System Analysis](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/design_system_analysis.md)**
6. **[Phase 6: Component Consistency Audit](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/component_consistency_audit.md)**
7. **[Phase 7: Admin Dashboard Composition Audit](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/admin_dashboard_composition_audit.md)**
8. **[Phase 8: Mobile & Responsive Breakpoint Audit](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/mobile_responsive_audit.md)**
9. **[Phase 9: Accessibility (a11y) & Usability Check](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/accessibility_usability_audit.md)**
10. **[Phase 10: Final Visual Priority Matrix](file:///C:/Users/Cybrox%20Studio/.gemini/antigravity/brain/19c7bee8-9ce7-43e3-8405-35dfaefeaf21/visual_priority_matrix.md)**

> [!NOTE]
> **Audit Integrity Confirmation:** Throughout this complete 10-phase precision audit, **zero code or configuration files were modified**. All implementation-ready correction specifications are preserved in the markdown artifacts for your engineering team to execute.
