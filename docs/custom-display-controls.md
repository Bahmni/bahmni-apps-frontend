# Custom Display Controls – Authoring Guide

## Overview

Custom display controls let an implementation add its **own dashboard widgets** to the
Bahmni clinical dashboard without forking the frontend. A control is just a React component
that receives the standard `WidgetProps` contract — the same contract built-in widgets such as
`AllergiesTable` use — and renders inside a dashboard section.

There are **two** ways to ship a custom control. Pick the one that matches how you deploy:

| You… | Recommended path | Separate repo? | Runtime URL load? | Section |
|---|---|---|---|---|
| **Build your own distro** (e.g. IOM) | Build-time `registerWidget` | No | No | [Path A](#path-a--build-time-registration-own-distro) |
| **Consume a prebuilt Bahmni distro** and cannot rebuild it | Runtime `type: 'custom'` + `config.url` | Yes | Yes | [Path B](#path-b--runtime-drop-in-prebuilt-distro) |
| Own distro, but want controls deployable independently of your distro release | Either (Path B optional) | Optional | Optional | both |

Both paths render through the same `WidgetProps` contract, so the control component itself is
identical — only the **registration/loading** mechanism differs.

---

## The `WidgetProps` contract

Every control — built-in or custom, either path — is a `React.FC<WidgetProps>`:

```ts
export interface WidgetProps {
  config?: Record<string, unknown>; // per-control config from the dashboard JSON
  episodeOfCareUuids?: string[];
  encounterUuids?: string[];
  visitUuids?: string[];
  onEditClick?: () => void;
  disableActions?: boolean;
}
```

Exported from `@bahmni/widgets`. Inside a control you may use the host's hooks and services
(`usePatientUUID`, `useTranslation`, data fetchers, the design system, `@tanstack/react-query`),
exactly as built-in widgets do.

---

## Path A — Build-time registration (own distro)

If you build your own distro you author the control **inside your own monorepo/repo** (e.g. your
own `@your-org/widgets` package) and register it during distro bootstrap. It compiles straight
into your distro bundle: **no separate repo, no hosted JS, no `window.BahmniControls`, no CSP
concerns, and full type safety.**

### 1. Write the control

```tsx
// e.g. in your own widgets package
import type { WidgetProps } from '@bahmni/widgets';

const MyVitalsPlus: React.FC<WidgetProps> = (props) => {
  /* ... use @bahmni hooks/services freely ... */
  return <div>{/* ... */}</div>;
};

export default MyVitalsPlus;
```

### 2. Register it during bootstrap

```ts
// your distro's main.tsx, or a registerControls.ts imported by it
import { lazy } from 'react';
import { registerWidget } from '@bahmni/widgets';

registerWidget({
  type: 'myVitalsPlus',
  component: lazy(() => import('./MyVitalsPlus')),
});
```

### 3. Reference it in the dashboard config

```jsonc
{ "type": "myVitalsPlus", "config": { /* anything your control reads from props.config */ } }
```

`DashboardSection` looks up `getWidget('myVitalsPlus')` and renders your component with
`WidgetProps`.

> **Singleton requirement (important).** Build-time registration only works if there is exactly
> **one** `@bahmni/widgets` instance across the published-package boundary — otherwise
> `registerWidget` writes to one registry while `DashboardSection.getWidget` reads another and your
> control never appears. The published apps (`@bahmni/clinical-app`, `@bahmni/registration-app`,
> `@bahmni/appointments-app`, `@bahmni/home-app`) externalize `@bahmni/widgets`,
> `@bahmni/services`, and `@bahmni/design-system` (see each app's `vite.config.ts` `external`
> list), so a composed distro dedupes them to single instances. If a control's hooks throw
> "invalid hook call" or a registered control never renders, suspect a duplicate `@bahmni/widgets`
> in `node_modules`.

---

## Path B — Runtime drop-in (prebuilt distro)

If you consume a prebuilt distro you cannot call `registerWidget` at build time. Instead, ship the
control as a **separately-built ESM bundle**, host it on your config server, and reference its URL
from the dashboard config. The host's built-in `type: 'custom'` widget loads it at runtime.

```jsonc
// default export
{ "type": "custom", "config": { "url": "/custom/vitalsPlus.js" } }

// named export (one bundle can export many controls; config.name selects which)
{ "type": "custom", "config": { "url": "/custom/controls.js", "name": "patientSummary" } }
```

The host:
1. validates `url` (same-origin only — see [Security](#security));
2. `import(url)` the ESM bundle (native dynamic import, memoized per `url+name`);
3. selects the export (`config.name` → named export; omitted → default export);
4. renders it inside `<Suspense>`, wrapped in a scoped error boundary so a failing control never
   takes down the rest of the dashboard.

### Authoring kit

A runnable starter lives at **`custom-control-starter/`** (intended to be extracted to its own
repo). It is preconfigured with the Vite preset below and a verified `PatientSummary` example.
Clone it, write your control, `yarn build`, host the output, and wire the URL into the config.

### Shared dependencies — the SDK global

External bundles must **not** bundle their own React/design-system/services — that would create a
second React instance and break hooks/context. Instead, shared deps are provided as singletons on
`window.BahmniControls` and the bundle's bare imports are rewritten to read off that global at
build time.

The host installs the global during bootstrap via a one-liner exported from `@bahmni/widgets`:

```ts
import { installControlsSdk } from '@bahmni/widgets';
installControlsSdk(window); // synchronous, before any control loads
```

`window.BahmniControls` exposes (typed as `BahmniControlsSdk`, exported from `@bahmni/widgets`):

| Key | Module |
|---|---|
| `React` | `react` |
| `ReactDOM` | `react-dom` |
| `jsxRuntime` | `react/jsx-runtime` |
| `reactQuery` | `@tanstack/react-query` |
| `reactI18next` | `react-i18next` |
| `designSystem` | `@bahmni/design-system` |
| `services` | `@bahmni/services` |
| `widgets` | `@bahmni/widgets` |

Because `installControlsSdk` lives in `@bahmni/widgets` and imports these (externalized) packages,
the exposed modules are the **running app's deduped instances**, so a custom control's `useState`,
React Query cache, i18n, and design-system theme all match the host.

### The Vite preset

```ts
// vite.config.ts (in the control repo)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import externalGlobals from 'rollup-plugin-external-globals';
import cssInjectedByJs from 'vite-plugin-css-injected-by-js';

const SHARED = {
  'react': 'BahmniControls.React',
  'react-dom': 'BahmniControls.ReactDOM',
  'react/jsx-runtime': 'BahmniControls.jsxRuntime',
  '@tanstack/react-query': 'BahmniControls.reactQuery',
  'react-i18next': 'BahmniControls.reactI18next',
  '@bahmni/design-system': 'BahmniControls.designSystem',
  '@bahmni/services': 'BahmniControls.services',
  '@bahmni/widgets': 'BahmniControls.widgets',
};

export default defineConfig({
  plugins: [react(), cssInjectedByJs()],
  build: {
    lib: { entry: 'src/index.tsx', formats: ['es'], fileName: () => 'controls.js' },
    rollupOptions: {
      external: Object.keys(SHARED),
      plugins: [externalGlobals(SHARED)],
    },
  },
});
```

- **Must be ESM** (`formats: ['es']`) — native `import(url)` only loads ES modules; UMD/IIFE is
  rejected by the host loader.
- `externalGlobals` rewrites `import { X } from '<shared>'` → `window.BahmniControls.*.X`, so you
  keep writing idiomatic imports and nothing shared is bundled.
- `cssInjectedByJs` inlines any of your own CSS into the single JS file (the host won't fetch a
  sibling `style.css`).

### Example control

```tsx
// src/PatientSummary.tsx
import type { WidgetProps } from '@bahmni/widgets';
import { usePatientUUID } from '@bahmni/widgets';
import { getFormattedPatientById, useTranslation } from '@bahmni/services';
import { Tile, SimpleDataTable } from '@bahmni/design-system';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

const PatientSummary: React.FC<WidgetProps> = () => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const { data, isLoading, error } = useQuery({
    queryKey: ['customPatientSummary', patientUuid],
    enabled: !!patientUuid,
    queryFn: () => getFormattedPatientById(patientUuid!),
  });

  if (!patientUuid) return <Tile>{t('NO_PATIENT')}</Tile>;
  if (isLoading) return <Tile>{t('LOADING')}</Tile>;
  if (error || !data) return <Tile>{t('FAILED_TO_LOAD')}</Tile>;

  const headers = [{ key: 'label', header: '' }, { key: 'value', header: '' }];
  const rows = [
    { id: 'name', label: t('NAME'), value: data.fullName ?? '-' },
    { id: 'gender', label: t('GENDER'), value: data.gender ?? '-' },
    { id: 'dob', label: t('BIRTH_DATE'), value: data.birthDate ?? '-' },
  ];
  return <SimpleDataTable headers={headers} rows={rows} ariaLabel={t('PATIENT_SUMMARY')} />;
};

export default PatientSummary;
```

```tsx
// src/index.tsx — each export name is selectable via config.name
export { default as patientSummary } from './PatientSummary';
```

### Steps for implementers

1. `yarn install` (gets `@bahmni/*` types as dev deps).
2. Write a control as `React.FC<WidgetProps>`; export it (named) from `src/index.tsx`.
3. `yarn build` → `dist/controls.js`. Confirm React/Carbon are **not** bundled.
4. Host `controls.js` on the config server, **same origin** as the app.
5. Reference it:
   `{ "type": "custom", "config": { "url": "/custom/controls.js", "name": "patientSummary" } }`.

---

## Security

The trust model is **trusted, admin-deployed code — no sandboxing**. `import(url)` executes remote
code with full host privileges, so:

- **Same-origin only.** The loader validates `config.url`: it must resolve to the app's own origin
  over `http(s)`. Cross-origin or non-`http(s)` URLs are rejected with an error tile and **no
  network request**.
- **Admin-controlled config + bundles.** Dashboard configs and hosted bundles must be
  admin-controlled (same trust as the config that already decides what renders); never
  end-user-influenceable.
- **Recommend a strict CSP** at deployment: `script-src 'self' <config-origin>` (the design needs
  **no** `'unsafe-eval'`), plus `connect-src` to bound exfiltration.
- **The error boundary is not a security boundary** — it contains crashes, not malice. Untrusted
  third-party controls would require an `<iframe sandbox>` / Web Worker re-architecture, which is
  out of scope.

---

## Reference

- `WidgetProps`, `BahmniControlsSdk`, `installControlsSdk`, `registerWidget`, `getWidget`,
  `usePatientUUID` — all exported from `@bahmni/widgets`.
- Host loader + error boundary — `packages/bahmni-widgets/src/custom/`.
- Built-in `custom` widget registration — `packages/bahmni-widgets/src/registry/widgetMap.ts`.
- Starter template — `custom-control-starter/`.
