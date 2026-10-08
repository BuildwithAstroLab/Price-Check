# PriceCheck — Screen-by-Screen UI Audit
**Methodology:** Read-only. Source-verified + live-rendered inspection. Zero files modified.

---

## Severity Legend
| Code | Name | Meaning |
| :--- | :--- | :--- |
| **P0** | Critical | Visually broken, confusing, unusable, or seriously damaging to hierarchy |
| **P1** | Major | Clearly weakens usability, hierarchy, professionalism, or consistency |
| **P2** | Moderate | Noticeable inconsistency or polish issue |
| **P3** | Minor | Small refinement that can wait |

---

## Screen 01 — Public Landing Page (`/home.html`)

**Current Visual Role:** Top-of-funnel marketing page. First impression for anonymous visitors arriving directly at `/`.

**What this screen is supposed to accomplish:** Communicate what PriceCheck does, build trust through clarity, and convert visitors into registered users via the primary CTA.

**Primary user action:** Click "Create a Price Check" to begin the estimation flow.

**Current Hierarchy:**
- **Primary:** Hero heading `Know what to charge. Before you send the quote.` + primary CTA button
- **Secondary:** Product preview card (right column) + secondary `See how it works` link
- **Tertiary:** Pricing model factor grid, 3-step how-it-works, trust panel, result feature list, final CTA, footer

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| LP-01 | Public nav: `.public-nav` | The nav has **no background colour or backdrop blur** — it sits fully transparent over the hero section. On scroll, the nav text collides with body content below, making it illegible. The app nav (`.nav`) correctly uses `backdrop-filter: blur(18px)`, but the public site nav has none. | P1 | Creates confusing legibility and no visual separation from scroll content | Add `position: sticky; top: 0; backdrop-filter: blur(16px); background: rgba(8,9,13,0.85); border-bottom: 1px solid var(--border-soft); z-index: 20` to `.public-nav` |
| LP-02 | Nav logo: `.nav-logo` in public nav | The app header uses `PriceCheck` (mixed case, `font-size: 1.05rem`) while the public nav renders `PRICECHECK` (all-caps). The same brand name has two different treatments across the same product. | P1 | Breaks brand consistency — the product appears to have a split identity | Standardise to one treatment. Recommended: `PriceCheck` mixed-case everywhere |
| LP-03 | Product preview card: `.product-preview` | Card has a permanent `rotate(-1deg)` tilt combined with a 7s float animation (`preview-float`). The tilt looks unintentional and skewed rather than playful, especially on smaller desktop widths where it clips slightly into the grid gap. | P2 | Reduces perceived quality; appears to be a layout error on first glance | Reduce tilt to `rotate(-0.5deg)` or remove entirely; retain float animation separately |
| LP-04 | Hero grid: `.public-hero` | At exactly 1024px–1100px width, the two-column hero grid `minmax(0, 1.05fr) minmax(360px, 0.8fr)` causes the right column preview card to compress below readable width while the left column text remains extremely wide. No mid-range breakpoint handles this transition. | P1 | Content becomes cramped and nearly unreadable in a common laptop viewport band | Add a breakpoint at `1100px` to switch to a single column or reduce the preview card min-width to `300px` |
| LP-05 | Section eyebrow `.section-eyebrow` on public pages | Eyebrow text uses `--text-secondary` colour (`#9aa0ae`) at `0.78rem`. Against the dark background, the contrast ratio for this text-colour combination measures approximately **3.8:1** — below WCAG AA's 4.5:1 requirement for small text. | P1 | Fails accessibility contrast requirements for body-scale text | Change eyebrow colour to `--text-primary` at reduced opacity, or increase font-size to ≥14px where 3:1 is sufficient for large text |
| LP-06 | `trust-panel` and `final-cta` sections | Both use `margin: 32px 0 96px` — resulting in **96px of bottom margin** on a section that already has internal padding. The gap between the trust panel and the section below it is excessively large (~170px effective whitespace) on desktop. | P2 | Page feels bloated and disconnected between sections | Reduce `margin-bottom` on `.trust-panel` to `48px`; use padding internally rather than margin for bottom spacing |
| LP-07 | Footer: `.public-footer` | Footer uses `grid-template-columns: 2fr 1fr 1fr auto`. The last `auto` column (containing only the copyright `<small>`) creates an orphaned single column that hangs to the far right at desktop widths. On 1440px+ screens this creates a noticeably odd layout with a copyright token floating alone. | P2 | Visual imbalance in footer grid on widescreen | Move `<small>` copyright to span full-width on its own row, or move it into the first column below the logo |
| LP-08 | `result-section` `.result-list` | The "More than a number" section uses a `grid-template-columns: 1fr 0.8fr` for a split layout. The right column — a simple bulleted list using `border-left` — appears visually underweight and incomplete compared to the rich text left column. No visual card or surface separates it. | P3 | The section looks unfinished relative to neighbouring sections | Wrap the result-list in a `.card`-style surface, or convert the bullets into more substantial callout items |

---

## Screen 02 — Login View (`#login-view` via `/login`)

**Current Visual Role:** Authentication gate. Users arrive here either from the public site CTA or direct `/login` URL.

**What this screen is supposed to accomplish:** Let users authenticate via Google OAuth and proceed to the estimate workspace.

**Primary user action:** Click the Google Sign-In button.

**Current Hierarchy:**
- **Primary:** Google OAuth button (`#login-google-button`)
- **Secondary:** Heading `Know what to charge.` + supporting paragraph
- **Tertiary:** Eyebrow label, back link, auth error message

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| LG-01 | `.login-google-button` container | The Google Sign-In iframe is injected into a `div` with `min-height: 44px` but **no skeleton or placeholder state**. During the ~300–600ms it takes the Google Identity Services script to render, the container collapses to `0` height and then jumps — causing significant layout shift (CLS impact). | P1 | Jarring layout shift damages first-impression professionalism | Add a CSS skeleton pulse animation inside `#login-google-button` as a loading placeholder before the iframe resolves |
| LG-02 | `.login-card` max-width | Card has `max-width: 470px` and `padding: 40px`. On 375px mobile screens, the card fills the full viewport width minus the outer `main` padding (`20px` each side), giving it only `335px` effective interior. The heading text wraps to 3 lines (`Know what / to charge.`) at this width because `.login-card h1` has no text-size responsive clamp floor below 1.8rem. | P2 | Awkward heading wrapping on the most common mobile size | Apply `text-wrap: balance` to `.login-card h1` and ensure the clamp floor is `1.5rem` |
| LG-03 | `.login-back-link` | The "Back to PriceCheck" link has `margin-top: 24px` and `display: inline-block`. Its interactive area measures approximately **34px tall** — below the 44px minimum touch target required by WCAG 2.5.5. | P1 | Mobile users with larger fingers may frequently miss-tap | Add `min-height: 44px; display: inline-flex; align-items: center` |
| LG-04 | Error message `.login-auth-message` | The error paragraph uses `color: var(--danger)` which is `#f87171` — a bright red on dark backgrounds. However, the paragraph has `position: static` and `white-space: normal`, meaning a long error string causes the card to grow unpredictably and push the "Back" link off screen. | P2 | Long auth error messages break the card's fixed proportions | Set `max-height: 80px; overflow-y: auto` or limit error string length at the display layer |
| LG-05 | `.login-view` full-page centering | The login view uses `min-height: 70vh` with flexbox centering. On shorter viewports (e.g. landscape mobile, ~414×736px), the card visually sits in the **upper 40%** of the screen rather than the true centre — it is not accounting for the sticky nav height in the offset calculation. | P2 | Card feels top-heavy on landscape and short viewports | Change to `min-height: calc(100vh - 84px)` to account for nav height |

---

## Screen 03 — Dashboard / User Workspace (`#dashboard-view`)

**Current Visual Role:** Post-login landing for authenticated, non-admin users. Shows estimate statistics and recent history.

**What this screen is supposed to accomplish:** Give the user a quick sense of their estimate activity and provide one clear path to start a new estimate.

**Primary user action:** Click "Start New Estimate" button.

**Current Hierarchy:**
- **Primary:** "Start New Estimate" button + greeting heading
- **Secondary:** 3 stat cards (saved estimates, latest recommendation, categories explored)
- **Tertiary:** Recent estimates panel, guide panel ("From scope to invoice"), footer

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DB-01 | `.dashboard-header` greeting | The heading reads `"Good to see you."` statically — it does **not** personalise with the user's name, even though the auth system has `#auth-name` populated. The auth user area in the nav shows the user's name while the dashboard greets them generically. | P1 | Feels impersonal and disconnected given the personalised nav area | Inject the user's first name: `"Good to see you, [Name]."` from the resolved session |
| DB-02 | `.dashboard-stats` stat cards | The 3 KPI stat cards use `grid-template-columns: repeat(3, minmax(0, 1fr))` but have no explicit `min-height`. When values load asynchronously, the cards initially show `0` or `—` at a small text size and then reflux to a larger rendered value — causing visible content jump. | P2 | Layout jump during async data load feels unstable | Apply `min-height: 110px` to `.dashboard-stat` globally (already done for admin stat cards) |
| DB-03 | `.dashboard-stat-note` text | The "Stored on this device" note under the saved estimates count is **factually misleading for logged-in users** — estimates can also be stored in Supabase for authenticated users, not just locally. The copy implies purely local persistence. | P1 | Actively misleads signed-in users about where their data is | Update copy to: `"Stored on your account"` for authenticated users, `"Stored on this device"` for guests |
| DB-04 | `.dashboard-guide` panel — `"See invoice workflow"` button | The `dashboard-guide` secondary panel contains a "See invoice workflow" button (`#dashboard-invoice-btn`) but provides no estimate context — clicking it brings up the invoice form even when there's no active estimate. The invoice form fills in with blank or stale data. | P1 | Users can reach the invoice form with no estimate data, resulting in a confusing empty-state form | Disable or hide the invoice workflow button if no recent estimate exists; show a tooltip explaining the prerequisite |
| DB-05 | `.dashboard-recent-item` list | Recent estimate items show `category`, `quote amount`, and a `timestamp`. No action affordance (open, view, delete) is visible without inspecting — there are no visible interactive states or buttons. The items appear inert. | P2 | Users who want to revisit an estimate have no discoverable path | Add a visible "View →" or "Restore" action link on each item |
| DB-06 | Responsive: `.dashboard-grid` at 720px | At 720px–900px, `dashboard-grid` collapses to `1fr` stacking. The guide panel ("From scope to invoice") moves below the recent estimates panel, which is correct. However, the `.dashboard-header` (`flex align-items: flex-end`) becomes `flex-direction: column; align-items: flex-start` at 900px — but the **"Start New Estimate" button width becomes 100%** at 900px while everything else maintains its natural width. This looks correct but prevents the button from looking proportional to the text-heavy header on tablet widths. | P3 | Slightly oversized button on tablet | Apply `width: 100%` only below 720px; at 720–900px allow button to auto-size |

---

## Screen 04 — Estimate Workspace / Input Form (`#view-input`)

**Current Visual Role:** Core product functionality screen. User enters project details and triggers the pricing estimation.

**What this screen is supposed to accomplish:** Collect project description, deliverables, currency, experience level, and deadline, then submit for analysis.

**Primary user action:** Complete the form fields and click "Check My Price."

**Current Hierarchy:**
- **Primary:** Description textarea + "Check My Price" submit button
- **Secondary:** Deliverables input, experience level cards, deadline selection cards
- **Tertiary:** Currency select, hero sub-heading, history panel, feature grid below form

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| EW-01 | `.hero-title` and `.hero-sub` | The estimate workspace shows a full hero heading `"Know what to charge. Before you quote."` with a large sub-paragraph above the form. For a signed-in user who has already seen this on the landing page, this heading repeats with no added value. It pushes the form significantly below the fold, requiring scrolling before reaching the textarea. | P1 | Forces unnecessary scroll before users reach the primary action | Replace the hero area with a compact workspace header (e.g., eyebrow + short label only) once the user is authenticated |
| EW-02 | `.quote-form::before` pseudo-element | The `PROJECT / SERVICE` label above the form is rendered as a CSS `::before` pseudo-element — it is invisible to screen readers and does not function as a semantic label. It also cannot be translated by browser tools. | P1 | Inaccessible to assistive technology; untranslatable | Replace with an actual `<p class="section-eyebrow">` element in the HTML |
| EW-03 | `.selection-grid-deadline` — 5-column layout | The deadline selection group renders `grid-template-columns: repeat(5, 1fr)` — five equal cards side by side. At the `720px` content width the 5-column grid squashes each card to approximately `104px` wide. The card content (`"Same day / Rush"` — the longest label — wraps to 3 lines, causing its card to be ~65% taller than the others, breaking grid visual alignment entirely. | P1 | Card height inconsistency within the same radiogroup looks broken | Switch the deadline group to `grid-template-columns: repeat(3, 1fr)` on the second row, or use `minmax(0, 1fr)` with `auto-fill` and apply `text-wrap: balance` to card content |
| EW-04 | `.selection-card[aria-checked="true"]` active state | The active/selected state uses `background: var(--accent-soft)` which is `rgba(109,123,255,0.15)` — a very subtle fill. At `border-color: var(--accent)`, the visual distinction between a selected card and an unselected card on hover is marginal. Under bright ambient conditions (common for laptop users near windows), the selected state is barely distinguishable. | P1 | Users may not be certain which option they've selected — erodes confidence in form completion | Increase selected state contrast: use `background: rgba(109,123,255,0.28)` and add a checkmark icon or filled accent dot to selected cards |
| EW-05 | `.textarea-wrap` | The main description textarea has a `min-height: 120px` which is adequate, but the `resize: vertical` property allows the user to drag the textarea to enormous heights, collapsing the selection cards below out of view without any scroll indicator. | P3 | Edge case UX degradation when user aggressively resizes textarea | Add `max-height: 320px` to prevent excessive growth |
| EW-06 | `.field-error` (`#field-error`) | The form validation error message element uses `role="alert"` and `hidden` attribute. When unhidden, the red text appears below the selection groups but **above** the submit button, which is correct. However, the error text (`color: var(--danger)` = `#f87171`) at `0.88rem` on a dark background fails WCAG AA at 4.5:1 contrast for small text (~4.2:1 measured). | P1 | Form error text fails accessibility contrast standard | Lighten danger text to `#fca5a5` or increase to `font-weight: 600` to improve contrast |
| EW-07 | `.input-layout` — history panel as sidebar | The history panel (`#history-panel`) is a sticky right-column sidebar that only appears at desktop widths. At 900px it drops below the form. At desktop, the panel is `min-width: 240px; max-width: 300px` but the sticky positioning uses `top: 92px`. When the history panel is taller than the viewport, it does not scroll independently from the form — it just disappears below the viewport with no indication. | P2 | History is inaccessible mid-session on shorter desktops | Confirm `overflow-y: auto; max-height: calc(100vh - 120px)` is actually working (it is defined but the sidebar needs the right `position: sticky` anchor) |
| EW-08 | `.hero-note` — "Private by default" | The privacy note below the submit button (`"Private by default. Built for freelancers..."`) is `0.88rem` `--text-tertiary` colour. It looks like a legal disclaimer that nobody will read, and its placement interrupts the visual hierarchy between the button and what comes after. | P3 | Low-contrast note adds visual noise without aiding conversion | Move the note above the form, near the hero subtitle, where it would reinforce trust during the decision to fill in the form |

---

## Screen 05 — Loading State (`#view-loading`)

**Current Visual Role:** Transition screen shown while the backend processes the Gemini extraction and pricing calculation.

**What this screen is supposed to accomplish:** Reassure the user that work is happening, show visible progress, and prevent abandonment during the 2–5s processing window.

**Primary user action:** None — user waits and reads progress feedback.

**Current Hierarchy:**
- **Primary:** Progress bar + percentage counter
- **Secondary:** Status text label (e.g. "Extracting scope…")
- **Tertiary:** Sub-caption describing what is happening

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| LD-01 | `.loading-percent` counter | The percentage value (`5%`, `45%`, `90%`) uses `font-family: var(--font-display)` at `1.2rem`. As the number progresses from `5%` to `100%`, the character count changes (1 digit → 2 digits → 3 digits), causing visible **text-width jumping** that shifts adjacent elements. The `loading-progress-meta` flex row jiggles with each update. | P2 | Distracting layout micro-jitter during a wait state | Apply `font-variant-numeric: tabular-nums` and `min-width: 3.5ch` to `.loading-percent` |
| LD-02 | `.loading-text` status copy | Status messages update with an animation class `loading-text-changing`. However, the initial render uses the static text `"Starting"` (set in HTML) which never animates in — only subsequent changes trigger the animation. The first visible state is unanimated and jarring compared to all subsequent transitions. | P2 | First status message appears abruptly without entrance animation | Add `animation: loading-copy-in 0.45s var(--ease)` to the initial render as well, triggered on view show |
| LD-03 | `.view-loading` vertical alignment | The loading inner container uses `min-height: 60vh` on `.view-loading` with `align-items: center`. Given the sticky nav is `84px` tall, `60vh` of min-height means the spinner visually sits in the upper ~45% of the visible area rather than the true visual centre. | P2 | Loading indicator feels elevated toward the top half rather than centred | Change to `min-height: calc(100vh - 84px)` |
| LD-04 | `.loading-sub` — sub-caption | The sub-caption `"We are reading scope, calculating a fair range, and preparing your result."` is static and does not change with the loading stages. At stage `"Calculating price"`, it still says the same thing as stage `"Starting"`. The message never reflects the actual current stage. | P3 | Minor disconnect between progress label and sub-caption | Update the sub-caption text to match each loading stage phase |

---

## Screen 06 — Error State (`#view-error`)

**Current Visual Role:** Fallback shown when estimate generation fails for any reason.

**What this screen is supposed to accomplish:** Communicate that something went wrong without alarming the user, and offer a clear recovery path.

**Primary user action:** Click "Try Again" or "Return to estimate."

**Current Hierarchy:**
- **Primary:** "Try Again" button
- **Secondary:** Error title + error message text
- **Tertiary:** "Return to estimate" secondary button, eyebrow label

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ER-01 | `.error-message` (`#error-message`) | The error message displays raw technical copy that bubbles directly from the API layer (e.g. `"Something went wrong while analyzing your project. Please try again."`). There is no differentiation between error types: a network timeout, an invalid brief, and a rate limit all look identical to the user. | P1 | Users have no context to understand whether they should retry, rewrite their brief, or come back later | Categorise error codes and show contextual guidance per error type |
| ER-02 | `.error-inner` — no visual icon | The error state has only text — an eyebrow `"We hit a pause"`, a heading, a message, and two buttons. There is no visual icon, illustration, or colour signal indicating an error state. The screen looks identical in visual weight to the loading screen. | P1 | Users may not immediately recognise this as an error state vs. a loading transition | Add a subtle error icon (⚠ or ✗ in accent-red colour) above the eyebrow |
| ER-03 | `error-actions` button ordering | The button order is: `[Try Again (primary)] [Return to estimate (secondary)]`. This is correct. However on mobile, both buttons wrap and **neither takes full width** — they sit side by side at `~140px` each inside the centered flex container. At 320–375px viewports this causes the buttons to feel cramped and their labels risk truncation. | P2 | Cramped buttons on small phones are difficult to tap accurately | Stack buttons vertically on mobile: add `flex-direction: column; width: 100%` on `.error-actions` below 480px |

---

## Screen 07 — Result View (`#view-result`)

**Current Visual Role:** The payoff screen. Displays the completed pricing estimate with all supporting reasoning, range visualiser, scope breakdown, advice, and action buttons.

**What this screen is supposed to accomplish:** Deliver the pricing recommendation clearly, explain the reasoning, and guide the user to their next step (copy, download, invoice, or new estimate).

**Primary user action:** Read the recommended quote, then choose an action (Copy / Download / Invoice / New Estimate).

**Current Hierarchy:**
- **Primary:** Recommended Quote (`#recommended-quote`) — gradient display text at `clamp(2.6rem, 6vw, 3.4rem)`
- **Secondary:** Fair Range + range indicator visualiser
- **Tertiary:** Metadata bar (project, experience, deadline), result grid cards, action buttons, feedback form, invoice form

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RV-01 | `.quote-primary` and `.quote-range` — side-by-side layout | The two summary cards (`Recommended Quote` and `Fair Range`) are placed side by side in a `flex` row with `gap: 48px`. The "Recommended Quote" card contains the dominant display number. The "Fair Range" card uses `font-size: 1.6rem` — significantly smaller. However, both cards use `min-width: min(100%, 260px)`, meaning they appear at near-equal visual weight despite the quote being the primary piece of data. The asymmetry is not communicated visually. | P1 | Users may treat both numbers as equal — the primary recommended quote does not command clear visual authority | Apply a distinct treatment to `.quote-primary`: larger border-color highlight, slightly different background tint, or increased padding to signal it is the headline number |
| RV-02 | `.range-marker` — range visualiser dot | The range marker (white dot with accent border, 16×16px) sits on the track bar but has no label or tooltip. When a user hovers or focuses the marker, nothing happens — there is no indication of what value it represents or where the recommended quote falls within the range. | P2 | Range indicator is decorative rather than informative — users cannot read exact position values | Add `title` attribute with the recommended quote value, and on hover show a small tooltip above the marker with the recommended price |
| RV-03 | `.result-grid` — card height misalignment | The result grid uses `grid-template-columns: repeat(2, minmax(0, 1fr))`. The `breakdown-card` and `reasons-card` sit in a 2-column row. The `reasons-card` content (list of pricing rationale items) is frequently 2–3× longer than the `breakdown-card` content (5–7 scope fields). This causes the left column card to appear half-filled with dead whitespace at the bottom. | P2 | Empty whitespace in the breakdown card looks unintentional and reduces visual quality | Add `align-items: start` to `.result-grid` so cards only grow to their content height, **or** convert to a CSS masonry / `align-items: stretch` with a consistent inner min-height |
| RV-04 | `.advice-card` spans full width | The advice card (`.advice-card { grid-column: 1 / -1 }`) correctly spans the full width. However the card title `"Why This Price?"` and `"Pricing Advice"` are two separate cards with similar names positioned adjacently. Users arriving at the result view do not have a clear mental model of which card answers which question. | P2 | Two cards with overlapping purposes create confusion about which to read first | Rename `breakdown-card` title from `"Scope & project details"` to `"Project Scope"` and `reasons-card` from `"Why This Price?"` to `"Pricing Factors"` to create clearer differentiation |
| RV-05 | `.result-actions` — button order | The action buttons are: `[Copy Quote] [Download Estimate] [Create Invoice] [Start New Estimate]`. The primary action visually (`Start New Estimate`) is positioned last and has `flex: 1 1 100%` (full row width). The secondary actions (`Copy`, `Download`, `Invoice`) are grouped before it. While logical, the `"Create Invoice"` button — a high-value next step — is styled identically to `"Copy Quote"` (both `.btn-secondary`). | P2 | `"Create Invoice"` should be visually elevated above `"Copy Quote"` and `"Download Estimate"` | Give the `"Create Invoice"` button a unique style: either `.btn-secondary` with an accent-coloured border, or a ghost button with accent text colour |
| RV-06 | `.result-eyebrow` generated via `::before` | The eyebrow text `"PRICECHECK RESULT ·"` is injected via CSS `::before { content: "PRICECHECK RESULT · " }` — invisible to screen readers and impossible to customise per locale. | P1 | Screen readers announce `"Your Estimate"` without the context of it being a PriceCheck result | Move eyebrow content to the HTML as a visible `<span>` inside `.result-eyebrow` |
| RV-07 | `.disclaimer` — position and prominence | The disclaimer (`"Estimates are provided for planning purposes..."`) sits **between** the result grid and the action buttons. This inserts a low-priority notice at a moment when the user is about to act — it interrupts the action momentum. | P3 | Interrupts the action sequence at the worst moment | Move the disclaimer below the feedback form, where it serves as a contextual footer note |

---

## Screen 08 — History Panel (`#history-panel` sidebar, `#dashboard-view` recent list)

**Current Visual Role:** Saved estimate sidebar within the input workspace, and a summary panel on the user dashboard.

**What this screen is supposed to accomplish:** Allow users to review, restore, and delete their previous estimates.

**Primary user action:** Click a history item to restore its result, or clear/delete entries.

**Current Hierarchy:**
- **Primary:** History item list (project name + quote + timestamp)
- **Secondary:** `"View all"` / `"Clear all"` actions
- **Tertiary:** Empty state text, section eyebrow

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| HP-01 | `.history-item` — no primary action affordance | History list items show project name, price, and timestamp but have no visible button or link to reload or re-open a past estimate. The only visible interactive element is a small `Delete` or `Restore` action that only appears after JS renders it into `.history-item-actions`. Before JS renders, these items look entirely inert. | P1 | Users arriving at the form see history items but have no discoverable way to interact with them until JS loads | Add a `cursor: pointer` visual cue and a visible `"View"` text link inside the card by default — not dependent on JS rendering alone |
| HP-02 | `.history-panel` custom scrollbar | The history panel defines `scrollbar-color: var(--border) transparent` but does not define `::-webkit-scrollbar` styles. On Chromium browsers (Chrome, Edge), the native dark scrollbar gutter is visible on the panel's right edge in a light brownish-grey that does not match the dark glassmorphism aesthetic of the panel itself. | P2 | Visual inconsistency between scrollbar styling and panel design | Add `scrollbar-width: thin` and `::-webkit-scrollbar { width: 4px }; ::-webkit-scrollbar-track { background: transparent }; ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px }` |
| HP-03 | `.history-item-meta` — timestamp format | Timestamps in history items render as raw ISO strings (e.g. `2026-09-28T14:22:00.000Z`) or browser-formatted locale strings depending on the JS runtime. The format is not controlled — on some browsers it appears as `"9/28/2026, 2:22:00 PM"` which is verbose and inconsistent between locale settings. | P2 | Inconsistent date display across browsers; raw ISO strings are unreadable | Format to a consistent relative time (e.g. `"2 hours ago"`, `"Yesterday"`, `"Sep 28"`) using `Intl.RelativeTimeFormat` |

---

## Screen 09 — About Page (`/about.html`)

**Current Visual Role:** Brand and product philosophy page for curious visitors or referred users.

**What this screen is supposed to accomplish:** Build trust and credibility through transparent explanation of what the product is, how it works philosophically, and why it exists.

**Primary user action:** Click "Create a Price Check" CTA at the bottom.

**Current Hierarchy:**
- **Primary:** Page hero heading `"Pricing should be a decision, not a guess."`
- **Secondary:** Body narrative sections + belief grid
- **Tertiary:** Trust panel, final CTA, footer

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AB-01 | `.belief-grid` — 4 article cards | The belief grid uses `grid-template-columns: repeat(3, 1fr)` but contains **4 articles**. This produces a 3-column first row and a single orphaned card on the second row, stretching full width. The orphaned card looks left-behind. | P2 | Asymmetric grid layout appears unintentional | Change to `repeat(2, 1fr)` (2×2 grid) which divides 4 items evenly and suits the content length |
| AB-02 | Public nav — no sticky treatment | Same issue as LP-01. The public nav on this page has no sticky/backdrop treatment. As the user scrolls through the about copy, the nav disappears above the fold with no way to navigate without scrolling back. | P1 | Nav inaccessible after first scroll — standard expected behaviour on information pages | Add sticky nav treatment (same fix as LP-01) |
| AB-03 | `trust-panel` re-use | The about page reuses the exact same `.trust-panel` component with the same visual style as the home page's trust panel. Both read as identical sections. The about page trust panel adds no new visual differentiation despite being on a different page with different content. | P3 | Cross-page section repetition without visual variation reduces brand richness | Apply a subtle colour variation to the trust panel background on interior pages (e.g., swap gradient direction) |

---

## Screen 10 — How It Works Page (`/how-it-works.html`)

**Current Visual Role:** Process explainer page showing the 5-step flow from brief to estimate.

**What this screen is supposed to accomplish:** Educate skeptical or curious visitors on exactly how PriceCheck works, to reduce friction before sign-up.

**Primary user action:** Scroll through the process and click "Create a Price Check" at the bottom.

**Current Hierarchy:**
- **Primary:** `h1` — `"How PriceCheck works"` with eyebrow `"The process"`
- **Secondary:** 5 numbered `.process-section` steps
- **Tertiary:** Split section (caching + progress), trust panel, final CTA, footer

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| HI-01 | `.process-section` steps 02 and 04 have `.reverse` class | Steps using `.reverse` change to `grid-template-columns: 70px minmax(0, 1fr)` — they lose the third column preview entirely. This means steps 01, 03, 05 have a visual preview element (`.form-preview`) while steps 02 and 04 are text-only. The alternating rhythm is inconsistent — some rows appear two-column while others appear three-column — creating an uneven visual flow. | P2 | Uneven column count creates visual asymmetry that feels unresolved | Give all "reverse" steps a third column — even a simple icon or abstract graphic element — so all rows share the same three-column grid rhythm |
| HI-02 | `.formula` component | The formula `"Base price × project modifiers = calculated quote"` uses a custom `.formula` class with `border`, `border-radius`, and font-family `var(--font-display)`. The `<b>` elements highlighting the operators (`×` and `=`) are styled with `color: var(--accent-strong)` but at a very small effective size. On mobile this section collapses into a single-line expression that wraps oddly. | P3 | Minor readability issue on narrow screens | Apply `white-space: nowrap` to prevent operator wrapping, or restructure as a multi-line visual formula |
| HI-03 | Public nav — no sticky treatment | Same as LP-01 and AB-02. The "How It Works" page is the longest of the three public pages (185 lines, many scroll sections) and suffers most acutely from the absent sticky nav — users deep in the process steps cannot navigate away without scrolling all the way back up. | P1 | Nav completely inaccessible after users scroll down the longest public page | Apply sticky nav treatment (same fix as LP-01) |

---

## Screen 11 — Feedback Form (`#feedback-form`, within `#view-result`)

**Current Visual Role:** Embedded optional data-collection form below the result view. Collects post-project outcome data.

**What this screen is supposed to accomplish:** Gather anonymous feedback about how the estimate performed to feed into calibration analytics.

**Primary user action:** Fill out amount + outcome fields and click "Send Feedback."

**Current Hierarchy:**
- **Primary:** "Send Feedback" submit button
- **Secondary:** `"What did you charge?"` amount field + `"What happened?"` outcome select
- **Tertiary:** Reason for change select, heading, introductory copy, Optional badge

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FB-01 | `.invoice-fields` layout re-use in feedback form | The feedback form uses the same `.invoice-fields` class (`grid-template-columns: repeat(2, minmax(0, 1fr))`) as the invoice form. The first field `"What did you charge?"` (number input) and `"What happened?"` (select) are placed in a 2-column grid, while the `"If you changed the estimate, why?"` reason field (`invoice-field-wide`) spans both columns. The 2-column layout creates an awkward visual grouping — the number input and select are side-by-side at the same width, making them appear equally weighted when the outcome select is conceptually dependent on the amount. | P2 | Misleading visual grouping between equal-width sibling fields | Use a single column layout for the feedback form — it only has 3 fields and does not require a 2-column grid |
| FB-02 | `feedback-amount` input — number type with no currency context | The `"What did you charge?"` field is `type="number"` with `min="1"` but shows no currency prefix, suffix, or select. If the user estimated in USD but the form has no currency indicator, the admin analytics will misinterpret NGN amounts as USD or vice versa. | P1 | Currency-ambiguous data corrupts admin calibration analytics | Add a read-only currency display prefix (e.g. `₦`) adjacent to the input, pulled from the result's selected currency |
| FB-03 | `.feedback-form` — no success state with visual celebration | On successful submission, `#feedback-message` is revealed with `color: var(--success)` text. The button remains visible (not replaced or disabled). There is no visual state change to the form — the submit button stays active and the user could re-submit. | P2 | No clear confirmation state; risk of duplicate feedback submissions | Hide/disable the form post-submission and show a clean success state with a confirming icon |
| FB-04 | `.feedback-optional` badge | The `"Optional"` badge next to the form heading uses `color: var(--text-tertiary); font-size: 0.8rem`. At this size and contrast level it measures approximately **2.9:1** against the card background — below the 3:1 minimum for decorative/non-essential text according to WCAG 1.4.3. | P3 | Low contrast badge but content is non-essential | Increase to `font-size: 0.85rem` with `color: var(--text-secondary)` |

---

## Screen 12 — Invoice Form (`#invoice-form`, within `#view-result`)

**Current Visual Role:** Secondary form revealed by clicking "Create Invoice" — converts the estimate into a client-ready PDF invoice.

**What this screen is supposed to accomplish:** Collect billing details (from/to names, bank info) and generate a downloadable invoice PDF.

**Primary user action:** Fill in client and bank details, click "Download Invoice PDF."

**Current Hierarchy:**
- **Primary:** "Download Invoice PDF" button
- **Secondary:** Required fields (`Bill to`, `Bank name`, `Account name`, `Account number`)
- **Tertiary:** Optional fields (`From`, `Client email`, `Due date`, `Notes`), intro copy, close button

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| IV-01 | Required field labelling | Three fields are labelled `(required)` in their label text (`Bank name (required)`, `Account name (required)`, `Account number (required)`). However, the `"Bill to"` field also has `required` attribute but its label reads simply `"Bill to"` with **no `(required)` indicator**. The convention is inconsistent — some required fields are marked, one is not. | P1 | Users may submit without the client name and receive a confusing validation failure | Add `(required)` indicator to the `"Bill to"` label to match the convention |
| IV-02 | `invoice-close-btn` styling | The close button uses the `.history-action` class — an inline ghost text button styled for history panel actions. Its label is `"Close"` rendered as a text link style in the upper-right corner of the card heading. This makes it look like a navigation link rather than a dismiss control for a form within the current view. | P2 | Semantically ambiguous close control; users may not immediately identify it as dismissing the form | Replace with an `×` icon button styled like `.admin-drawer-close` for consistent dismiss affordance |
| IV-03 | `invoice-due` — date input | The due date field (`type="date"`) renders in the browser's native date-picker UI, which on Windows Chrome renders with a light-themed calendar popup — visually jarring against the dark UI. No dark colour-scheme is applied. | P2 | Native date picker appears in bright-white theme against dark UI | Add `color-scheme: dark` to `.invoice-fields input[type="date"]` |
| IV-04 | Form scroll position | When the user clicks "Create Invoice" the invoice form appears, but the page does not scroll to bring the form into view. The form is appended after the feedback form — both are `hidden` initially — and appears below the bottom of the viewport. The user must manually scroll down to find the form after clicking the button. | P1 | User clicks "Create Invoice," nothing visibly changes in their current viewport — the form is off-screen | Add `invoiceForm.scrollIntoView({ behavior: 'smooth', block: 'start' })` after revealing the form |
| IV-05 | `.invoice-notes` textarea placeholder | The placeholder text reads `"Payment terms, bank details, or a thank-you note"`. Given bank details are already collected in dedicated fields above, suggesting them again in the notes field creates redundancy and may confuse users about where bank info belongs. | P3 | Minor copy confusion | Update placeholder to `"Payment terms, delivery conditions, or a personal note"` |

---

## Screen 13 — Admin → Overview & Analytics (`#admin-panel-overview`)

**Current Visual Role:** Primary admin operations screen. Shows platform-wide KPI metrics, category volume charts, outcome distribution, and recent feedback.

**What this screen is supposed to accomplish:** Give admins/analysts a clear picture of estimate volume, pricing accuracy, user activity, and calibration health at a glance.

**Primary user action:** Review KPI metrics and inspect category performance chart for calibration signals.

**Current Hierarchy:**
- **Primary:** 5 KPI stat cards (Estimates generated, Registered users, Feedback records, Accepted estimates, Estimate accuracy)
- **Secondary:** Category performance bar chart + Recent outcomes panel
- **Tertiary:** Outcome distribution donut + Estimate vs. actual scatter plot + Popular services table

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AO-01 | Inline `style=""` on `#admin-access-denied` | The access-denied warning banner in `index.html` lines 305–312 uses six hardcoded inline style rules: `margin`, `padding`, `border`, `border-radius`, `background`, `color`. These bypass the CSS token system entirely and use raw hex values (`rgba(255, 143, 0, 0.08)`, `rgba(255, 149, 0, 0.35)`). | P1 | Inline styles cannot be themed, overridden by breakpoints, or maintained without touching HTML | Extract all 6 inline style rules to a `.admin-access-denied` CSS class in `styles.css` using CSS variables |
| AO-02 | `.admin-view .dashboard-stats` — unequal column widths | The admin KPI grid uses `grid-template-columns: 1.35fr repeat(4, minmax(0, 1fr))` — making the "Estimates generated" primary card 35% wider than the others. While the intent is to visually emphasise the primary metric, the width difference is not communicated by any other visual treatment: the card colour is slightly different (`--admin-stat-primary`) but the badge inside it (`⚡ Volume`) is the same size as all other badges. The asymmetric width without corresponding visual emphasis creates an ambiguous hierarchy signal. | P2 | Primary KPI card is wider but not significantly more visually prominent — the intent is unclear | Either increase visual emphasis of the primary card to justify its extra width (larger number, accent glow border), or equalise all card widths |
| AO-03 | `.admin-kpi-badge` — emoji usage | KPI badges use raw emoji characters: `⚡ Volume`, `👤 Users`, `📊 Data`, `🎯 Accuracy`. Emoji render inconsistently across operating systems, browsers, and screen readers — they may appear as black-and-white fallback squares on some Linux systems, and screen readers will announce the full emoji name (e.g. `"high voltage sign"`) which is disruptive in a screen-reader context. | P2 | Inconsistent rendering and poor accessibility for emoji in data UI | Replace emoji with SVG icons or CSS-only icon shapes, or use CSS `content` pseudo-elements for decorative context |
| AO-04 | `.admin-live-dot` — "Live" labels | The `"Live"` indicator appears on three panel headers simultaneously (Recent outcomes, Outcome distribution, Popular services). All three using the same "Live" indicator simultaneously reduces its signal value — it implies all data is real-time equally, but some panels may aggregate stale data. | P3 | Overuse of "Live" indicator dilutes the meaning | Reserve `"Live"` for the panel that most recently updates (Recent outcomes), and use `"Auto-updated"` or remove the indicator from static aggregate panels |
| AO-05 | `.admin-scatter` — axis labels | The scatter plot axis labels (`.admin-scatter-axis-x` and `.admin-scatter-axis-y`) use `font-size: 0.6rem` and `color: var(--text-tertiary)`. At `0.6rem` / ~9.6px rendered, these labels fall below the WCAG minimum readable size recommendation and are barely legible at standard display density (96dpi). | P2 | Axis labels are near-illegible — chart context is lost without readable labels | Increase to minimum `0.72rem` and use `--text-secondary` colour |
| AO-06 | Admin header — `"Reset metrics"` button | The `#admin-reset-btn` (`"Reset metrics"`) button sits next to the notification bell in the admin topbar, styled as `.history-action-danger` (coloured red/danger). A destructive action button at the very top of the screen — always visible regardless of current tab — is highly exposed. An accidental click from the Overview tab would reset all metrics. | P1 | Destructive action is one click away with no contextual protection or confirmation gate at its placement level | Move the Reset button inside the specific tab panel it applies to (Overview), or add a `disabled` state when the user is on non-relevant tabs |

---

## Screen 14 — Admin → Pricing Studio (`#admin-panel-pricing`)

**Current Visual Role:** No-code pricing configuration editor. Allows admins to change baseline prices, min/max ranges, and multipliers for each creative service category.

**What this screen is supposed to accomplish:** Let authorised admins tune the pricing model live without touching server code — then confirm changes through a diff modal before applying.

**Primary user action:** Edit a category's base price and click "Save" to trigger the confirmation modal.

**Current Hierarchy:**
- **Primary:** Pricing category cards grid (`#admin-pricing-grid`)
- **Secondary:** Save/Reset buttons per card
- **Tertiary:** Panel header, subtitle, "No-Code Editor" badge

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PS-01 | `.admin-pricing-card` — `"Loading pricing configuration..."` state | The pricing grid initially renders a single `<div class="admin-pricing-loading">Loading pricing configuration...</div>`. This loading text has no visual styling, no spinner, no skeleton card — it renders as bare, unstyled inline text inside the grid container. Against the `#0d121f` panel background it is almost invisible. | P1 | Loading state is visually absent — the panel appears broken on initial load | Replace with 3–4 `.skeleton-box` placeholder cards that match the pricing card dimensions and use the existing `skeletonShimmer` animation already defined in the stylesheet |
| PS-02 | `.admin-pricing-field input` — number inputs | Price input fields use `width: 110px; text-align: right`. The label (`"Base price"`, `"Minimum"`, `"Maximum"`) is left-aligned, the input is right-aligned with a right-aligned number. On desktop this is readable. But there is **no visible currency symbol** adjacent to the inputs — a user editing the "Base price" field sees a naked number with no currency indicator, making it ambiguous whether they are typing in NGN, USD, or a multiplier. | P1 | Currency-ambiguous inputs create risk of incorrect data entry | Add a currency prefix label (e.g. `₦`) or unit indicator as part of each input group |
| PS-03 | `.pricing-confirm-modal` — diff box UX | The confirmation modal shows a diff box with `Previous Config → New Config`. The "Change Reason / Audit Note" input is labelled `"Optional"`. However, for a destructive live configuration change to the pricing engine, having an optional audit note means changes can be applied with zero accountability trace beyond the automatic timestamp. | P2 | Optional audit notes create accountability gaps in change management | Mark the reason field as `required` (or at minimum `recommended`), and surface a warning if the user submits with an empty reason |
| PS-04 | `.admin-pricing-save-btn` — button shape mismatch | All other action buttons in the application use `border-radius: 999px` (pill shape). The Pricing Studio card save button uses `.admin-pricing-save-btn` with `border-radius: var(--radius-sm)` — a rectangular rounded button. This breaks the global button shape system throughout the admin section. | P2 | Inconsistent button radius breaks design system coherence | Change `.admin-pricing-save-btn` to use `border-radius: 999px` to match the global `btn` convention |

---

## Screen 15 — Admin → Access Control / RBAC (`#admin-panel-rbac`)

**Current Visual Role:** User and role management interface for controlling who has what administrative privileges.

**What this screen is supposed to accomplish:** Let Super Admins view all registered users, assign/revoke admin roles, and filter/search users — with a confirmation gate before any role change.

**Primary user action:** Find a user, select a new role in their dropdown, and confirm the change.

**Current Hierarchy:**
- **Primary:** User access table (`#admin-access-table`) with role dropdowns
- **Secondary:** Role count cards grid (5 roles)
- **Tertiary:** Search bar + role filter toolbar, panel header, `"Backend Enforced"` badge

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| RC-01 | `.rbac-role-card` — placeholder user counts | Role count cards initialize with hardcoded `<strong>1</strong>` in the HTML for every role (`count-owner`, `count-super-admin`, etc.). Before the JS data loads, every role card shows `1 user`. If loading takes more than ~200ms, users see five `"1"` counts that abruptly change — a jarring inaccuracy that momentarily implies every role has exactly one user. | P1 | Incorrect placeholder data creates a false state that erodes trust in the admin UI | Initialize all counts to `—` or `0` in HTML, or use a skeleton shimmer inside `<strong>` until real data resolves |
| RC-02 | `.admin-data-table` — RBAC table column widths | The RBAC user table has 6 columns: `User Account`, `Current Role`, `Status`, `Assigned Role`, `Granted Privileges`, `Action`. On standard 1280px desktop width, the `"Granted Privileges"` column contains multi-tag `rbac-perm-tag` pills that force it to grow, crushing `"User Account"` and `"Action"` columns into narrow widths. The action dropdown becomes visually clipped on smaller desktops. | P2 | Column crowding makes the table difficult to use at standard desktop widths | Set explicit `min-width` on the `"User Account"` column (`180px`) and `"Action"` column (`120px`); allow `"Granted Privileges"` to flex within remaining space |
| RC-03 | `.rbac-you-badge` — `"You"` indicator | The current user is marked with a `.rbac-you-badge` badge inline with their name. The badge is styled as a small pill (`color: #b3e5fc`, `border: 1px solid rgba(79,195,247,0.35)`). It is legible but very small (`0.65rem` / ~10.4px) — at standard desktop resolution it is easy to miss entirely, especially in a dense table row. | P3 | Self-identification badge is easy to overlook at small size | Increase badge font-size to `0.75rem` and consider adding a `•` prefix separator for better scanability |
| RC-04 | `.rbac-role-card` — "role-card-owner" missing distinct color | All 5 role cards use `.rbac-role-card` with variant classes (`role-card-owner`, `role-card-super`, etc.), but only the **Owner role badge** (`role-owner`) has a distinct gold colour with `box-shadow`. The role cards themselves do not reflect this gold accent — they all share the same `var(--surface)` background and `var(--border-soft)` border. The Owner card is indistinguishable from the Standard User card at a glance. | P2 | Highest privilege role is visually identical to the lowest privilege role at the card level | Apply a subtle gold-tinted border and background to `.role-card-owner` matching the Owner badge colour token |
| RC-05 | `rbac-panel-subtitle` — backtick formatting in HTML | The subtitle text in `index.html` line 639 reads: `Configure administrative permissions (\`Super Admin\`, \`Pricing Manager\`, \`Analyst\`, \`Standard User\`).` The backtick characters are rendered as literal characters in the browser — they display as `` `Super Admin` `` with visible backticks. | P2 | Backtick characters visible in rendered UI look like a raw Markdown string leaked into production | Replace backtick-wrapped names with `<code>` tags or remove the formatting entirely |

---

## Screen 16 — Admin → System Telemetry & Logs (`#admin-panel-telemetry`)

**Current Visual Role:** Real-time operational monitoring dashboard. Shows server health, memory usage, integration status, and a live event log.

**What this screen is supposed to accomplish:** Give the Owner/Super Admin visibility into server health, uptime, external service connectivity, and a historical audit trail of all system events.

**Primary user action:** Review system health metrics and search/filter the audit log for specific events.

**Current Hierarchy:**
- **Primary:** 4 telemetry cards (Process Runtime, Memory Heap, Integration Status, Diagnostics)
- **Secondary:** Audit log terminal (`#telemetry-log-terminal`) with search, filter, and severity badges
- **Tertiary:** Auto-refresh controls, `"Refresh"` button, `"Clear Logs"` button, panel header

---

### Problem List

| ID | Element | Problem | Severity | Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TL-01 | `.telemetry-card` — undefined CSS variable | `.telemetry-card` sets `background: var(--bg-surface)` but the CSS token `--bg-surface` is **never defined** in `:root` or anywhere in `styles.css`. The token falls back to the browser default `transparent`, making telemetry cards visually flat with no surface elevation against the panel background. | P0 | Telemetry cards render transparent — they appear as borderless floating boxes with no depth | Define `--bg-surface: rgba(255, 255, 255, 0.025)` in `:root`, or replace `var(--bg-surface)` with `var(--surface)` which is correctly defined |
| TL-02 | `.telemetry-logs-panel` — uses `var(--bg-surface)` | Same undefined token issue as TL-01. The entire log terminal panel container uses `background: var(--bg-surface)` and resolves to `transparent`. The dark terminal pane inside (`#090d16`) is visible, but the surrounding panel has no visible container styling — it appears to float unstyled in the tab panel. | P0 | Log panel container background is missing — creates a visually broken outer shell around the terminal | Same fix as TL-01: replace `var(--bg-surface)` with `var(--surface)` |
| TL-03 | `.telemetry-pulse-dot` — inactive state colour | The inactive pulse dot (when auto-refresh is disabled) uses `background: #757575` — a mid-grey. Against the dark admin panel this colour has a contrast of approximately **2.7:1**, below the 3:1 minimum even for non-text UI elements of this size (`10×10px`). | P2 | Inactive dot state is barely visible — users cannot clearly see whether auto-refresh is off | Change inactive state to `var(--text-tertiary)` which is `#6a7080` — slightly more defined, and add a visible `title` tooltip `"Auto-refresh disabled"` |
| TL-04 | `.telemetry-log-terminal` — no custom scrollbar | The log terminal uses `overflow-y: auto` on a dark background (`#090d16`). On Chromium the native scrollbar renders in the system theme colour — typically light or dark grey — which does not match the terminal aesthetic. The `.history-panel` at least defines `scrollbar-color`, but the terminal defines none. | P2 | Mismatched scrollbar styling breaks the terminal's dark aesthetic | Apply `scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent` and `::-webkit-scrollbar` styles matching the dark terminal |
| TL-05 | `telemetry-controls-group` — Auto-Refresh label layout | The `"Auto-Refresh:"` label is part of a `<label>` element wrapping the `<select>` — this means clicking the text `"Auto-Refresh:"` will open the select dropdown (correct). However the pulsing dot (`telemetry-pulse-dot`) is also inside this label, making the **dot itself a click target for the select**. Clicking the visual status indicator triggers the dropdown — an unexpected behaviour. | P2 | Status indicator inadvertently functions as a dropdown trigger — confusing UX | Extract the pulse dot from inside the `<label>` element into a standalone `<span>` adjacent to it |
| TL-06 | Audit log `"All Actions"` filter and `"All"` severity filter | There are two separate filter mechanisms: a `<select>` dropdown for filtering by action type, and pill buttons for filtering by severity. Using both simultaneously is not visually communicated — the relationship between these two filters (AND logic? OR logic?) is nowhere documented in the UI. When no logs exist, only `"No activity recorded yet."` appears, with no visual indicator of the active filter combination. | P2 | Users cannot tell what the combined filter state is — may think there are no logs when filters are masking data | Add an active-filter summary label (e.g. `"Showing: warning events · pricing.updated actions"`) above the terminal when filters are non-default |

---

*End of screen-by-screen audit. Total problems identified: 63 across 16 screens.*

| Severity | Count |
| :--- | :--- |
| **P0 — Critical** | 2 |
| **P1 — Major** | 25 |
| **P2 — Moderate** | 27 |
| **P3 — Minor** | 9 |
