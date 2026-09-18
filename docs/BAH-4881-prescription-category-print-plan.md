# Feature: Category-Based Print Option Selection (PRESCRIPTION)

**Epic**: BAH-4879 — Print Prescription / Encounter Summary
**Story**: BAH-4881
**Branch**: `BAH-4879`
**Status**: Implemented and merged into this branch (4 commits: `Initial changes`, `Model changes`, `Changes for prescription category`, `Changes for date format as per AC`)

> This document describes the feature **as built**, not as originally planned — a few details (heading text, date format, category typing, error handling) changed during implementation. See [Deviations from the original plan](#deviations-from-the-original-plan) at the bottom if you're comparing against an earlier design doc.

---

## 1. What problem this solves

Before this change, the print button only ever printed **one thing**: whatever `templateId` was wired to a print option, using whatever data was already on the page. For prescriptions specifically, that meant "print the *latest* medication" — one click, no choice.

That's not good enough for prescriptions, because a prescription is legally/contextually tied to **one specific encounter/visit**, and a patient can have several:

- Visit 1: doctor orders investigations (no medications yet)
- Visit 2 (after results come back): doctor prescribes medication

If a clinician wants to reprint the prescription from Visit 2 specifically, "print latest" isn't enough — they need to pick *which* visit's prescription to print.

## 2. What the feature actually does

A print option (a button/menu-item in the print widget) can now optionally be tagged with `"category": "PRESCRIPTION"` in config.

- **Print options with no `category`** → behave exactly like before. Click → print immediately. Nothing changed for these.
- **Print options with `category: "PRESCRIPTION"`** → click opens a **modal** listing the patient's encounters (most recent first). The clinician picks one, and the same template is printed with that encounter's UUID (`encounterUuid`) merged into the print context — so the template can render data scoped to that specific visit.

Two other small additions apply to **every** print (categorized or not):
- `providerUuid` — the UUID of the currently logged-in practitioner
- `locationUuid` — the UUID of the user's login location

Both are merged into the print context automatically, so templates can use them without any config change.

## 3. User flow (example)

1. Clinician opens a patient's chart and clicks the "Print Prescription" button.
2. Because that print option is configured with `category: "PRESCRIPTION"`, a modal opens: **"Select encounter for prescription print"**.
3. The modal shows a loading spinner ("Loading encounters…") while it fetches the patient's encounters.
4. Once loaded, each encounter is shown as a row:
   ```
   Consultation                              <- bold, encounter type
   15-Aug-2024 2:30 PM | Dr. Super Man       <- date, time, provider
   ```
   sorted newest-first.
5. Clinician clicks a row (or focuses it with Tab and presses Enter/Space) → modal closes, and the prescription template prints with `encounterUuid` set to that encounter's ID.
6. If the clinician clicks the X instead → modal closes, nothing prints.
7. If the patient has no encounters → the modal shows "No encounters found" instead of a list.
8. If fetching encounters fails (network error, etc.) → the modal shows "Unable to load encounters. Please try again."

## 4. How to turn this on for a print option (config example)

`printOptions` already existed in config (per-dashboard, under `dashboards[].printOptions` in clinical config, or at the root in registration config). The only new thing is the optional `category` field — everything else about a print option is unchanged.

**Before** (existing "print latest medication" behavior — still works exactly like this if you don't add `category`):
```json
{
  "printOptions": [
    {
      "translationKey": "PRINT_PRESCRIPTION",
      "templateId": "prescription-template"
    }
  ]
}
```

**After** (opts this one option into the encounter-picker flow):
```json
{
  "printOptions": [
    {
      "translationKey": "PRINT_PRESCRIPTION",
      "templateId": "prescription-template",
      "category": "PRESCRIPTION"
    }
  ]
}
```

That's it — no other config changes needed. A dashboard can mix categorized and non-categorized print options in the same list; each behaves independently.

Config schema locations (where `category` is now a valid field):
- `apps/clinical/src/providers/clinicalConfig/schema.json` — inside `dashboards[].printOptions.items.properties`
- `apps/registration/src/providers/registrationConfig/schema.json` — inside root `printOptions.items.properties`

`"category"` is a plain string field (not restricted to an enum in the schema) — but at runtime only `"PRESCRIPTION"` is recognized (see [Unrecognized category](#unrecognized-category) below). Only clinical locales got the new modal strings, since only clinical dashboards realistically have encounter context; registration config technically accepts `category` too but nothing wires it up with the right strings today.

**Important — this is plumbing, not yet switched on anywhere.** There is no checked-in default/sample config in this repo with `printOptions` populated at all (it's admin-configured per deployment, not shipped as a static JSON file here). So as of this branch, **no real config actually sets `"category": "PRESCRIPTION"` yet** — the picker registry and dispatch logic are fully implemented, but activating this for real users requires an admin/implementer to add the `category` field to an actual deployed `printOptions` entry, as shown above.

Where `DocumentPrintButton` (and therefore this config) is actually consumed today:
- `apps/registration/src/pages/PatientRegister/PatientRegister.tsx` — registration card printing, `renderContext={{ patientUuid, patientUUID: patientUuid }}`
- `apps/clinical/src/pages/ConsultationPage.tsx` → `apps/clinical/src/components/patientHeader/PatientHeader.tsx` — clinical dashboard printing; `printOptions` comes from `currentDashboard.printOptions`, filtered by `hasPrivilege(userPrivileges, option.privileges)`

Either of those `printOptions` arrays is where you'd add `"category": "PRESCRIPTION"` to a real print option to light this feature up in a live app.

## 5. Architecture — how it fits together

```
packages/bahmni-widgets/src/documentPrintButton/
  DocumentPrintButton.tsx                     # the print button/menu itself
  printOptionHandlers.ts                      # decides: print immediately vs. open a picker
  CategorySelectionModal.tsx                  # the generic "pick one, then print" modal
  categoryPickers/
    types.ts                                  # shared types + the category -> picker registry
    prescriptionEncounterPicker.ts            # the PRESCRIPTION-specific picker logic
  styles/CategorySelectionModal.module.scss   # modal + row styling
```

The key design idea: **`DocumentPrintButton` never has an `if (category === 'PRESCRIPTION')` anywhere.** Every click goes through the same generic path:

```
click → getHandlerFor(option) → either:
  a) directPrintHandler   → print immediately (today's existing behavior)
  b) categoryPickerHandler → open CategorySelectionModal, wait for a selection, then print
```

This means adding a *second* category in the future (e.g. `LAB_REPORT`) only requires writing one more "picker" object — no changes to `DocumentPrintButton.tsx` or the modal.

### 5.1 `categoryPickers/types.ts` — the contract

```ts
export interface PrintOption {
  translationKey: string;
  templateId: string;
  shortcutKey?: string;
  privileges?: string[];
  category?: string;          // NEW — optional; absent = old behavior
}

export interface PrintPayload {
  context: Record<string, string>;
  data?: Record<string, unknown>;
}

export interface CategoryPicker<TItem> {
  heading: string;                     // i18n key for the modal title
  emptyStateMessage: string;           // i18n key shown when there are 0 items
  fetchItems: (context: Record<string, string>) => Promise<TItem[]>;
  getItemKey: (item: TItem) => string; // React key + test id per row
  renderItem: (item: TItem, t: (key: string) => string) =>
    { primary: string; secondary?: string };
  resolveSelection: (item: TItem, context: Record<string, string>) => PrintPayload;
}

// The registry — this is the ONLY place a new category gets "plugged in"
export const categoryPickers: Record<string, CategoryPicker<unknown> | undefined> = {
  PRESCRIPTION: prescriptionEncounterPicker,
};
```

Why `renderItem` returns plain `{primary, secondary}` strings instead of JSX: it keeps a picker's logic framework-agnostic and testable with plain Jest (no React Testing Library needed) — the modal owns all the actual markup, so every category's rows look and behave consistently for free.

### 5.2 `categoryPickers/prescriptionEncounterPicker.ts` — the PRESCRIPTION picker

This is the concrete, working example for `PRESCRIPTION`. If you ever add a new category, this file is the template to copy.

```ts
import { DEFAULT_TIME_FORMAT, formatDateTime, getPatientEncounters } from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import type { CategoryPicker } from './types';

const ENCOUNTER_DATE_TIME_FORMAT = `dd-MMM-yyyy ${DEFAULT_TIME_FORMAT}`; // "dd-MMM-yyyy h:mm a"

function encounterLabel(encounter: Encounter): string {
  return (
    encounter.type?.[0]?.coding?.[0]?.display ??   // 1st choice: coded display
    encounter.type?.[0]?.text ??                   // 2nd: free text
    encounter.class?.display ??                    // 3rd: encounter class
    encounter.id ??                                // last resort: raw id
    ''
  );
}

export const prescriptionEncounterPicker: CategoryPicker<Encounter> = {
  heading: 'SELECT_ENCOUNTER_FOR_PRESCRIPTION_PRINT',
  emptyStateMessage: 'NO_ENCOUNTERS_FOUND',

  fetchItems: async (context) => {
    const patientUUID = context.patientUUID ?? context.patientUuid; // both casings, defensively
    if (!patientUUID) return [];

    const encounters = await getPatientEncounters(patientUUID);
    return [...encounters].sort((a, b) =>
      (b.period?.start ?? '').localeCompare(a.period?.start ?? ''),  // newest first
    );
  },

  getItemKey: (encounter) => encounter.id ?? '',

  renderItem: (encounter, t) => {
    const start = encounter.period?.start;
    const providerName = encounter.participant?.[0]?.individual?.display;
    const dateTime = start
      ? formatDateTime(start, t, true, ENCOUNTER_DATE_TIME_FORMAT).formattedResult
      : '';
    return {
      primary: encounterLabel(encounter),
      secondary: [dateTime, providerName].filter(Boolean).join(' | '),
    };
  },

  resolveSelection: (encounter, context) => ({
    context: { ...context, encounterUuid: encounter.id ?? '' },
    data: { encounter },
  }),
};
```

Behavior worth knowing:
- **No patient identifier → empty list, no API call.** `fetchItems` returns `[]` immediately if neither `patientUUID` nor `patientUuid` is present on the render context.
- **`getPatientEncounters` fetches *all* encounters for the patient**, paginated internally (100 at a time) from the FHIR API — there is no server-side filtering by encounter type or "has a prescription." Every encounter the patient has is shown; the clinician relies on the type/date/provider labels to pick the right one.
- **No visit-type filtering.** An earlier iteration tried filtering out "visit"-tagged FHIR resources, but that was deliberately removed — a visit tag can't reliably tell you whether an encounter is prescription-relevant (e.g. a discharge note carries no such tag either). The team's decision: "start simple, show everything."
- **Date format is fixed**: `dd-MMM-yyyy h:mm a` (e.g. `15-Aug-2024 2:30 PM`), built from the shared `DEFAULT_TIME_FORMAT` constant (`'h:mm a'`) rather than hard-coded, so it stays in sync if that constant ever changes.
- **Provider name is appended only if present** — `"15-Aug-2024 2:30 PM | Dr. Super Man"` vs. just `"15-Aug-2024 2:30 PM"` if no participant is recorded.
- **`resolveSelection` doesn't mutate the input context** — it returns a new object with `encounterUuid` added, leaving the caller's `context` untouched.

### 5.3 `printOptionHandlers.ts` — deciding what a click does

```ts
export async function printTemplate(
  option: PrintOption,
  renderContext: Record<string, string>,
  ctx: PrintTemplateContext,
  extraData?: Record<string, unknown>,
): Promise<void> {
  ctx.setIsPrinting(true);
  const baseData = ctx.getRenderData ? await ctx.getRenderData(option.templateId) : ctx.renderData;
  const data = extraData ? { ...baseData, ...extraData } : baseData;
  try {
    const html = await renderAsHtml({ templateId: option.templateId, format: 'html', locale: getUserPreferredLocale(), context: renderContext, data });
    await printViaIframe(html);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
  } finally {
    ctx.setIsPrinting(false);
  }
}

export const directPrintHandler: PrintOptionHandler = {
  trigger: (option, ctx) => void printTemplate(option, ctx.renderContext, ctx),
};

export const categoryPickerHandler = (picker: CategoryPicker<unknown>): PrintOptionHandler => ({
  trigger: (option, ctx) => ctx.openPicker(picker, option),
});

export function getHandlerFor(option: PrintOption): PrintOptionHandler {
  if (!option.category) return directPrintHandler;
  const picker = categoryPickers[option.category];
  return picker ? categoryPickerHandler(picker) : unrecognizedCategoryHandler(option.category);
}
```

`printTemplate` is exactly the print logic that already existed (render → print via hidden iframe → catch/notify on error → reset spinner) — it was pulled out of `DocumentPrintButton.tsx` unchanged so both the direct-print path and the "print after picking from modal" path share one implementation.

#### Unrecognized category

If config sets `"category": "SOMETHING_NOT_REGISTERED"`, clicking that option shows an error notification: `"Print Error" / "Unrecognized print category: SOMETHING_NOT_REGISTERED"` instead of silently doing nothing or crashing. Known limitation: this message is hard-coded in English, not run through i18n — acceptable for now since it's a config-mistake message aimed at implementers, not clinicians.

### 5.4 `CategorySelectionModal.tsx` — the generic picker modal

One modal component, reusable for any future category — it knows nothing about "prescriptions" or "encounters" specifically, only about the generic `CategoryPicker<TItem>` contract.

- Fetches items via `picker.fetchItems(context)` in a `useEffect` when the modal opens (guards against setting state after unmount/close with a `cancelled` flag).
- Renders one of four states: loading spinner, error message, empty-state message, or the item list.
- Each row is a Carbon `ClickableTile` with:
  - `role="button"` and an `aria-label` built from `[primary, secondary].filter(Boolean).join(', ')` (e.g. `"Consultation, 15-Aug-2024 2:30 PM | Dr. Super Man"`) — for screen readers.
  - `onKeyDown` that selects the row on **Enter or Space** (Space also calls `preventDefault()` so it doesn't scroll the modal body). This was added deliberately because Carbon's `ClickableTile` does not select-on-keypress out of the box — verified by reading Carbon's own `Tile.js` source to confirm a caller-supplied `onKeyDown` actually fires.
  - Click still works exactly like before (`onClick={() => onSelect(item)}`).
- `Escape` closes the modal via Carbon's built-in `Modal` `onRequestClose` — no custom handling needed.
- Passive modal (no built-in OK/Cancel footer) — only the X close button, matching the "click a row to act" pattern.

### 5.5 `DocumentPrintButton.tsx` — wiring it into the button

```ts
const { practitioner } = useActivePractitioner();
const [userLocation] = useState<UserLocation | null>(() => {
  try { return getUserLoginLocation(); } catch { return null; }
});

const enrichedContext: Record<string, string> = {
  ...renderContext,
  ...(practitioner?.uuid && { providerUuid: practitioner.uuid }),
  ...(userLocation?.uuid && { locationUuid: userLocation.uuid }),
};

const handleTrigger = (option: PrintOption) => {
  getHandlerFor(option).trigger(option, {
    renderContext: enrichedContext,
    renderData, getRenderData, setIsPrinting,
    openPicker: (picker, selectedOption) => setActivePicker({ picker, option: selectedOption }),
  });
};

const handlePickerSelect = (item: unknown) => {
  if (!activePicker) return;
  const { picker, option } = activePicker;
  const { context, data } = picker.resolveSelection(item, enrichedContext);
  setActivePicker(null);
  void printTemplate(option, context, { renderData, getRenderData, setIsPrinting }, data);
};
```

Every existing click handler (`Button`, `ComboButton`/`MenuItem`, `IconButton`, `OverflowMenuItem`) was switched from calling the old inline `handlePrint` to calling `handleTrigger` — same rendering paths, same UI, just a different function underneath.

Note: `useActivePractitioner()` is now called unconditionally, so this component requires an `ActivePractitionerProvider` ancestor. Both `apps/clinical` and `apps/registration` already mount this at the app root, so real usage is unaffected.

## 6. New i18n keys (clinical locales only)

Added to `apps/clinical/public/locales/locale_en.json` / `locale_es.json`:

| Key | English | Used for |
|---|---|---|
| `SELECT_ENCOUNTER_FOR_PRESCRIPTION_PRINT` | "Select encounter for prescription print" | Modal heading |
| `NO_ENCOUNTERS_FOUND` | "No encounters found" | Empty state |
| `PRINT_MODAL_LOADING_ENCOUNTERS` | "Loading encounters…" | Loading state |
| `PRINT_MODAL_FETCH_ENCOUNTERS_ERROR` | "Unable to load encounters. Please try again." | Error state |

(An earlier heading key, `SELECT_PRESCRIPTION_TO_PRINT`, was used briefly during development and fully replaced — no remaining references to it anywhere in the repo.)

## 7. How to add a brand-new category

This is the whole point of the `CategoryPicker` design: adding another category (e.g. a hypothetical `LAB_REPORT`, picking a lab order instead of an encounter) should **never** require touching `DocumentPrintButton.tsx`, `CategorySelectionModal.tsx`, or `printOptionHandlers.ts` — those three files are already generic. Everything is additive.

**Step 1 — write the picker.** Create a new file, e.g. `categoryPickers/labReportPicker.ts`, implementing the same `CategoryPicker<TItem>` contract as `prescriptionEncounterPicker.ts` (see section 5.2 for the full worked example):

```ts
import type { CategoryPicker } from './types';
import type { LabOrder } from '@bahmni/services'; // whatever type fits your item

export const labReportPicker: CategoryPicker<LabOrder> = {
  heading: 'SELECT_LAB_ORDER_FOR_REPORT_PRINT',   // new i18n key (step 3)
  emptyStateMessage: 'NO_LAB_ORDERS_FOUND',        // new i18n key (step 3)

  fetchItems: async (context) => {
    const patientUUID = context.patientUUID ?? context.patientUuid;
    if (!patientUUID) return [];
    return getPatientLabOrders(patientUUID); // whatever service call fetches your items
  },

  getItemKey: (order) => order.id ?? '',

  renderItem: (order, t) => ({
    primary: order.testName,
    secondary: order.resultDate ? formatDateTime(order.resultDate, t, true) : undefined,
  }),

  resolveSelection: (order, context) => ({
    context: { ...context, labOrderUuid: order.id ?? '' },
    data: { labOrder: order },
  }),
};
```

**Step 2 — register it.** Add one line to the `categoryPickers` map in `categoryPickers/types.ts`:

```ts
export const categoryPickers: Record<string, CategoryPicker<unknown> | undefined> = {
  PRESCRIPTION: prescriptionEncounterPicker,
  LAB_REPORT: labReportPicker,   // <- new
};
```

That single line is what makes `getHandlerFor` in `printOptionHandlers.ts` route any print option with `"category": "LAB_REPORT"` into this new picker instead of showing "Unrecognized print category."

**Step 3 — add its i18n keys.** Add the picker's `heading` and `emptyStateMessage` keys to the relevant locale files (e.g. `apps/clinical/public/locales/locale_en.json`, `locale_es.json`, ...). You can reuse the existing `PRINT_MODAL_LOADING_ENCOUNTERS`/`PRINT_MODAL_FETCH_ENCOUNTERS_ERROR` keys if the generic wording ("Loading…", "Unable to load. Please try again.") fits, or add category-specific ones if not — the modal always looks up `picker.heading` / `picker.emptyStateMessage` dynamically, so nothing else needs to change.

**Step 4 — (optional) tighten config validation.** The schema's `category` field is currently a plain, unrestricted string (see section 4) — any typo silently falls through to the runtime "Unrecognized print category" error rather than failing config validation. If you want typos caught earlier, add an `enum` to both schema files listing every registered category:
```json
"category": { "type": "string", "enum": ["PRESCRIPTION", "LAB_REPORT"] }
```

**Step 5 — turn it on.** Set `"category": "LAB_REPORT"` on whichever print option(s) should use it, in the actual deployed clinical/registration config (see section 4).

Nothing else changes: the modal, the click routing, the ambient `providerUuid`/`locationUuid` context enrichment, and the print-after-select flow are all already shared infrastructure.

## 8. How to manually verify this in a running app

1. In a local clinical config, add `"category": "PRESCRIPTION"` to an existing print option's entry (see [section 4](#4-how-to-turn-this-on-for-a-print-option-config-example)).
2. Open a patient with more than one encounter, click the print option.
3. Confirm: modal opens titled "Select encounter for prescription print", lists encounters newest-first, each row shows type (bold) + `dd-MMM-yyyy h:mm a` + provider (if any).
4. Click a row → modal closes, print preview/iframe fires, and (via browser dev tools network tab) the `/render` call's `context` includes `encounterUuid` matching the row you picked.
5. Click the X instead → modal closes, nothing prints.
6. Open a patient with zero encounters → modal shows "No encounters found".
7. Confirm an **uncategorized** print option on the same dashboard still prints immediately with no modal — this must be completely unaffected.

## 9. Known limitations / follow-ups (not done, intentionally out of scope)

1. If `getRenderData` rejects, the print spinner (`isPrinting`) can get stuck on — pre-existing bug from before this feature, not introduced by it, not fixed here.
2. `unrecognizedCategoryHandler`'s error message is hard-coded English, not i18n'd.
3. No generic "selectable row" atom exists in the design system — this feature works around that by adding `role="button"`/`aria-label`/`onKeyDown` directly onto Carbon's `ClickableTile`. Worth revisiting if a second category picker is added.
4. Registration config schema technically accepts `category` (for consistency with clinical), but registration locales have no matching modal strings and no registration flow sets `category: "PRESCRIPTION"` today — registration has no encounter context to pick from.
5. Only `PRESCRIPTION` is registered in `categoryPickers` today — see [section 7](#7-how-to-add-a-brand-new-category) for how to add another.

## Deviations from the original plan

For anyone comparing this to an earlier design/plan doc for this same story, here's what actually shipped differently:

- **`category` is a plain `string`, not a `'PRESCRIPTION'` literal union.** The original plan proposed `PrintOptionCategory = 'PRESCRIPTION'` and an `enum` restriction in the JSON schema. What's actually in the code is `category?: string`, matched at runtime against the `categoryPickers` registry, with an explicit `unrecognizedCategoryHandler` for anything unregistered (originally the plan just silently fell back to direct-print for unrecognized categories — that changed to a visible error instead).
- **Modal heading text changed** from `SELECT_PRESCRIPTION_TO_PRINT` ("Select prescription to print") to `SELECT_ENCOUNTER_FOR_PRESCRIPTION_PRINT` ("Select encounter for prescription print"), per later stakeholder feedback on the JIRA ticket.
- **Visit-type filtering was added, then removed.** An interim version filtered out FHIR resources tagged as "visit" so only child encounters showed. This was deliberately reverted — see section 5.2 above — because the tag isn't a reliable signal for "has a prescription."
- **Explicit date/time format added.** The original plan called `formatDateTime(start, t, true)` (auto format). The shipped version passes an explicit 4th argument, `` `dd-MMM-yyyy ${DEFAULT_TIME_FORMAT}` ``, to guarantee the exact display format regardless of locale/browser settings.
- **Row bold styling and keyboard/accessibility support** (`role="button"`, `aria-label`, Enter/Space-to-select) were added after the initial implementation, closing gaps found during acceptance-criteria review — see `.itemPrimary` in the SCSS file and `onKeyDown` in `CategorySelectionModal.tsx`.
- **`PrintPayload` shape.** `resolveSelection` returns `{ context, data }` (a `data.encounter` payload alongside the context) rather than just a flat context object as in the original plan — this lets a picker pass the full selected item back to the print call, not just derived context keys.
