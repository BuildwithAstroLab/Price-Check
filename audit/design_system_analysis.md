# PriceCheck — Design System Analysis & Rationalization Plan

> [!IMPORTANT]
> **Audit Status:** Phase 5 Complete (Design System Tokens & Effects Audit)  
> **Rule Enforcement:** Zero code or style files modified. Pure read-only architectural and visual inspection.

---

## 1. Typography Audit & Unified Scale

### Current Typography State
- **Font Families:**
  - Primary UI Font: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Code / Telemetry Font: `JetBrains Mono, "Fira Code", monospace`
- **Current Font Size Proliferation (19 Arbitrary Sizes Discovered in `styles.css`):**
  `0.7rem`, `0.75rem`, `0.8rem`, `0.8125rem`, `0.85rem`, `0.875rem`, `0.9rem`, `0.95rem`, `1rem`, `1.05rem`, `1.1rem`, `1.15rem`, `1.25rem`, `1.35rem`, `1.5rem`, `1.75rem`, `2rem`, `2.25rem`, `3rem`.
- **Heading Hierarchy Flaws:**
  - `h1` on landing page is `3rem` (48px) with `line-height: 1.1`, while `h1` in dashboard views is `2rem` (32px) with `line-height: 1.3`.
  - `.result-title` uses `1.75rem` but has identical `font-weight: 700` as section subheadings (`1.25rem`), flattening visual distinction.
- **Weight Inconsistencies:**
  - 5 different font weights used ad-hoc: `400` (normal), `500` (medium), `600` (semibold), `700` (bold), `800` (extrabold).
  - Admin table headers use weight `600` at `0.875rem`, while public table headers use weight `500` at `0.9rem`.
- **Line-Height & Wrapping Problems:**
  - `.kpi-card-value` uses `line-height: 1` which clips descenders on fonts with tall accents.
  - Multi-word options in `.selection-grid-deadline` wrap awkwardly into 3 lines without text-wrap balancing (`text-wrap: balance` missing).

### Proposed Streamlined Typography Scale (7 Sizes Only)

```css
:root {
  /* Font Family Tokens */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* Strict 7-Step Type Scale (Major Third - 1.25 Ratio) */
  --text-xs:   0.75rem;   /* 12px - Badges, micro-copy, timestamps */
  --text-sm:   0.875rem;  /* 14px - Table data, secondary labels, helper text */
  --text-base: 1rem;      /* 16px - Default body copy, inputs, button text */
  --text-lg:   1.25rem;   /* 20px - Card titles, section headers */
  --text-xl:   1.5rem;    /* 24px - View headers, modal titles */
  --text-2xl:  2rem;      /* 32px - Metric heroes, primary page titles */
  --text-3xl:  3rem;      /* 48px - Marketing hero headlines */

  /* Weight System (Strict 3 Weights) */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line Heights */
  --leading-tight:  1.15;
  --leading-snug:   1.3;
  --leading-normal: 1.5;
}
```

---

## 2. Spacing Audit & Unified Scale

### Current Spacing Inconsistencies
- **Discovered Padding & Margin Values in `styles.css`:**
  `2px`, `3px`, `4px`, `6px`, `8px`, `10px`, `12px`, `14px`, `15px`, `16px`, `18px`, `20px`, `24px`, `28px`, `30px`, `32px`, `36px`, `40px`, `48px`, `60px`, `80px`, `120px`.
- **Key Issues:**
  - Card internal padding is `1.5rem` on `.action-card`, `2rem` on `.auth-card`, `1rem` on `.telemetry-card`, and `1.25rem` on `.kpi-card`.
  - Grid gaps range from `0.5rem` to `2.5rem` without spatial logic.

### Proposed 8-Point Unified Spacing Scale

```css
:root {
  --space-1: 0.25rem; /* 4px   - Tight micro-gaps (badge icons, tags) */
  --space-2: 0.5rem;  /* 8px   - Form field internal elements, inline gaps */
  --space-3: 0.75rem; /* 12px  - Input padding, button inline gaps */
  --space-4: 1rem;    /* 16px  - Standard card padding (compact) */
  --space-6: 1.5rem;  /* 24px  - Standard section gap, regular card padding */
  --space-8: 2rem;    /* 32px  - Major card padding, modal internal gap */
  --space-12: 3rem;   /* 48px  - View container padding, section dividers */
  --space-16: 4rem;   /* 64px  - Public page section breaks */
}
```

---

## 3. Corner Radius System Audit

### Current Radius Inconsistencies
- Discovered values: `4px` (tags), `6px` (badges), `8px` (inputs), `9px` (`var(--radius-sm)`), `12px` (`var(--radius-md)`), `16px` (`var(--radius-lg)`), `20px` (modal cards), `24px` (hero panels), `999px` (pill buttons).
- **Direct Contradiction:** `.admin-pricing-save-btn` uses `var(--radius-sm)` (9px rectangular), while `.btn-primary` uses `999px` (pill shape).

### Proposed 4-Tier Radius System

```css
:root {
  --radius-subtle: 6px;   /* Inputs, checkboxes, code badges */
  --radius-card:   12px;  /* Cards, modals, containers, dropdowns */
  --radius-panel:  20px;  /* Hero cards, major feature sections */
  --radius-full:   999px; /* All buttons, status pills, avatars */
}
```

---

## 4. Color Palette Audit & Accent Overuse

### Existing Token Inventory

| Role | Variable / Current Hex | Audit Evaluation |
| :--- | :--- | :--- |
| **Primary Background** | `--bg: #0a0f1d` | Excellent deep space contrast ratio. Keep. |
| **Secondary Surface** | `--surface: #131b2e` | Good base card surface. Keep. |
| **Elevated Surface** | `--surface-strong: #1b2640` | Good elevated state background. Keep. |
| **Borders** | `--border-subtle: rgba(255, 255, 255, 0.08)` | Very subtle; needs increase to `0.12` for readability. |
| **Primary Text** | `--text-primary: #f8fafc` | Pure white crisp readable text. Keep. |
| **Secondary Text** | `--text-secondary: #94a3b8` | Good contrast ratio on dark surface (7.2:1). Keep. |
| **Accent (Brand)** | `--brand: #00e5ff` | High-saturation electric cyan. **Overused.** |
| **Success** | `--success: #10b981` | Crisp green. Keep. |
| **Warning** | `--warning: #f59e0b` | Amber yellow. Keep. |
| **Error / Danger** | `--danger: #ef4444` | Red. Keep. |

### Accent Color Overuse Analysis (`--brand: #00e5ff`)
The electric cyan accent color is currently applied to **over 42 simultaneous elements**, including:
- Primary buttons, active nav tabs, selection radio borders, headline text gradients, card hover borders, table hover rows, step numbers, spinner rings, status badges, focus outlines, and footer links.

**Visual Consequence:** Because cyan is everywhere, nothing stands out. Primary action buttons lose their interactive priority signal.

**Correction Strategy:**
- Reserve `--brand` (`#00e5ff`) strictly for **Primary Action Triggers** (Main CTA buttons, active state indicators, and focus rings).
- Shift secondary borders and step numbers to `--surface-strong` or `--text-secondary`.

---

## 5. Visual Effects Audit (Glow, Blur, Shadows, Gradients)

| Effect Category | Current Implementation | Audit Classification | Rationalization Rationale |
| :--- | :--- | :--- | :--- |
| **Backdrop Blur** | `backdrop-filter: blur(12px)` to `blur(20px)` on 14 elements | **Reduce** | Limit to top navigation bar (`.nav`) and modal overlays (`.modal-backdrop`). Remove from standard cards to prevent GPU rasterization drag. |
| **Neon Glow** | `box-shadow: 0 0 30px rgba(0, 229, 255, 0.3)` on static cards | **Reserve for Interaction** | Remove glow from static resting cards. Apply glow *only* on `:hover`, `:focus-visible`, or active processing states. |
| **Box Shadows** | Heavy multi-layered shadows on dark backgrounds | **Reduce** | Dark themes rely on subtle border contrast (`border: 1px solid var(--border-subtle)`), not dark shadows. Streamline to subtle elevation shadow. |
| **Text Gradients** | `background: linear-gradient(135deg, #00e5ff, #3b82f6)` on headlines & badges | **Reduce** | Limit text gradient strictly to the primary landing page hero `<h1>` and brand logo mark. Use solid `--text-primary` elsewhere. |
| **Transparency** | Heavy use of `rgba(255,255,255,0.03)` across 30+ selectors | **Keep & Standardize** | Keep opacity tokens standardized (`--alpha-subtle: 0.04`, `--alpha-medium: 0.08`, `--alpha-strong: 0.16`). |
| **Card Borders** | Mix of `1px solid rgba(255,255,255,0.08)` and hardcoded `1px solid #334155` | **Standardize** | Replace all hardcoded hex borders with tokenized `var(--border-subtle)` or `var(--border-strong)`. |

---

## Summary of Proposed Token System Updates

```css
/* Recommended Standardized Token File (styles.css :root refactor) */
:root {
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 3rem;

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Radius Scale */
  --radius-subtle: 6px;
  --radius-card: 12px;
  --radius-panel: 20px;
  --radius-full: 999px;

  /* Color Palette */
  --bg: #0a0f1d;
  --surface: #131b2e;
  --surface-strong: #1b2640;
  --surface-muted: #0f172a;
  
  --border-subtle: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(0, 229, 255, 0.35);

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;

  --brand: #00e5ff;
  --brand-hover: #00b8cc;
  --brand-focus-ring: rgba(0, 229, 255, 0.3);

  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;

  /* Interactivity Effects */
  --glow-interactive: 0 0 20px rgba(0, 229, 255, 0.35);
  --blur-nav: blur(16px);
}
```

> [!NOTE]
> Adopting this standardized 7-step type scale, 8-point spacing system, 4-tier radius system, and strict color/effects discipline will eliminate all 63 UI defects catalogued in Phase 2 and 3.
