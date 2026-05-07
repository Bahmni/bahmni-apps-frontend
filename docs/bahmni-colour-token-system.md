# Bahmni Colour Token System — Implementation Guide

**Jira:** [BAH-4634](https://bahmni.atlassian.net/browse/BAH-4634)  
**Scope:** Carbon v11 CSS custom property overrides with Bahmni brand colours, applied monorepo-wide via `bahmni-design-system`

---

## Table of Contents

- [Overview](#overview)
- [Approach: CSS Custom Properties](#approach-css-custom-properties)
- [Core Concepts](#core-concepts)
- [Confirmed Bahmni Colour Overrides](#confirmed-bahmni-colour-overrides)
- [Phase 1 — Token Infrastructure](#phase-1--token-infrastructure)
- [Phase 2 — Migrate Distro App Shell Components](#phase-2--migrate-distro-app-shell-components)
- [Phase 3 — Migrate Design System Molecules](#phase-3--migrate-design-system-molecules)
- [Phase 4 — Verify Acceptance Criteria Surfaces](#phase-4--verify-acceptance-criteria-surfaces)
- [Phase 5 — App-Level Cleanup](#phase-5--app-level-cleanup)
- [Phase 6 — Build Verification and Stylelint Hardening](#phase-6--build-verification-and-stylelint-hardening)
- [Future Extensibility](#future-extensibility)
- [File Change Summary](#file-change-summary)

---

## Overview

Carbon v11 defines all its theme values as CSS custom properties (`--cds-*`) on `:root`. Every Carbon component references these variables internally. The approach is to inject a `:root {}` override block — sourced from Bahmni's Figma Variables — after Carbon's base CSS in `bahmni-design-system`. Because all apps in the monorepo depend on `bahmni-design-system`, the override propagates to every app automatically.

### Token flow

```
Figma Variables (collection 25984-295101)
        │  hex values extracted once into
        ▼
packages/bahmni-design-system/src/styles/_palette.scss
        │  SCSS variables, compile-time only, zero CSS output
        │  referenced by
        ▼
packages/bahmni-design-system/src/styles/bahmni-tokens.scss
        │  outputs :root { --cds-* } CSS custom property overrides
        │  imported after Carbon base CSS in
        ▼
packages/bahmni-design-system/src/index.ts
        │  compiled into dist/index.css by Vite
        │  consumed by all packages and apps
        ▼
@bahmni/widgets → apps/clinical, apps/registration, apps/appointments
        │
        ▼
distro (Webpack shell) — all CSS bundled and served
```

### Why `bahmni-design-system` and not `distro`

Placing overrides in `distro/src/styles.scss` only applies when running inside the shell. It breaks Storybook, `nx serve clinical` in isolation, and unit/visual tests — all of which load CSS from `bahmni-design-system` directly. Putting tokens in `bahmni-design-system` means every consumer always gets Bahmni colours.

---

## Approach: CSS Custom Properties

### Why CSS custom properties over SCSS token override

Carbon v11 supports two theming approaches:

| | CSS custom property override | SCSS token override |
|---|---|---|
| How it works | `:root { --cds-button-primary: #007d79 }` after Carbon base CSS | `@use '@carbon/react/scss/theme' with (...)` replaces Carbon defaults at compile time |
| Build speed | ✅ Fast — uses pre-compiled Carbon CSS | ⚠️ Slower — must compile all Carbon SCSS from source |
| Visual result in browser | Identical | Identical |
| Future design system switch | ✅ Change variable names only | ❌ Rewrite build pipeline + SCSS config |
| Future runtime theming | ✅ `applyBahmniTheme()` overrides inline styles on top | ✅ Also works |
| Design system coupling | To CSS variable name strings only | To Carbon's proprietary SCSS `@use` API |

**CSS custom properties are chosen** because:

1. **Design system agnostic** — CSS custom properties are a web standard. When switching to a different design system, only the variable names in `bahmni-tokens.scss` change. `_palette.scss` hex values and the `applyBahmniTheme()` utility both survive the switch untouched.
2. **Keeps `bahmni-design-system` isolated** — no service calls, no framework API coupling. The design system owns defaults only; the shell orchestrates runtime config.
3. **Build stays fast** — pre-compiled `@carbon/styles/css/styles.css` is unchanged.
4. **Runtime theming compatible** — future dynamic config fetch can override these values via inline styles without touching this layer.

### How the cascade override works

Both Carbon's base CSS and `bahmni-tokens.scss` target `:root` at the same specificity. **Last declaration wins.**

```
@carbon/styles/css/styles.css  →  :root { --cds-button-primary: #0f62fe }  (Carbon default)
bahmni-tokens.scss             →  :root { --cds-button-primary: #007d79 }  (Bahmni — wins)
```

Import order in `index.ts` is therefore critical — `bahmni-tokens.scss` must always come after the Carbon base CSS import.

---

## Core Concepts

### The two types of Carbon SCSS imports

This distinction determines which files need migration in Phases 2–5. CSS custom property overrides only fix **Type 2**:

```scss
// TYPE 1 — Raw Carbon palette (STATIC hex — NOT affected by :root overrides)
@use "@carbon/react/scss/colors" as *;
$blue-60   // compiles to: #0f62fe   ← hardcoded in output CSS, override has no effect
$gray-20   // compiles to: #e0e0e0

// TYPE 2 — Carbon semantic theme tokens (DYNAMIC — affected by :root overrides)
@use "@carbon/react/scss/theme" as *;
$interactive   // compiles to: var(--cds-interactive)   ← picks up override ✅
$focus         // compiles to: var(--cds-focus)
$border-subtle // compiles to: var(--cds-border-subtle)
```

Any file importing `@carbon/react/scss/colors` and using palette tokens (`$blue-60`, `$gray-20`) must be migrated — those compile to static hex and bypass the theming system entirely.

### Why `_palette.scss` is SCSS-only

`_palette.scss` contains only SCSS variables. They produce **zero CSS output** — they compile away completely. The compiled CSS only contains the final `--cds-*` hex values from `bahmni-tokens.scss`. The palette file exists so that one hex change in one place updates every Carbon token that maps to it.

---

## Confirmed Bahmni Colour Overrides

All values confirmed by querying Figma Design System file `K9qOVT8daBnYFI1vOaEmDh`, collection `25984-295101`, nodes `15206:1620` (File Uploader), `4259:103484` (Form Modal), `1854:1776` (Button component).

**Figma variable naming convention:** `Category/token-name` maps directly to `--cds-token-name` (strip category prefix, prepend `--cds-`).

### Overrides — Bahmni value differs from Carbon white theme

| Figma variable | Bahmni hex | Carbon white default | Carbon CSS custom property |
|---|---|---|---|
| `Background/background-brand` | ⚠️ confirm | `#0f62fe` | `--cds-background-brand` |
| `Button/button-primary` | `#007d79` | `#0f62fe` | `--cds-button-primary` |
| `Button/button-primary-hover` | `#006b68` | `#0353e9` | `--cds-button-primary-hover` |
| `Button/button-primary-active` | `#004144` | `#002d9c` | `--cds-button-primary-active` |
| `Button/button-tertiary` | `#007d79` | `#0f62fe` | `--cds-button-tertiary` |
| `Button/button-tertiary-hover` | `#006b68` | `#0353e9` | `--cds-button-tertiary-hover` |
| `Button/button-tertiary-active` | `#007d79` | `#002d9c` | `--cds-button-tertiary-active` |
| `Miscellaneous/interactive` | `#007d79` | `#0f62fe` | `--cds-interactive` |
| `Focus/focus` | `#007d79` | `#0f62fe` | `--cds-focus` |
| `Border/border-interactive` | `#007d79` | `#0f62fe` | `--cds-border-interactive` |

**The entire override palette is 3 hex values:**

| `_palette.scss` variable | Value | Used for |
|---|---|---|
| `$bahmni-brand` | ⚠️ confirm | `background-brand` (header) |
| `$bahmni-teal` | `#007d79` | primary/tertiary buttons, interactive, focus, border-interactive |
| `$bahmni-teal-hover` | `#006b68` | button hover states |
| `$bahmni-teal-active` | `#004144` | button active/pressed state |

### Not overridden — same as Carbon white theme

| Figma variable | Value | Implication |
|---|---|---|
| `Link/link-primary` | `#0f62fe` | Links stay Carbon blue by design |
| `Link/link-primary-hover` | `#0043ce` | Same |
| `Button/button-secondary` | `#393939` | No override needed |
| `Button/button-danger-*` | various | No override needed |
| `Focus/focus-inset` | `#ffffff` | No override needed |
| `Background/background` | `#ffffff` | No override needed |
| `Text/text-primary` | `#161616` | No override needed |
| `Text/text-secondary` | `#525252` | No override needed |
| `Miscellaneous/skeleton-*` | various | No override needed |

> `Background/background-brand` is confirmed as an override in the Figma Variables panel but is not applied to any button or form node. Confirm the hex value from the Variables panel (collection `25984-295101`) and replace `⚠️ confirm` in the files below.

---

## Phase 1 — Token Infrastructure

**Goal:** Create the two new SCSS files and wire them into `bahmni-design-system`. No visual changes elsewhere — this only injects the CSS custom property overrides into the pipeline.

### 1.1 — Create `_palette.scss`

**File to create:** `packages/bahmni-design-system/src/styles/_palette.scss`

```scss
// Bahmni brand palette — SCSS only, zero CSS output
// Source: Figma Design System, file K9qOVT8daBnYFI1vOaEmDh, collection 25984-295101
// Confirmed from Figma nodes: 15206:1620, 4259:103484, 1854:1776
//
// To use in a .module.scss file:
//   @use '@bahmni/design-system/styles/palette' as *;

// ⚠️  Confirm Background/background-brand hex from Figma Variables panel
$bahmni-brand:        #???;    // Background/background-brand — header/nav background

// ✅ Confirmed from Figma
$bahmni-teal:         #007d79; // Button/button-primary, button-tertiary,
                               // Miscellaneous/interactive, Focus/focus, Border/border-interactive
$bahmni-teal-hover:   #006b68; // Button/button-primary-hover, Button/button-tertiary-hover
$bahmni-teal-active:  #004144; // Button/button-primary-active
```

### 1.2 — Create `bahmni-tokens.scss`

**File to create:** `packages/bahmni-design-system/src/styles/bahmni-tokens.scss`

```scss
// Bahmni CSS custom property overrides for Carbon v11
//
// Strategy: CSS custom properties on :root override Carbon's white theme defaults.
// Carbon components use var(--cds-*) internally — no component-level changes needed.
//
// Chosen over SCSS token override because:
//   - Design system agnostic: only variable names couple to Carbon, not the build API
//   - Future-proof: switching design systems = rename variables, not rebuild pipeline
//   - Compatible with runtime theming: applyBahmniTheme() can override further via inline styles
//
// Figma → Carbon mapping: strip "Category/" prefix, prepend "--cds-"
//   e.g. Figma "Button/button-primary" → "--cds-button-primary"
//
// NOT overridden (confirmed same as Carbon white defaults — do not add here):
//   link-primary (#0f62fe), link-primary-hover, button-secondary-*,
//   button-danger-*, focus-inset, background, text-*, icon-*, skeleton-*

@use 'palette' as *;

:root {
  // ── Header / brand ──────────────────────────────────────────────────────
  // Figma: Background/background-brand
  --cds-background-brand:        #{$bahmni-brand};         // ⚠️ confirm hex

  // ── Primary buttons ─────────────────────────────────────────────────────
  // Figma: Button/button-primary, Button/button-primary-hover, Button/button-primary-active
  --cds-button-primary:          #{$bahmni-teal};          // #007d79
  --cds-button-primary-hover:    #{$bahmni-teal-hover};    // #006b68
  --cds-button-primary-active:   #{$bahmni-teal-active};   // #004144

  // ── Tertiary buttons ────────────────────────────────────────────────────
  // Figma: Button/button-tertiary, Button/button-tertiary-hover, Button/button-tertiary-active
  --cds-button-tertiary:         #{$bahmni-teal};          // #007d79
  --cds-button-tertiary-hover:   #{$bahmni-teal-hover};    // #006b68
  --cds-button-tertiary-active:  #{$bahmni-teal};          // #007d79

  // ── Interactive / focus / border ─────────────────────────────────────────
  // Figma: Miscellaneous/interactive, Focus/focus, Border/border-interactive
  --cds-interactive:             #{$bahmni-teal};          // #007d79
  --cds-focus:                   #{$bahmni-teal};          // #007d79
  --cds-border-interactive:      #{$bahmni-teal};          // #007d79
}
```

> **`#{...}` interpolation is required** — without it Sass does not emit the raw hex into a CSS custom property value.

### 1.3 — Wire into `index.ts`

**File to modify:** `packages/bahmni-design-system/src/index.ts`

```ts
// BEFORE
import '@carbon/styles/css/styles.css';

// AFTER — order is critical: Carbon defaults first, Bahmni overrides second
import '@carbon/styles/css/styles.css';      // sets --cds-button-primary: #0f62fe
import './styles/bahmni-tokens.scss';         // sets --cds-button-primary: #007d79 ← wins
```

### 1.4 — Create `index.scss` for Storybook

Storybook uses its own webpack pipeline and imports `../src/styles/index.scss` directly — it does not go through the Vite build or `index.ts`. This file must exist and forward the tokens.

**File to create:** `packages/bahmni-design-system/src/styles/index.scss`

```scss
// SCSS entry point for consumers that bypass the Vite build (e.g. Storybook).
// Forwards the Bahmni token overrides so Storybook renders with Bahmni colours.
@forward './bahmni-tokens';
```

### Definition of Done — Phase 1

- [ ] `packages/bahmni-design-system/src/styles/` contains: `_palette.scss`, `bahmni-tokens.scss`, `index.scss`
- [ ] `$bahmni-brand` hex value filled in from Figma Variables panel
- [ ] `packages/bahmni-design-system/src/index.ts` imports `bahmni-tokens.scss` on line 2
- [ ] `yarn build` exits 0, no SCSS errors
- [ ] **DevTools check:** `distro` dev server → Elements → `:root` → `--cds-button-primary` shows `#007d79` (not `#0f62fe`)
- [ ] `--cds-button-primary-hover` shows `#006b68`, `--cds-button-primary-active` shows `#004144`
- [ ] `--cds-interactive`, `--cds-focus`, `--cds-border-interactive` all show `#007d79`
- [ ] Storybook starts without "Cannot find module `../src/styles/index.scss`" errors

---

## Phase 2 — Migrate Distro App Shell Components

**Goal:** Remove all `@carbon/react/scss/colors` imports and hardcoded hex values from distro component SCSS files. The Phase 1 `:root` override does **not** fix these — they compile to static hex and bypass the CSS custom property system entirely.

### 2.1 — `AppTile.module.scss`

**File:** `distro/src/app/components/AppTile/styles/AppTile.module.scss`

```scss
// BEFORE
@use "@carbon/react/scss/spacing" as *;
@use "@carbon/react/scss/type" as *;
@use "@carbon/react/scss/colors" as *;   // ← TYPE 1: static hex, must migrate

.tile:focus { outline: 2px solid $blue-60; }  // compiles to #0f62fe — bypasses override
.arrow      { color: $blue-60; }

// AFTER
@use "@carbon/react/scss/spacing" as *;
@use "@carbon/react/scss/type" as *;
@use "@carbon/react/scss/theme" as *;    // ← TYPE 2: var(--cds-*) — picks up override ✅

.tile:focus { outline: 2px solid $focus; }         // → var(--cds-focus) → #007d79
.arrow      { color: $interactive; }               // → var(--cds-interactive) → #007d79
```

### 2.2 — `LocationSelector.module.scss`

**File:** `distro/src/app/components/LocationSelector/styles/LocationSelector.module.scss`

- Remove `@use "@carbon/react/scss/colors" as *;` — import exists but no palette tokens are used in rules

### 2.3 — `UserProfileMenu.module.scss`

**File:** `distro/src/app/components/UserProfileMenu/styles/UserProfileMenu.module.scss`

- Remove `@use "@carbon/react/scss/colors" as *;` — import exists but no palette tokens are used in rules

### 2.4 — `HomePageGrid.module.scss`

**File:** `distro/src/app/components/HomePageGrid/styles/HomePageGrid.module.scss`

Hardcoded hex values in skeleton animation bypass theming.

```scss
// BEFORE
.skeletonTile {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
}

// AFTER
@use "@carbon/react/scss/theme" as *;

.skeletonTile {
  background: linear-gradient(
    90deg,
    $skeleton-background 25%,
    $skeleton-element    50%,
    $skeleton-background 75%
  );
}
```

> Verify `$skeleton-background` and `$skeleton-element` exist in `node_modules/@carbon/react/scss/theme/_tokens.scss` for v1.83.0. If absent, use `$layer-01` and `$layer-02` as fallbacks.

### Definition of Done — Phase 2

- [ ] `grep -r "@carbon/react/scss/colors" distro/src` returns nothing
- [ ] `grep -r "#[0-9a-fA-F]" distro/src --include="*.scss"` returns nothing
- [ ] `yarn build` exits 0
- [ ] AppTile focus outline and arrow render in `#007d79`; skeleton animation still visible

---

## Phase 3 — Migrate Design System Molecules

**Goal:** Remove all `@carbon/react/scss/colors` imports from `packages/bahmni-design-system/src/` and replace actual palette token and hardcoded hex usages with TYPE 2 semantic tokens.

### Group A — Dead import removal only

These files import `@carbon/react/scss/colors` but none of their rules reference palette tokens. The sole change for each is removing the `@use "@carbon/react/scss/colors" as *;` line:

| File |
|---|
| `molecules/actionDataTable/styles/ActionDataTable.module.scss` |
| `molecules/sortableDataTable/styles/SortableDataTable.module.scss` |
| `molecules/expandableDataTable/styles/ExpandableDataTable.module.scss` |
| `molecules/fileTile/styles/FileTile.module.scss` |
| `molecules/videoTile/styles/VideoTile.module.scss` |
| `molecules/imageTile/styles/ImageTile.module.scss` |
| `molecules/formCardContainer/styles/FormCardContainer.module.scss` |
| `molecules/boxWHeader/styles/BoxWHeader.module.scss` |
| `molecules/boxWHeader/stories/styles/BoxWHeader.stories.module.scss` |
| `molecules/selectedItem/stories/styles/SelectedItemStories.module.scss` |
| `molecules/textAreaWClose/styles/TextAreaWClose.module.scss` |
| `organisms/header/styles/Header.module.scss` |

### Group B — Actual token migration

**`molecules/actionArea/styles/ActionArea.module.scss`**

| Current | Replace with | Why |
|---|---|---|
| `@use "@carbon/react/scss/colors" as *;` | Remove | — |
| `$gray-20` (border-left, border-top) | `$border-subtle` from `@carbon/react/scss/theme` | Semantic equivalent; compiles to `var(--cds-border-subtle)` |

---

**`molecules/simpleDataTable/styles/SimpleDataTable.module.scss`**

| Current | Replace with | Why |
|---|---|---|
| `@use "@carbon/react/scss/colors" as *;` | Remove | — |
| `background-color: #ffffff` (td) | `background-color: $background` | `@carbon/react/scss/theme` already imported |
| `background-color: #ffffff !important` (th) | `background-color: $background !important` | Same |

---

**`molecules/formCard/styles/FormCard.module.scss`**

| Current | Replace with | Why |
|---|---|---|
| `@use "@carbon/react/scss/colors" as *;` | Remove | — |
| `$red-10` (error background) | `$notification-background-error` from `@carbon/react/scss/theme` | Verify name in `node_modules/@carbon/react/scss/theme/_tokens.scss`; fallback to `$highlight` |

---

**`molecules/videoTile/styles/VideoTile.module.scss`**

| Current | Replace with | Why |
|---|---|---|
| `@use "@carbon/react/scss/colors" as *;` | Remove | — |
| `color: white` (play icon) | `color: $icon-inverse` from `@carbon/react/scss/theme` | Semantic token for light icon on dark background |

### Definition of Done — Phase 3

- [ ] `grep -r "@carbon/react/scss/colors" packages/bahmni-design-system/src --include="*.scss"` returns nothing
- [ ] `grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}\b" packages/bahmni-design-system/src --include="*.scss"` returns nothing
- [ ] `yarn build` exits 0, no undefined SCSS variable errors
- [ ] ActionArea borders still visible; FormCard error state still red; SimpleDataTable cells still white background

---

## Phase 4 — Verify Acceptance Criteria Surfaces

**Goal:** Confirm each AC surface is visually correct in the browser after Phases 1–3. No new code changes expected — this is verification only. If Carbon blue remains on any surface, diagnose and fix before proceeding.

### AC verification matrix

| AC | Surface | CSS custom property | Expected value |
|---|---|---|---|
| AC1 | `CarbonHeader` background | `--cds-background-brand` | Bahmni brand colour (not `#0f62fe`) |
| AC2 | `Button kind="primary"` default | `--cds-button-primary` | `#007d79` |
| AC2 | `Button kind="primary"` hover | `--cds-button-primary-hover` | `#006b68` |
| AC2 | `Button kind="primary"` active | `--cds-button-primary-active` | `#004144` |
| AC2 | `Button kind="tertiary"` default | `--cds-button-tertiary` | `#007d79` |
| AC2 | Focus ring (any focusable element) | `--cds-focus` | `#007d79` |
| AC3 | Interactive border (SideNav, inputs) | `--cds-border-interactive` | `#007d79` |
| AC5 | DevTools `:root` | all 10 `--cds-*` overrides present | Bahmni values, not Carbon blues |
| AC7 | First paint (throttled load) | — | No flash of `#0f62fe` |
| AC9 | Side-by-side with Angular app | — | Primary teal matches |

> **Links are not overridden** — `--cds-link-primary` stays `#0f62fe` (Carbon blue) by design per Figma Variables.

### Diagnosing a surface still showing Carbon blue

1. DevTools → select element → Computed tab → find the colour property
2. Check `:root` for `--cds-button-primary` — should show `#007d79`
3. If `:root` shows the correct value but the element still renders `#0f62fe`: a `@carbon/react/scss/colors` static hex is overriding the custom property in the cascade
4. Find it: `grep -r "\$blue\|\$teal\|\$gray" <path> --include="*.scss"`
5. Migrate using the Group B pattern from Phase 3

### Definition of Done — Phase 4

- [ ] All AC surfaces verified in Chrome DevTools on `distro` dev server
- [ ] `#0f62fe` not visible on any AC surface
- [ ] First paint with network throttling shows no flash

---

## Phase 5 — App-Level Cleanup

**Goal:** Remove dead `@carbon/react/scss/colors` imports from `apps/clinical/` and `apps/registration/`. These files import the module but use no palette tokens in their rules.

### In scope — remove unused import only

| File |
|---|
| `apps/clinical/src/components/forms/investigations/styles/InvestigationsForm.module.scss` |
| `apps/clinical/src/components/forms/investigations/styles/SelectedInvestigationItem.module.scss` |
| `apps/clinical/src/components/forms/medications/styles/MedicationsForm.module.scss` |
| `apps/clinical/src/components/forms/medications/styles/SelectedMedicationItem.module.scss` |
| `apps/clinical/src/components/forms/vaccinations/styles/VaccinationForm.module.scss` |
| `apps/clinical/src/components/forms/vaccinations/styles/SelectedVaccinationItem.module.scss` |
| `apps/clinical/src/components/forms/observations/styles/ObservationForms.module.scss` |
| `apps/clinical/src/components/forms/conditionsAndDiagnoses/styles/ConditionsAndDiagnoses.module.scss` |
| `apps/clinical/src/components/forms/conditionsAndDiagnoses/styles/SelectedDiagnosisItem.module.scss` |
| `apps/clinical/src/components/forms/allergies/styles/SelectedAllergyItem.module.scss` |
| `apps/clinical/src/components/consultationPad/styles/ConsultationPad.module.scss` |
| `apps/clinical/src/components/patientSearch/styles/PatientSearch.module.scss` |
| `apps/clinical/src/components/dashboardContainer/styles/DashboardContainer.module.scss` |
| `apps/clinical/src/components/dashboardSection/styles/DashboardSection.module.scss` |
| `apps/clinical/src/pages/styles/ConsultationPage.module.scss` |
| `apps/registration/src/components/forms/patientRelationships/styles/index.module.scss` |

### Explicitly out of scope — do not modify

| File | Why |
|---|---|
| `apps/registration/src/pages/patientSearchPage/styles/index.module.scss` | Uses `$blue-20`, `$teal-20`, `$yellow-20`, `$green-20`, `$red-20` for appointment status badges — intentional data-viz usage |
| Any file using `$red-20` / `$red-30` | Intentional form validation error colours |

### Definition of Done — Phase 5

- [ ] `grep -r "@carbon/react/scss/colors" apps/ --include="*.scss"` returns only the two intentionally-kept files
- [ ] `yarn build` exits 0
- [ ] `yarn lint` exits 0

---

## Phase 6 — Build Verification and Stylelint Hardening

### 6.1 — Full clean build

```bash
yarn clean && yarn build
```

Dart Sass treats undefined SCSS variables as hard errors — any missed token from Phases 2–5 will fail here with a clear file and line number.

### 6.2 — Stylelint regression prevention (optional)

**File to modify:** `stylelint.config.js`

```js
'color-named': 'never',  // blocks: color: white, background: red
```

Suppress inline for legitimate transparent overlays:

```scss
/* stylelint-disable-next-line color-named */
background: rgba(0, 0, 0, 0.6);
```

### 6.3 — Storybook smoke test

```bash
nx storybook bahmni-design-system
```

Confirm:
- Builds without SCSS import errors
- Header story shows Bahmni brand background
- Primary Button story shows `#007d79` (not `#0f62fe`)
- Button hover renders `#006b68`; active renders `#004144`
- ActionArea story shows teal interactive border

### Definition of Done — Phase 6

- [ ] `yarn clean && yarn build` exits 0
- [ ] `yarn lint` exits 0 across all packages
- [ ] Storybook renders all stories with Bahmni colours

---

## Future Extensibility

### Design system switch

If Bahmni migrates to a different design system (MUI, Chakra, etc.):

- `_palette.scss` — **untouched**. Hex values have no Carbon coupling.
- `bahmni-tokens.scss` — **rename variable names only**. Replace `--cds-*` with the new system's token names (e.g. `--mui-palette-primary-main`). Build pipeline unchanged.
- `applyBahmniTheme()` utility — **untouched**. It is a pure DOM function with no design system dependency.

### Runtime dynamic theming (future Phase 7)

To support operator-specific theme config fetched at startup, keep `bahmni-design-system` free of service calls. The responsibility split is:

```
bahmni-design-system          bahmni-services              distro/main.tsx
─────────────────────         ───────────────              ───────────────
_palette.scss (defaults)      fetchThemeConfig()           import both
bahmni-tokens.scss (CSS)   +  HTTP call only          →   fetchThemeConfig()
applyBahmniTheme() (DOM)      returns plain object           .then(applyBahmniTheme)
No service calls ever         No DOM access                  .catch(() => {})
```

`applyBahmniTheme()` sets inline styles on `document.documentElement` — inline styles have higher specificity than any stylesheet rule and cleanly override the static defaults from `bahmni-tokens.scss`:

```ts
// packages/bahmni-design-system/src/utils/applyTheme.ts
export interface BahmniThemeConfig {
  'background-brand'?:       string
  'button-primary'?:         string
  'button-primary-hover'?:   string
  'button-primary-active'?:  string
  'button-tertiary'?:        string
  'button-tertiary-hover'?:  string
  'button-tertiary-active'?: string
  'interactive'?:            string
  'focus'?:                  string
  'border-interactive'?:     string
}

export function applyBahmniTheme(config: Partial<BahmniThemeConfig>): void {
  Object.entries(config).forEach(([token, value]) => {
    document.documentElement.style.setProperty(`--cds-${token}`, value)
  })
}
```

```ts
// packages/bahmni-services/src/themeService.ts
import type { BahmniThemeConfig } from '@bahmni/design-system'

export async function fetchThemeConfig(): Promise<Partial<BahmniThemeConfig>> {
  const res = await fetch('/bahmni-theme.config.json')
  if (!res.ok) return {}    // empty → static defaults in bahmni-tokens.scss remain
  return res.json()
}
```

Static defaults from `bahmni-tokens.scss` act as the guaranteed fallback if the fetch fails or no config is present, satisfying AC1 (no config file needed).

---

## File Change Summary

| Phase | Action | File |
|---|---|---|
| Pre-work | Confirm hex value | Figma Variables panel — `Background/background-brand` |
| 1 | **Create** | `packages/bahmni-design-system/src/styles/_palette.scss` |
| 1 | **Create** | `packages/bahmni-design-system/src/styles/bahmni-tokens.scss` |
| 1 | **Create** | `packages/bahmni-design-system/src/styles/index.scss` |
| 1 | **Modify** | `packages/bahmni-design-system/src/index.ts` |
| 2 | **Modify** | `distro/src/app/components/AppTile/styles/AppTile.module.scss` |
| 2 | **Modify** | `distro/src/app/components/LocationSelector/styles/LocationSelector.module.scss` |
| 2 | **Modify** | `distro/src/app/components/UserProfileMenu/styles/UserProfileMenu.module.scss` |
| 2 | **Modify** | `distro/src/app/components/HomePageGrid/styles/HomePageGrid.module.scss` |
| 3 | **Modify** (Group A × 12) | `molecules/` and `organisms/` SCSS files — remove dead import |
| 3 | **Modify** | `molecules/actionArea/styles/ActionArea.module.scss` |
| 3 | **Modify** | `molecules/simpleDataTable/styles/SimpleDataTable.module.scss` |
| 3 | **Modify** | `molecules/formCard/styles/FormCard.module.scss` |
| 3 | **Modify** | `molecules/videoTile/styles/VideoTile.module.scss` |
| 4 | No code changes | DevTools + visual verification |
| 5 | **Modify** (× 16) | `apps/clinical/` and `apps/registration/` — remove dead import |
| 6 | **Modify** (optional) | `stylelint.config.js` |
| Future 7 | **Create** | `packages/bahmni-design-system/src/utils/applyTheme.ts` |
| Future 7 | **Create** | `packages/bahmni-services/src/themeService.ts` |
| Future 7 | **Modify** | `distro/src/main.tsx` — two-line wiring |

**Current scope total: 3 new files, ~37 modified files across 6 phases**
