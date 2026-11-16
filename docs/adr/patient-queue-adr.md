# ADR: Patient Queues in bahmni-apps-frontend

<!-- prettier-ignore -->
|  |  |
|---|---|
| **Status** | Proposed |
| **Jira** | BAH-5258 (parent BAH-5068; informs BAH-5069 and BAH-5256) |
| **Scope** | Clinical app first; the widget and service are reusable by other apps |

## Context

The legacy Angular "Patient Queue" page is one shared module (`common/patient-search`) used by six apps: clinical, adt, ipd, ot, document-upload and orders. Each tab is an `org.bahmni.patient.search` entry in the app's `extension.json`; shared settings sit in `app.json`. Opening a tab runs `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<query>&location_uuid=..&provider_uuid=..`; clicking a patient opens `forwardUrl`.

The clinical React app already has the tab framework: a list page that reads `extensions[]` from `clinical/v2/app.json`, `searchView` (one tab per extension), a widget registry with `defaultSearch` and `commonSearch`, `DataTable`, and `getConfig` for validated config. What is missing is a widget for SQL-backed queue tabs, and the tabs config in `clinical/v2/app.json`, which has no `extensions` yet.

**Goal:** a v2 config that supports **everything the legacy config supported**, with the same key names wherever possible, so a legacy tab moves over almost as a copy-paste. Parity is measured against what the legacy code reads (15 `extensionParams` keys, 6 `app.json` keys), not only against the shipped samples, because implementers' own configs may use any of them.

## Decisions

1. **One `patientQueue` widget** in `@bahmni/widgets`, registered in the existing registry. Apps differ only by config; clinical goes first.
2. **Config is fully equivalent to legacy.** Every key the legacy code reads is supported with the same name. Only the SQL key is renamed (`searchHandler` to `sqlHandler`).
3. **No `searchHandler`.** `extensionPointId` decides whether an entry is a tab; `extensionParams` decides the widget: `view: custom` runs a registered custom view, otherwise a `sqlHandler` runs the queue widget, and no or an empty `sqlHandler` falls back to the default search. A query the backend rejects shows an error in that tab (open point 1).
4. **`view` supports `table`, `tile` and `custom`.** Table is built first; tile (needs the BAH-5256 design) and custom follow. Config written today keeps working: an unbuilt view renders as a table.
5. **Columns are declared** in a presentation file (preferred). A legacy-compatible mode derives them from the first row, as legacy did, so legacy configs migrate unchanged.
6. **Sort, filter and pagination run in the browser** with `DataTable`, because the SQL endpoint has no sort or paging. Legacy rules are kept: every column sortable, empty values last, filter on `searchColumns`.
7. **Safe link resolver.** `forwardUrl` keeps the `{{placeholder}}` syntax; missing values never produce a broken URL (the existing `formatUrl` returns `.../undefined`).
8. **No backend change.** The frontend never builds or edits SQL; it sends only the query name.

## 1. Config mapping (legacy to v2)

Where we looked: the legacy code, `standard-config` and `clinic-config` (38 queue entries across 7 apps), the standard Bahmni environment, a local Bahmni, and the Bahmni wiki (`extension.json` and `Bahmni App Configuration` pages). One row per legacy key. **Same** means the same name and meaning.

<!-- prettier-ignore -->
| Legacy key | v2 | Status | Notes |
|---|---|---|---|
| `id` | `id` | Same | Unique per tab |
| `extensionPointId` | `org.bahmni.<app>.v2.search` | Changed | Clinical's is `org.bahmni.clinical.v2.search` |
| `type` | - | Not carried | Always `config`; the slot decides the kind of UI |
| `label`, `display` | `translationKey` | Moved | Legacy fallback text; put it in the locale file |
| `translationKey` (in `extensionParams`) | `translationKey` (tab level) | Moved | |
| `order` | `order` (tab level) | Same | A tab property read by the page, not by the widget |
| `requiredPrivilege`, `requiredPrivileges` | `requiredPrivileges` (array) | Changed | The user needs at least one; legacy read only the singular key |
| `searchHandler` (SQL name) | `sqlHandler` | Renamed | None or empty means default search |
| `view` | `view` | Same | `table`, `tile`, `custom`; legacy default was `tile` |
| `templateUrl` | `customView` | Renamed | Name of a registered React view, with `view: custom` |
| `forwardUrl` | `forwardUrl` | Same | Absolute path or URL |
| `links` | `links` | Same | Per-column link; `url` may be a string or a map keyed by the cell value; `newTab` |
| `linkColumn` | `linkColumn` | Same | |
| `targetedTab` | `targetedTab` | Same | Opens the named window; the legacy title and reload step is not carried |
| `searchColumns` | `searchColumns` | Same | Restricts the filter box to these columns; default identifier and name |
| `refreshTime` | `refreshTime` | Same | Seconds; 0 or absent means no refresh |
| `additionalParams` | `additionalParams` | Same | A string or an object; an object is sent as JSON, as Angular did |
| `showPrint` | `showPrint` | Same | Prints the table |
| `printHtmlLocation` | `printView` | Renamed | A registered print view replaces the Angular template (later) |
| `extension-<name>.json` | `configName` | New | Tab sets such as Programs; the list page route is open point 4 |
| `forwardButtonTitle`, `tabularViewHeadingOrder`, `searchParams` | - | Not carried | Never read by the legacy code |
| `ignoredTabularViewHeadings` (app.json) | same key, in the presentation file | Same | Row fields hidden when columns are derived from the first row |
| `identifierHeadings` (app.json) | same key, in the presentation file | Same | Columns shown as links to the patient (default `identifier`) |
| `iconAttribute` (app.json) | same key, in the presentation file | Same | Extra icon beside the name when a row attribute equals `attrValue` |
| `preferExtraIdInSearchResults` (app.json) | same key, in the presentation file | Same | Tile view shows the extra identifier instead of `identifier` |
| `patientSearch.*` (app.json) | same keys, in the presentation file | Same | `serializeSearch` loads tab counts one by one; `debounceSearch` delays a tab's re-fetch by `fetchDelay` ms (default 2000) |
| `filterOutAttributeForAllSearch` (app.json) | `defaultSearch` config | Later | A default search feature; see changes alongside |

## 2. Config contract

**Tabs** go in `clinical/v2/app.json` under `extensions`. `extensionParams` is handed to the widget; everything outside it is read by the page. The three kinds of tab:

```json
[
  {
    "id": "bahmni.clinical.v2.search.myPatients",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_MY_PATIENTS",
    "requiredPrivileges": ["app:clinical"],
    "order": 4,
    "extensionParams": {
      "sqlHandler": "emrapi.sqlSearch.activePatientsByProvider",
      "forwardUrl": "/bahmni-v2/clinical/{{patientUuid}}",
      "refreshTime": 30,
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueueConfig.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.notifications",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_NOTIFICATIONS",
    "requiredPrivileges": ["app:clinical"],
    "order": 7,
    "extensionParams": { "view": "custom", "customView": "notifications" }
  },
  {
    "id": "bahmni.clinical.v2.search.all",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_ALL",
    "requiredPrivileges": ["app:clinical"],
    "order": 8,
    "extensionParams": {
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/defaultSearchConfig.json"
    }
  }
]
```

All nine legacy clinical tabs and the two Programs tabs convert this way (Programs entries carry `configName: "programs"`). Legacy twins such as _Active - Legacy_ keep their absolute legacy `forwardUrl`.

**Presentation file** (`configUrl` of a queue tab), holding the settings that legacy kept in `app.json`. A column `key` is the SQL column name:

```json
{
  "pageSize": 10,
  "columns": [
    {
      "key": "identifier",
      "translationKey": "PATIENT_QUEUE_COLUMN_IDENTIFIER",
      "link": true
    },
    {
      "key": "name",
      "translationKey": "PATIENT_QUEUE_COLUMN_NAME",
      "type": "name"
    }
  ],
  "patientSearch": {
    "debounceSearch": false,
    "fetchDelay": 2000,
    "serializeSearch": false
  },
  "preferExtraIdInSearchResults": true
}
```

- `pageSize`: rows per page in the table (default 10). Legacy tables had no paging.
- Column options: `key`, `translationKey`, `enableSort` (default on, as in legacy), `transform` (`formatDate`, `formatTime`, `formatDateTime`), `link`, and `type: "name"` for the name cell (clickable, bed icon for `hasBeenAdmitted`, `iconAttribute` icon).
- Legacy-compatible mode: omit `columns` and the widget derives them from the first row, minus `ignoredTabularViewHeadings`, with `identifierHeadings` as link columns.

**All tab link.** `defaultSearch` links to `/registration/patient/{{patientUuid}}` unless its config file sets `patientDetailUrl`. BAH-5069 requires the clinical queue to open the consultation, so clinical's `defaultSearchConfig.json` must contain `{ "patientDetailUrl": "/bahmni-v2/clinical/{{patientUuid}}" }`.

**Schema change.** The clinical schema already accepts every key above, because `extensions[]` and `extensionParams` allow extra properties. The only change is typing `order`:

```diff
--- a/apps/clinical/src/providers/clinicalConfig/schema.json
+++ b/apps/clinical/src/providers/clinicalConfig/schema.json
@@ -253,6 +253,7 @@
           "extensionPointId": { "type": "string" },
           "translationKey": { "type": "string" },
           "icon": { "type": "string" },
+          "order": { "type": "number" },
           "requiredPrivileges": {
             "type": "array",
             "items": { "type": "string" }
```

**Why the app schema stays loose:** a validation failure there breaks the whole clinical app. The widget validates its own params and file (Ajv, as `getConfig` does), so one bad tab shows an error in that tab only. Widget rules: a queue tab needs `configUrl` and either `forwardUrl` or `links`; `view` is `table`, `tile` or `custom`; `forwardUrl` starts with `/` (not `//`) or `http(s)://`; `refreshTime` is at least 0; unknown keys are rejected.

## 3. Widget contract

`SearchWidgetProps` gives a widget its `extensionParams`. To add a widget:

1. Create the component in `packages/bahmni-widgets/src/search/<name>/`. If it has a config file, validate it with `getConfig(configUrl, schema)`.
2. Register it in `<name>/index.ts`: `registerSearchWidget({ key: '<name>', component: Widget })`, and import that folder from `search/index.ts` so it loads.
3. Add an extension to the app's `v2/app.json`. The widget is chosen by the rule in decision 3, so a new widget adds its own discriminating key.
4. Add the tab label and all widget text keys to `apps/<app>/public/locales/locale_en.json`.
5. Set `requiredPrivileges` on the extension. Tabs the user cannot access are hidden.
6. Test it by registering it in a test, as `apps/clinical/src/pages/list/extensions/searchView/__tests__/index.test.tsx` does, and call `clearSearchWidgetRegistry()` afterwards.

The queue widget lives in `packages/bahmni-widgets/src/search/patientQueue/` and calls a new `fetchPatientQueue()` in `@bahmni/services`. `commonSearch` cannot be chosen from config under decision 3; nothing uses it today.

## 4. Table, columns, sorting, pagination, links

- **Table first.** `view` defaults to `table`; `tile` (avatar, bed icon, icons, infinite scroll) and `custom` (for example Notifications, a micro-frontend today) follow without changing existing configs.
- **Sorting:** per column, on by default. Rows keep server order until a header is clicked. Empty values sort last in both directions, as legacy did and BAH-5069 requires. The current `DataTable` puts them first when ascending, so it needs an opt-in fix.
- **Filtering:** the filter box matches `searchColumns` (default identifier and name), not every column.
- **Pagination:** client-side over the full response; `pageSize` default 10.
- **Built-in behaviour kept from legacy:** tab count `(n)` (the filtered count while typing), Enter with one match opens the patient, the last selected tab is restored, the name cell icons, and a row column named `forwardUrl` overrides the link and opens a new tab.
- **One row per patient** is the SQL query's job. The widget does not de-duplicate.
- **Links:** `{{placeholders}}` resolve from the row (`patientUuid` is `uuid`, `visitUuid` is `activeVisitUuid`, any other name is a column of that name), then from the page's query string (document upload needs `encounterType`, `topLevelConcept`). `encounterUuid` defaults to `active`. Values are URL-encoded; if one is missing, the cell is plain text. A URL starting with `/bahmni-v2/` navigates inside the app (the router already adds that prefix, so the widget strips it); any other `/...` or `https://...` is a full page load; `#` and `//host` are rejected. This is the router-versus-full-page idea of the existing search results code, adapted to the base path and to legacy Angular links.

## 5. Extension points

Legacy has about 22 extension points read by code. This card uses one, `org.bahmni.patient.search`, shared by all six apps and documented on the wiki; every other point (consultation tabs, observation templates, ADT and IPD actions, home and admin tiles) is a separate feature.

- **Legacy never validated extension points.** The framework builds its list from the entries themselves, so any string worked. The wiki says the id must match one declared in `app.json`, but the code does not enforce it.
- **The page already ignores points it has no handler for.** A misspelled `org.bahmni.clinical.v2.serch` silently shows no tabs.
- **Proposal:** the supported points are fixed by code. Warn on unknown points, and list the supported ones. No schema enum, so a bad value cannot break the whole app.
- Three points are declared or configured but nothing reads them in code (`org.bahmni.orders.search`, `org.bahmni.clinical.orders`, `org.bahmni.admin.v2.dashboard`).

## 6. Reusability

- **Where:** the widget in `@bahmni/widgets`, the service in `@bahmni/services`, both reusable. Each app keeps its own list page and tabs component, as today; the clinical copy is the one changed here.
- **To use the queue in another app:**
  1. Add the extension point `org.bahmni.<app>.v2.search` and a handler for it in that app's list page.
  2. Add queue extensions and a presentation file to the app's `v2/app.json`.
  3. Allow the queue keys in that app's config schema.
  4. Add the translation keys.
- **Document upload** works the same way, with a `forwardUrl` like `/bahmni-v2/patient-documents/{{patientUuid}}?encounterType={{encounterType}}&topLevelConcept={{topLevelConcept}}`.
- **Out of scope:** the ADT Ward List tab, which legacy injects by moving DOM nodes.

## 7. Backend scope

**No change needed.**

<!-- prettier-ignore -->
| Purpose | Request |
|---|---|
| Queue | `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<sqlHandler>&v=full&location_uuid=..&provider_uuid=..[&additionalParams=..]` |
| _All_ tab | `GET /openmrs/ws/rest/v1/bahmni/search/patient/lucene?...` (existing `defaultSearch`) |

- The SQL lives in the backend as a global property such as `emrapi.sqlSearch.activePatients`. The backend fills placeholders such as `${visit_location_uuid}` and `${provider_uuid}`.
- `location_uuid` (from the `bahmni.user.location` cookie) is required. `provider_uuid` is required by provider-scoped queries, from the active practitioner.
- An unknown query or a missing required parameter returns **HTTP 500 with an HTML body**; an unauthenticated call returns 401 JSON, which the shared client turns into a redirect to login. The service must show a generic translated error, never the body.
- A column can be shown only if the query returns it. The SQL text is readable at `GET .../bahmnicore/sql/globalproperty?property=<sqlHandler>`.
- Queries differ in what makes a patient appear. _Active_ uses the visit location; _My Patients_ needs an encounter by the current provider; _PatientsByLocation_ needs an encounter at the login location.

## Changes needed alongside

<!-- prettier-ignore -->
| # | Change |
|---|---|
| C1 | `DataTable`: opt-in "empty values last" sorting; per-column global filter for `searchColumns` |
| C2 | `order` on the shared `Extension` type, the clinical schema, and sorting in the tabs component |
| C3 | Tabs component: count badge in the tab label; optional `isActive` prop so a tab refetches when selected |
| C4 | List page: drop the `searchHandler` filter; widget chosen by the rule in decision 3; `configName` |
| C5 | Clinical config in `standard-config` and `clinic-config`: tabs, presentation file, `defaultSearchConfig.json`, locale keys |
| C6 | Default search parity for the _All_ tab (tracked separately, search is out of scope for BAH-5069): auto-open when exactly one result, `filterOutAttributeForAllSearch`, primary identifier name in the placeholder |

## Consequences and risks

- New queue tabs, in any app, become a config edit, and legacy tabs move over with the same keys.
- **Hidden tabs still load.** Carbon mounts every tab panel at start, so each queue tab fetches immediately and refreshes on its own timer, as legacy did. Legacy also re-fetched on tab select; `isActive` lets the widget do the same. Tabs with the same query, location and provider share one request (legacy made 6 calls for 3 distinct queries).
- **Page resets on refresh.** `DataTable` returns to page 1 when its rows change. React Query keeps the same rows when data is unchanged, so this only happens on real changes.
- **Value types:** SQL returns `hasBeenAdmitted` as the string `"true"` or `"false"`; the _All_ search returns a boolean. Handle both.
- The row `Status` that legacy stores on the root scope for ADT is Angular-only and is not carried.
- Links to legacy Angular pages cause a full page load until those apps migrate.
- **ADT _To Acknowledge_** uses `emrapi.sqlSearch.toAcknowledgeNotes`, defined in `standard-config` `gp_ipd.xml`. It is empty on environments that have not loaded the IPD global properties.

## Open points

1. **Rejected query:** show an error in that tab (proposed), or fall back to the default search? A silent fallback hides misconfiguration.
2. **`commonSearch`** cannot be chosen from config once `searchHandler` is gone. Acceptable while nothing uses it?
3. **Tab ids:** keep the legacy ids (`allActivePatients` is really "Active - Legacy") or use readable ids?
4. **`configName`:** the list page route for tab sets such as Programs.
5. **Tile design:** BAH-5256 has no content yet.

## Alternatives rejected

<!-- prettier-ignore -->
| Alternative | Why |
|---|---|
| All queue config inline in the extension | Columns would repeat on every tab |
| Reuse `commonSearch` / `ResultsTable` | JSONata per column is overkill for flat SQL rows; it stores `-` in row data, breaking empty-last sorting |
| `SortableDataTable` | No filtering, which BAH-5069 requires |
| Server-side pagination | The SQL endpoint has no paging; needs a backend change |
| Trim legacy keys nobody ships | The code supports them, so implementers may use them |
| Flatten `extensionParams` into the tab entry | It is the existing contract and the legacy shape; it keeps widget keys apart from page keys |
