# Approach: BAH-4634 — Bahmni Default Colour Token System

**JIRA**: BAH-4634

---

## Problem

Bahmni uses Carbon Design System v11. Carbon's default colours (blue buttons, blue links, blue focus rings) needed to be replaced with Bahmni teal (`#007d79`) globally across all apps — without touching individual components.

The previous approach used a global `bahmni-tokens.scss` and `bahmni-header.scss` loaded as side-effect imports from `index.ts`. This was fragile: styles were scattered, duplicated across files, and not accessible to runtime theming.

---

## Chosen Approach — Runtime `<style>` Tag Override via `applyTheme.ts`

### Why Not `document.documentElement.style.setProperty()`

The obvious approach — setting CSS custom properties on `:root` — does not work with Carbon v11:

```typescript
// This does NOT work
document.documentElement.style.setProperty('--cds-button-primary', '#007d79');
```

Carbon v11 defines its tokens on **class selectors** (`.cds--white`, `.cds--g10`), not solely on `:root`. Inline styles on `:root` have lower specificity than class-level declarations, so Carbon's class rules win.

### Why a `<style>` Tag Works

Appending a `<style>` tag to `<head>` after Carbon's CSS wins via **last-definition cascade**. By targeting the same selectors Carbon uses, the override has equal specificity but loads later:

```css
/* What applyBahmniTheme() writes to the DOM */
:root,
.cds--white,
.cds--g10 {
  --cds-background-brand: #007d79;
  --cds-button-primary:   #007d79;
  --cds-interactive:      #007d79;
  /* ... all 18 tokens */
}
```

### `applyTheme.ts` — Single Source of Truth

All Bahmni colour configuration lives in one file:

**`BahmniThemeConfig`** — interface of the 18 Carbon tokens Bahmni overrides:

| Token group | Tokens |
|-------------|--------|
| Brand | `background-brand`, `text-inverse`, `icon-inverse` |
| Primary button | `button-primary`, `button-primary-hover`, `button-primary-active` |
| Tertiary button | `button-tertiary`, `button-tertiary-hover`, `button-tertiary-active` |
| Interactive | `interactive`, `focus`, `border-interactive` |
| Links | `link-primary`, `link-primary-hover`, `link-secondary`, `link-visited`, `link-inverse-visited` |
| Layout | `layer-01` |

**`BAHMNI_DEFAULT_THEME`** — Bahmni's teal values, applied synchronously on first paint so there is no flash of Carbon blue before the app renders.

**`applyBahmniTheme(config)`** — builds the CSS rules and writes them to a single `<style id="bahmni-theme">` tag. The tag is reused on subsequent calls to avoid duplication.

### How `main.tsx` Wires It

```typescript
// 1. Apply defaults immediately — first paint shows Bahmni teal
applyBahmniTheme(BAHMNI_DEFAULT_THEME);

// 2. (BAH-4635) Fetch runtime overrides from standard-config and merge
fetchThemeConfig()
  .then((overrides) => applyBahmniTheme({ ...BAHMNI_DEFAULT_THEME, ...overrides }))
  .catch(() => {});
```

### Header Styling Strategy

Carbon's `<Header>` has no built-in support for brand-coloured backgrounds. Two header components exist:

- **`HeaderWSideNav`** (app pages) — uses `Header.module.scss` which applies `:global` overrides scoped to `.cds--header` for background, text, icons, breadcrumb, and side-nav icons.
- **`HomePageHeader`** (home page) — standalone component that does not load `Header.module.scss`, so it carries its own `:global` overrides in `HomePageHeader.module.scss`.

All overrides use `$text-inverse`, `$icon-inverse`, and `rgba(0,0,0,0.15)` for hover — values that work on any brand colour, not hardcoded to teal.

---

## Why This Approach

| Concern | Decision |
|---------|----------|
| Token override mechanism | `<style>` tag — only way to override Carbon v11 class-level token declarations |
| Single source of truth | `applyTheme.ts` in `@bahmni/design-system` — one place for the interface, defaults, and the apply function |
| Runtime theming | `applyBahmniTheme()` can be called multiple times (defaults first, config overrides second) without side effects |
| No flash of unstyled content | `applyBahmniTheme(BAHMNI_DEFAULT_THEME)` runs synchronously before `ReactDOM.render()` |
