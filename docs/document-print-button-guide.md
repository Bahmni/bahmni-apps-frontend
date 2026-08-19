# DocumentPrintButton Widget Guide

This guide covers how to use the `DocumentPrintButton` widget from `@bahmni/widgets` to add print functionality to any Bahmni frontend page.

## Overview

`DocumentPrintButton` is a reusable React component that:

- Accepts a pre-configured list of print options (template IDs + translation keys) via props
- Renders as a single ghost button (one option) or a tertiary button + dropdown (multiple options)
- On click, POSTs to the template render service to get server-rendered HTML, injects it into a hidden iframe, waits for all images to load, then calls `window.print()`
- Returns `null` automatically when no print options are configured — no extra guard needed on the caller side

## Architecture

```
App config JSON
  └── printOptions: [{ translationKey, templateId }]
        │
        ▼
  DocumentPrintButton (receives printOptions as prop)
        │
        └── usePrintDocument (internal hook)
              │
              └── POST /bahmnicore/template/api/render
                    ↓ { html: string }
                    hidden iframe → window.print()
```

The widget itself does **not** fetch any template list on mount. Template options come entirely from the app's configuration JSON.

## Quick Start

### 1. Import the component

```tsx
import { DocumentPrintButton, type PrintOption } from '@bahmni/widgets';
```

### 2. Add print options to your app config

In your app's configuration JSON (e.g., `clinicalConfig.json`):

```json
{
  "printOptions": [
    {
      "translationKey": "PRINT_PRESCRIPTION",
      "templateId": "PRESCRIPTION_V1"
    }
  ]
}
```

### 3. Use the component

```tsx
<DocumentPrintButton
  printOptions={printOptions}
  renderContext={{ patientUUID, visitUuid }}
  data-testid="print-prescription"
/>
```

## Props Reference

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `printOptions` | `PrintOption[]` | No | `[]` | List of print options. Renders nothing when empty or undefined. |
| `renderContext` | `Record<string, string>` | Yes | — | Key-value context forwarded to the template render API. Common keys: `patientUUID`, `visitUuid`, `encounterUuid`. |
| `renderData` | `Record<string, unknown>` | No | `undefined` | Additional arbitrary data sent to the render API under the `data` field. Use for structured payloads that don't fit as string key-value pairs. |
| `getRenderData` | `(templateId: string) => Promise<Record<string, unknown>>` | No | `undefined` | Async alternative to `renderData`, resolved per click with the selected `templateId`. Takes precedence over `renderData` when provided. |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'lg'` (dropdown) | Button size passed directly to Carbon `Button` / `Dropdown`. |
| `disabled` | `boolean` | No | `undefined` | Disables the button / dropdown. |
| `iconOnly` | `boolean` | No | `undefined` | Renders a printer `IconButton` (single option) or `OverflowMenu` (multiple) instead of a text button. |
| `iconLabel` | `string` | No | — | Accessible label used in `iconOnly` mode. |
| `data-testid` | `string` | No | — | Test ID applied to the primary action button. |

### `PrintOption` type

```typescript
interface PrintOption {
  translationKey: string;  // i18n key resolved via useTranslation()
  templateId: string;      // ID sent to the render API
  shortcutKey?: string;    // Reserved — not yet wired to keyboard handling
  privileges?: string[];   // Consuming app filters on these via hasPrivilege()
}
```

`PrintOption` is exported from `@bahmni/widgets` alongside the component.

The widget does **not** filter on `privileges` itself — the consuming app is responsible for that, so it can keep the check next to its own config loading. See the clinical and registration examples below.

## Rendering Behaviour

| `printOptions` length | Renders (default) | Renders (`iconOnly`) |
|---|---|---|
| 0 (or undefined) | Nothing (`null`) | Nothing (`null`) |
| 1 | `<Button>` labelled with `t(printOptions[0].translationKey)` | Printer `<IconButton>` |
| 2 or more | `<ComboButton>` — primary action is the first option, remaining options as `<MenuItem>`s | Printer `<OverflowMenu>` listing every option |

When multiple options are present, clicking the primary action always uses the first option (`printOptions[0]`). The menu lists `printOptions[1..n]` and clicking any item prints with that template. In `iconOnly` mode with multiple options the overflow menu lists **all** options, including the first.

During the fetch + print sequence, the button is replaced by a Carbon `<InlineLoading>` spinner labelled with the `PRINT_MODAL_PREPARING_DOCUMENT` translation key. This key must exist in the **consuming app's** i18n files — it is resolved in the app's namespace, not the widget's.

## Print Mechanism

1. User clicks the button or selects a dropdown item.
2. `usePrintDocument` sets `triggered = true`, enabling the React Query fetch.
3. `POST /bahmnicore/template/api/render` is called with `{ templateId, format: "html", locale, context, data? }`.
4. A full-size, `opacity: 0` iframe is appended to `document.body` (full-size so Chrome loads embedded images and CSS).
5. The returned HTML is written into the iframe document.
6. All `<img>` elements are inspected. Incomplete images have `load`/`error` listeners attached.
7. Once all images settle (or after a 10-second timeout), `iframe.contentWindow.print()` is called.
8. The iframe is removed and the loading state is reset.

If the render API call fails, `notificationService.showError()` is called with the formatted error title and message. `isPrinting` resets to `false` — no broken state is left.

## App Config Integration

Both the **clinical** and **registration** apps support `printOptions` in their config.

### Type definition

Both apps import `PrintOption` from `@bahmni/widgets` and add it to their config model:

```typescript
import type { PrintOption } from '@bahmni/widgets';

export interface ClinicalConfig {
  // ... other fields
  printOptions?: PrintOption[];
}
```

### JSON schema (clinical / registration)

```json
"printOptions": {
  "type": "array",
  "description": "List of print options shown in the print button",
  "items": {
    "type": "object",
    "required": ["translationKey", "templateId"],
    "additionalProperties": false,
    "properties": {
      "translationKey": { "type": "string" },
      "templateId": { "type": "string" },
      "privileges": {
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}
```

Both config schemas set `"additionalProperties": false` at the root, so this block is **mandatory** — a config containing `printOptions` without a matching schema entry fails validation, and the app's entire config fails to load.

## Real-World Example

### Clinical app — patient header

```tsx
// apps/clinical/src/components/patientHeader/PatientHeader.tsx

const { clinicalConfig } = useClinicalConfig();
const printOptions: PrintOption[] = clinicalConfig?.printOptions ?? [];

const renderContext: Record<string, string> = {
  ...(patientUUID && { patientUUID }),
  ...(visitUuid && { visitUuid }),
};

<DocumentPrintButton
  printOptions={printOptions}
  renderContext={renderContext}
  data-testid="print-clinical-card"
  size="md"
/>
```

The `?? []` fallback ensures the component renders nothing when `printOptions` is not configured.

Privilege filtering lives in the page (`apps/clinical/src/pages/ConsultationPage.tsx`), not the widget:

```tsx
const filteredPrintOptions = useMemo(() => {
  if (!currentDashboard?.printOptions || !userPrivileges) return [];
  return currentDashboard.printOptions.filter((option) =>
    hasPrivilege(userPrivileges, option.privileges),
  );
}, [currentDashboard, userPrivileges]);
```

### Registration app — registration footer

```tsx
// apps/registration/src/pages/PatientRegister/PatientRegister.tsx

const { registrationConfig } = useRegistrationConfig();
const { userPrivileges } = useUserPrivilege();

const filteredPrintOptions = useMemo<PrintOption[]>(() => {
  if (!registrationConfig?.printOptions || !userPrivileges) return [];
  return registrationConfig.printOptions.filter((option) =>
    hasPrivilege(userPrivileges, option.privileges),
  );
}, [registrationConfig, userPrivileges]);

{patientUuid && (
  <DocumentPrintButton
    printOptions={filteredPrintOptions}
    renderContext={{ patientUuid, patientUUID: patientUuid }}
    disabled={isSaving}
    data-testid="print-registration-card"
  />
)}
```

Two things worth copying from this example:

- The `patientUuid &&` guard keeps the button hidden until the patient exists, since a render call without a patient UUID cannot resolve.
- `renderContext` sends **both** `patientUuid` and `patientUUID`. Existing templates are inconsistent: `registration-card` expects `patientUuid`, while `prescriptions` and the clinical app use `patientUUID`. Check the template's `data-config.json` for the exact spelling it interpolates, or send both.

Note that `hasPrivilege` returns `false` when the user's privilege list is empty, even for an option that declares no `privileges`.

## Adding a New Print Option

### Step 1 — Register the template in the config repository

Templates live under `print-templates/` in the config repository (`standard-config`, `clinic-config`, …), and are served to the template service via `TEMPLATES_DIR`.

Each template is a folder, registered in the top-level `print-templates/templates.json` manifest:

```json
{
  "templates": [
    { "id": "REG_CARD_V1",     "name": "Registration Card", "folder": "registration-card" },
    { "id": "PRESCRIPTION_V1", "name": "Prescription",      "folder": "prescriptions" }
  ]
}
```

The `id` here is what you reference as `templateId` in your app config. The folder itself contains:

| File | Purpose |
|---|---|
| `data-config.json` | Declares the `sources` to fetch (FHIR or REST), interpolating `{{contextKey}}` placeholders |
| `compute.js` | Exports `compute()`, flattening the fetched sources into template fields (FHIRPath available) |
| `template.html` | The markup, typically extending `_base/portrait.html` or `_base/landscape.html` |
| `styles.css` | Optional — styles may also be inlined via a `{% block styles %}` |

Shared translations live in `print-templates/_i18n/<lang>.json` (e.g. `en.json`, `es.json`) and are resolved with the `| t` filter. Note these are **separate** from the app's i18n files.

Because templates are read server-side per request, editing them needs no frontend rebuild — only a page reload.

### Step 2 — Add the option to your app config JSON

```json
{
  "printOptions": [
    {
      "translationKey": "PRINT_PRESCRIPTION",
      "templateId": "PRESCRIPTION_V1"
    }
  ]
}
```

### Step 3 — Add the translation key

Add the translation key to your app's i18n files:

```json
{
  "PRINT_PRESCRIPTION": "Print Prescription"
}
```

### Step 4 — Pass the right context keys

The `renderContext` object is forwarded verbatim as the `context` field in the render request. Check the template's `data-config.json` to see which context keys it expects.

Common context keys:

| Key | When to use |
|---|---|
| `patientUUID` | All patient-scoped templates |
| `visitUuid` | Visit-scoped templates |
| `encounterUuid` | Encounter-specific templates |
| `visitType` | When output varies by visit type |

## Backend API Reference

### POST `/openmrs/ws/rest/v1/bahmnicore/template/api/render`

Called on each button click. `staleTime: 0` and `gcTime: 0` — always fetches fresh data, never cached.

**Request body:**

```json
{
  "templateId": "PRESCRIPTION_V1",
  "format": "html",
  "locale": "en",
  "context": {
    "patientUUID": "abc-123",
    "visitUuid": "def-456"
  },
  "data": {}
}
```

The `locale` is resolved automatically from `getUserPreferredLocale()`. The `data` field is only included when `renderData` prop is provided.

**Response:**

```json
{
  "html": "<html>...</html>"
}
```

The `html` field is extracted by `renderAsHtml()` in `@bahmni/services` and returned as a string to the component.

### GET `/openmrs/ws/rest/v1/bahmnicore/template/api/templates`

This endpoint exists in `@bahmni/services` (`getTemplates()`) but is **not** called by `DocumentPrintButton`. It is available for use in other contexts where you need to enumerate available templates.
