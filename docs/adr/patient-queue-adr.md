# ADR: Patient Queues in bahmni-apps-frontend

<!-- prettier-ignore -->
|  |  |
|---|---|
| **Status** | Proposed |
| **Jira** | BAH-5258 (parent BAH-5068; informs BAH-5069 and BAH-5256) |
| **Date** | 2026-11-10 |

## Context

The legacy Angular "Patient Queue" page is one shared module (`common/patient-search`) used by six apps: clinical, adt, ipd, ot, document-upload and orders. Each tab is an `org.bahmni.patient.search` entry in the app's `extension.json`. Opening a tab runs `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<query>&location_uuid=..&provider_uuid=..`; clicking a patient opens `forwardUrl`.

The React apps already have the tab framework: a list page, `searchView` (one tab per extension), and a widget registry (`registerSearchWidget` / `getSearchWidget`) with two widgets, `defaultSearch` and `commonSearch`. What is missing is a widget for SQL-backed queue tabs.

**Naming trap:** in v2, `extensionParams.searchHandler` names the **widget** (`defaultSearch`, `commonSearch`). In legacy it named the **SQL query**. We keep the v2 meaning and move the SQL name to a new key, `sqlHandler`.

## Decisions

1. **One `patientQueue` widget** in `@bahmni/widgets`, registered in the existing registry. Every app uses it; apps differ only by config.
2. **Table view first; the `view` key is reserved.** `extensionParams.view` is optional and defaults to `table`, the only view built now. `tile` and `custom` (the other legacy views) are added later, once BAH-5256 gives the design. Adding them changes no existing config.
3. **Columns are declared in config**, never derived from the first row (legacy did that).
4. **Sort, filter and pagination are client-side** using the existing `DataTable`. The SQL endpoint has no paging.
5. **Navigation uses its own small URL resolver**, not `formatUrl` (which returns `.../undefined` for missing values and does not encode).
6. **No backend change.**

## 1. Config mapping (legacy to v2)

<!-- prettier-ignore -->
| Legacy key | v2 | Status | Why |
|---|---|---|---|
| `id` | `id` | Kept | Unchanged |
| `extensionPointId` | `org.bahmni.<app>.v2.search` | Changed | One slot per app, as clinical and registration do |
| `translationKey` (in `extensionParams`) | `translationKey` (extension level) | Moved | v2 schema requires it there |
| `label` | - | Dropped | Only a legacy fallback for the tab name; `translationKey` is required |
| `type` | - | Dropped | Always `config`; not read by v2 |
| `display` | - | Dropped | Only a legacy fallback for the tab name (used by one orders tab) |
| `order` | `extensionParams.order` | Moved | Where action extensions keep it; needs sorting (C2) |
| `requiredPrivilege` | `requiredPrivileges` (array) | Changed | v2 already filters on this |
| `searchHandler` (SQL name) | `sqlHandler` | Renamed | See naming trap |
| `view` = `tabular` | `view: "table"` (the default) | Kept | Built now |
| `view` = `tile` | `view: "tile"` | Later | Needs the BAH-5256 design; until then these tabs show as tables |
| `view` = `custom` | `view: "custom"` | Later | v2 will load a registered React view by name |
| `templateUrl` | `view: "custom"` (the registered view) | Later | Angular template; goes with the custom view |
| `refreshTime` | `refreshTime` | Kept | Seconds; 0 or absent = no refresh |
| `additionalParams` | `additionalParams` (string) | Kept | Passed through unchanged |
| `forwardUrl` | `forwardUrl` | Kept | Same `{{placeholder}}` syntax; must be an absolute path or URL |
| `forwardUrl` on an _All_ tab (no `searchHandler`) | `patientDetailUrl` in the `defaultSearch` config file | Moved | See the _All_ tab link note in section 2 |
| `links` | column `link: true` (+ column `forwardUrl`, `newTab`) | Changed | One link mechanism per column |
| `linkColumn` | column `link: true` | Changed | Same per-column mechanism |
| `searchColumns` | - | Dropped | Global search now matches all visible columns |
| `targetedTab` | - | Deferred | `newTab` covers the common case |
| `showPrint` | - | Deferred | Legacy prints an Angular template; no shipped config uses it |
| `printHtmlLocation` | - | Deferred | Goes with `showPrint` |
| `forwardButtonTitle` | - | Dropped | Legacy never read it |
| `tabularViewHeadingOrder` | column order in `columns` | Dropped | Never read; order is now declared |

App-level `app.json` keys (`ignoredTabularViewHeadings`, `identifierHeadings`, `patientSearch.*`) are replaced by declared columns and client-side filtering.

## 2. Config contract

**Tabs** go in `clinical/v2/app.json` under `extensions`. `configUrl` points at a shared presentation file.

```json
[
  {
    "id": "bahmni.clinical.v2.search.active",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_ACTIVE",
    "requiredPrivileges": ["app:clinical"],
    "extensionParams": {
      "order": 1,
      "searchHandler": "patientQueue",
      "sqlHandler": "emrapi.sqlSearch.activePatients",
      "refreshTime": 30,
      "forwardUrl": "/bahmni-v2/clinical/{{patientUuid}}",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueueConfig.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.all",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_ALL",
    "requiredPrivileges": ["app:clinical"],
    "extensionParams": {
      "order": 2,
      "searchHandler": "defaultSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/defaultSearchConfig.json"
    }
  }
]
```

**Presentation file** (`patientQueueConfig.json`). A column `key` is the SQL column alias:

```json
{
  "pageSize": 10,
  "enableGlobalSearch": true,
  "columns": [
    {
      "key": "identifier",
      "translationKey": "PATIENT_QUEUE_COLUMN_IDENTIFIER",
      "link": true,
      "enableSort": true,
      "sortOrder": "asc"
    },
    {
      "key": "name",
      "translationKey": "PATIENT_QUEUE_COLUMN_NAME",
      "link": true,
      "enableSort": true,
      "filterType": "text"
    }
  ]
}
```

**_All_ tab link.** `defaultSearch` links to `/registration/patient/{{patientUuid}}` unless its config file sets `patientDetailUrl`. BAH-5069 requires the clinical queue to open the consultation, so clinical's `defaultSearchConfig.json` must contain `{ "patientDetailUrl": "/bahmni-v2/clinical/{{patientUuid}}" }`.

Column options reuse `commonSearch` names: `translationKey`, `enableSort`, `sortOrder`, `filterType` (`text`, `select`, `dateRange`, `numeric`), `transform` (`formatDate`, `formatTime`, `formatDateTime`). Link options: `link`, `forwardUrl` (overrides the tab's), `newTab`.

**Schema change.** The clinical schema already accepts every key above (`extensions` and `extensionParams` allow extra properties). The only change is typing `order`:

```diff
--- a/apps/clinical/src/providers/clinicalConfig/schema.json
+++ b/apps/clinical/src/providers/clinicalConfig/schema.json
@@ -262,7 +262,8 @@
             "additionalProperties": true,
             "properties": {
               "searchHandler": { "type": "string" },
-              "configUrl": { "type": "string" }
+              "configUrl": { "type": "string" },
+              "order": { "type": "number" }
             }
           }
         }
```

**Why the app schema stays loose:** a validation failure there breaks the whole clinical app. The widget validates its own params and file (Ajv, as `getConfig` does), so one bad tab shows an error in that tab only. Widget rules: `sqlHandler` and `configUrl` required; `view` must be `table` for now; `forwardUrl` must start with `/` (not `//`) or `http(s)://`; `refreshTime` >= 0; `columns` has at least one entry; unknown keys are rejected.

## 3. Widget contract

`SearchWidgetProps` gives a widget its `extensionParams`. To add a widget:

1. Create the component in `packages/bahmni-widgets/src/search/<name>/`. If it has a config file, validate it with `getConfig(configUrl, schema)`.
2. Register it in `<name>/index.ts`: `registerSearchWidget({ key: '<name>', component: Widget })`, and import that folder from `search/index.ts` so it loads.
3. Add an extension to the app's `v2/app.json` with `extensionParams.searchHandler: "<name>"`.
4. Add the tab label and all widget text keys to each app's `public/locales/locale_en.json`.
5. Set `requiredPrivileges` on the extension. Tabs the user cannot access are hidden.
6. Test it by registering it in a test, as `searchView/__tests__/index.test.tsx` does, and call `clearSearchWidgetRegistry()` afterwards.

The queue widget lives in `packages/bahmni-widgets/src/search/patientQueue/` and calls a new `fetchPatientQueue()` in `@bahmni/services`.

## 4. Table, columns, sorting, pagination

- **Table first** (BAH-5069: "no tile/card grid"). `view` defaults to `table`; `tile` (avatar, bed icon, `iconAttribute` icon) and `custom` are added later without changing existing configs.
- **Columns:** declared in the presentation file, rendered in that order with translated headers.
- **Sorting:** per column (`enableSort`). With no initial sort, rows keep server order. Empty values sort last, as BAH-5069 requires. The current `DataTable` puts them first when ascending, so it needs a small opt-in fix (C1).
- **Filtering:** `DataTable` global search across all visible columns, plus optional per-column filters.
- **Pagination:** client-side over the full response; default page size 10, set by `pageSize`.
- **One row per patient** is the SQL query's job. The widget does not de-duplicate.
- **Links:** `{{placeholders}}` resolve from the row (`patientUuid` is `uuid`, `visitUuid` is `activeVisitUuid`, anything else is a column of the same name), then from the page's query string (document upload needs `encounterType`, `topLevelConcept`). Values are URL-encoded. If a value is missing, the cell is plain text. A URL starting with `/bahmni-v2/` navigates inside the app (the router already adds that prefix, so the widget strips it); any other URL is a full page load.

## 5. Reusability

- **Where:** widget in `@bahmni/widgets`, service in `@bahmni/services`. `searchView` is copied in clinical and registration today; it moves to `@bahmni/widgets` as one shared tabs component. Each app keeps its own list-page header.
- **To use the queue in another app:**
  1. Add the extension point `org.bahmni.<app>.v2.search` and render the shared tabs for it.
  2. Add queue extensions and a presentation file to the app's `v2/app.json`.
  3. Allow `sqlHandler`, `refreshTime`, `forwardUrl` and `order` in that app's config schema. Registration's schema rejects them today.
  4. Add the translation keys.
- **Document upload** works the same way, with a `forwardUrl` like `/bahmni-v2/patient-documents/{{patientUuid}}?encounterType={{encounterType}}&topLevelConcept={{topLevelConcept}}`.
- **Out of scope:** the legacy `:configName` switch (Programs tile), the Notifications micro-frontend tab, and the ADT Ward List tab. Each would be its own widget.

## 6. Backend scope

**No change needed.**

<!-- prettier-ignore -->
| Purpose | Request |
|---|---|
| Queue | `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<sqlHandler>&v=full&location_uuid=..&provider_uuid=..` |
| _All_ tab | `GET /openmrs/ws/rest/v1/bahmni/search/patient/lucene?...` (existing `defaultSearch`) |

- `location_uuid` (from the `bahmni.user.location` cookie) is required. `provider_uuid` is required by provider-scoped queries (from the active practitioner).
- An unknown query or a missing required parameter returns **HTTP 500 with an HTML body**; unauthenticated returns 401 JSON (the shared client redirects to login). The service must show a generic translated error, never the body.
- The SQL text is readable at `GET .../bahmnicore/sql/globalproperty?property=<sqlHandler>`, so config authors can look up column aliases.

## Changes needed alongside

<!-- prettier-ignore -->
| # | Change |
|---|---|
| C1 | `DataTable`: opt-in "empty values last" sorting |
| C2 | Add `order` to `SearchExtensionParam`; sort tabs by it (missing = 0, ties keep file order) |
| C3 | Optional `isActive` prop on `SearchWidgetProps`, set by the shared tabs component |
| C4 | Extract `searchView` to `@bahmni/widgets` |
| C5 | Add tabs, presentation file, `defaultSearchConfig.json` and locale keys to `standard-config` and `clinic-config` |

## Consequences and risks

- New queue tabs, in any app, become a config edit.
- **Hidden tabs still load.** Carbon mounts every tab panel at start, so each queue tab fetches immediately and refreshes on its own timer, as legacy did. Legacy also re-fetched when a tab was selected; C3 lets the widget do the same, so a hidden tab does not go stale. Tabs with the same query, location and provider share one request.
- **Page resets on refresh.** `DataTable` returns to page 1 when its rows change. React Query keeps the same rows when data is unchanged, so this only happens on real changes.
- **Value types:** SQL returns `hasBeenAdmitted` as the string `"true"`/`"false"`; the _All_ search returns a boolean. Handle both if it is ever used.
- Links to legacy Angular pages cause a full page load until those apps migrate.
- **ADT _To Acknowledge_** uses `emrapi.sqlSearch.toAcknowledgeNotes`, which `standard-config` defines in `gp_ipd.xml` (it returns every column its `forwardUrl` needs). It is empty on environments that have not loaded the IPD global properties, so that tab shows nothing there.

## Alternatives rejected
i hope 
<!-- prettier-ignore -->
| Alternative | Why |
|---|---|
| All queue config inline in the extension | Columns would repeat on every tab |
| Reuse `commonSearch` / `ResultsTable` | JSONata is overkill for flat rows; it stores `-` in data, breaking empty-last sort |
| `SortableDataTable` | No filtering, which BAH-5069 requires |
| Server-side pagination | The SQL endpoint has no paging; needs a backend change |
| Build tile and custom views now | No design yet (BAH-5256); `view` is reserved for later |
