# ADR: Patient Queues in bahmni-apps-frontend

<!-- prettier-ignore -->
|  |  |
|---|---|
| **Status** | Proposed |
| **Jira** | BAH-5258 (parent BAH-5068; informs BAH-5069 and BAH-5256) |
| **Scope** | Clinical app first; the widget and service are reusable by other apps |

## Context

The legacy Angular "Patient Queue" page is one shared module (`common/patient-search`) used by six apps: clinical, adt, ipd, ot, document-upload and orders. Each tab is an `org.bahmni.patient.search` entry in the app's `extension.json`; shared settings sit in `app.json`. Opening a tab runs `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<query>&location_uuid=..&provider_uuid=..`; clicking a patient opens `forwardUrl`.

The clinical React app already has the tab framework: a list page that reads `extensions[]` from `clinical/v2/app.json`, `searchView` (one tab per extension), a widget registry with `defaultSearch` and `commonSearch`, `DataTable`, and `getConfig` for validated config. What is missing is a widget for SQL-backed tabs, and the tabs config in `clinical/v2/app.json`, which has no `extensions` yet.

In React the queue is the whole page; each tab is a widget. The tab widgets are `sqlSearch` (new, SQL-backed list), `defaultSearch` (name or ID search) and `commonSearch` (criteria search). They differ too much in shape to share one widget config, so each keeps its own config, and the three live in one file.

**Goal:** a v2 config that supports **everything the legacy config supported**, with the same key names wherever possible, so a legacy tab moves over almost as a copy-paste. Parity is measured against what the legacy code reads (15 `extensionParams` keys, 6 `app.json` keys), not only against the shipped samples, because implementers' own configs may use any of them.

## Decisions

1. **One `sqlSearch` widget** in `@bahmni/widgets`, registered in the existing registry next to `defaultSearch` and `commonSearch`. It lists patients from a named SQL query and has no search box. Apps differ only by config; clinical goes first.
2. **Legacy key names are kept.** Every key the legacy code reads is supported with the same name and meaning. The only changes are `templateUrl` (an Angular template) becoming `customView`, the SQL query moving from `searchHandler` to `query` (decision 3), and the two print keys, which are deferred (decision 9).
3. **Every tab names its widget in `searchHandler`.** `extensionPointId` decides whether an entry is a tab; `extensionParams.searchHandler` is the registered widget key (`sqlSearch`, `defaultSearch`, `commonSearch`, future widgets). The SQL query name moves to the tab's `query` key. A misspelled widget name shows "widget not registered", not a failing SQL call. A query the backend rejects shows an error in that tab (open point 1).
4. **`view` supports `table`, `tile` and `custom`.** Table is built first; tile (needs the BAH-5256 design) and custom follow. Config written today keeps working: an unbuilt view renders as a table.
5. **Columns are declared** in the tab config (preferred). A legacy-compatible mode derives them from the first row, as legacy did, so legacy configs migrate unchanged.
6. **Sort, filter and pagination run in the browser** with `DataTable`, because the SQL endpoint has no sort or paging. Legacy rules are kept: every column sortable, empty values last, filter on `searchColumns`.
7. **Safe link resolver.** `forwardUrl` keeps the `{{placeholder}}` syntax; missing values never produce a broken URL (the existing `formatUrl` returns `.../undefined`).
8. **No backend change.** The frontend never builds or edits SQL; it sends only the query name.
9. **Deferred: print and fetch settings.** Legacy `showPrint` and `printHtmlLocation` have no use in `standard-config` or `clinic-config`, and the template service has no list template yet. Legacy `patientSearch.serializeSearch`, `debounceSearch` and `fetchDelay` are shipped as `false` and nothing in React reads them. Both can be added later without changing existing configs.
10. **One config file for all tab widgets.** `patientQueue.json` holds a `tabs` list; each entry has `ids` (one or more tab ids) and `config`, which is exactly the config of the widget that tab runs. Widget schemas stay unchanged, and each widget validates only its own slice.

## 1. Config mapping (legacy to v2)

Where we looked: the legacy code, `standard-config` and `clinic-config` (38 queue entries across 7 apps), the standard Bahmni environment, a local Bahmni, and the Bahmni wiki (`extension.json` and `Bahmni App Configuration` pages). One row per legacy key. **Same** means the same name and meaning.

<!-- prettier-ignore -->
| Legacy key | v2 | Status | Notes |
|---|---|---|---|
| `id` | `id` | Same | Unique per tab |
| `extensionPointId` | `org.bahmni.<app>.v2.search` | Changed | Clinical's is `org.bahmni.clinical.v2.search` |
| `type` | - | Not carried | Always `config`; the slot decides the kind of UI |
| `label`, `display` | `translationKey` | Moved | Legacy fallback text (the wiki's high-risk example uses `display`); put it in the locale file |
| `translationKey` (in `extensionParams`) | `translationKey` (tab level) | Moved | |
| `order` | `order` (tab level) | Same | A tab property read by the page, not by the widget |
| `requiredPrivilege`, `requiredPrivileges` | `requiredPrivileges` (array) | Changed | The user needs at least one; legacy read only the singular key |
| `searchHandler` | `query` (in the tab's `config`) | Renamed | The SQL query name. `extensionParams.searchHandler` now holds the widget key (`sqlSearch`, `defaultSearch`, `commonSearch`); a legacy tab without a query becomes a `defaultSearch` tab |
| `view` | `view` | Same | `table`, `tile`, `custom`; legacy default was `tile`; as in legacy, the table needs a `query` |
| `templateUrl` | `customView` | Renamed | Name of a registered React view, with `view: custom` |
| `forwardUrl` | `forwardUrl` | Same | Absolute path or URL |
| `links` | `links` | Same | Per-column link; `url` may be a string or a map keyed by the cell value; `newTab` |
| `linkColumn` | `linkColumn` | Same | |
| `targetedTab` | `targetedTab` | Same | Opens the named window; the legacy title and reload step is not carried |
| `searchColumns` | `searchColumns` | Same | Restricts the filter box to these columns; default identifier and name |
| `refreshTime` | `refreshTime` | Same | Seconds; 0 or absent means no refresh |
| `additionalParams` | `additionalParams` | Same | A string or an object; an object is sent as JSON, as Angular did |
| `showPrint`, `printHtmlLocation` | - | Deferred | No shipped use, and no list template exists (decision 9); a legacy tab that sets them loses the Print button until print is added |
| `extension-<name>.json` | `configName` | New | Tab sets such as Programs and the wiki's Data Quality Dashboard (`extension-dataintegrity.json`); the list page route is open point 3 |
| `forwardButtonTitle`, `tabularViewHeadingOrder`, `searchParams` | - | Not carried | Never read by the legacy code |
| `ignoredTabularViewHeadings` (app.json) | same key, in the tab's `config` | Same | Row fields hidden when columns are derived from the first row |
| `identifierHeadings` (app.json) | same key, in the tab's `config` | Same | Columns shown as links to the patient (default `identifier`) |
| `iconAttribute` (app.json) | same key, in the tab's `config` | Same | Extra icon beside the name when a row attribute equals `attrValue` |
| `preferExtraIdInSearchResults` (app.json) | same key, in the tab's `config` | Same | Tile view shows the extra identifier instead of `identifier`; shipped as `true` in `clinic-config` |
| `patientSearch.*` (app.json) | - | Deferred | `serializeSearch`, `debounceSearch` and `fetchDelay` are shipped as `false`; nothing in React reads them (decision 9) |
| `filterOutAttributeForAllSearch` (app.json) | `defaultSearch` config | Later | A default search feature; see changes alongside |

## 2. Config contract

**Tabs** go in `clinical/v2/app.json` under `extensions`. The page reads everything outside `extensionParams` (label, privilege, order). `extensionParams` holds only two keys, the same for every widget: `searchHandler` (the widget key) and `configUrl` (the shared file below). Every tab points at the same `configUrl`:

```json
[
  {
    "id": "bahmni.clinical.v2.search.myPatients",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_MY_PATIENTS",
    "requiredPrivileges": ["app:clinical"],
    "order": 4,
    "extensionParams": {
      "searchHandler": "sqlSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueue.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.opd1",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_OPD_1",
    "requiredPrivileges": ["app:clinical"],
    "order": 5,
    "extensionParams": {
      "searchHandler": "sqlSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueue.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.commonSearch",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "ADVANCED_SEARCH_LABEL",
    "requiredPrivileges": ["app:clinical"],
    "order": 6,
    "extensionParams": {
      "searchHandler": "commonSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueue.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.notifications",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_NOTIFICATIONS",
    "requiredPrivileges": ["app:clinical"],
    "order": 7,
    "extensionParams": {
      "searchHandler": "sqlSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueue.json"
    }
  },
  {
    "id": "bahmni.clinical.v2.search.all",
    "extensionPointId": "org.bahmni.clinical.v2.search",
    "translationKey": "PATIENT_QUEUE_TAB_ALL",
    "requiredPrivileges": ["app:clinical"],
    "order": 8,
    "extensionParams": {
      "searchHandler": "defaultSearch",
      "configUrl": "/bahmni_config/openmrs/apps/clinical/v2/extensions/patientQueue.json"
    }
  }
]
```

Registration's schema rejects extra keys in `extensionParams`, so the query and every other setting live in the shared file, never in `extensionParams`. All nine legacy clinical tabs and the two Programs tabs convert as above (Programs entries carry `configName: "programs"`). Legacy twins such as _Active - Legacy_ keep their absolute legacy `forwardUrl`.

**Tab config file** (`clinical/v2/extensions/patientQueue.json`, the `configUrl` of every tab). It has two parts: `defaults.sqlSearch`, shared by all SQL tabs, and `tabs`, a list where each entry has `ids` (one or more tab ids that share the config) and `config`. A column `key` is the SQL column name:

```json
{
  "defaults": {
    "sqlSearch": {
      "pageSize": 10,
      "forwardUrl": "/bahmni-v2/clinical/{{patientUuid}}",
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
      ]
    }
  },
  "tabs": [
    {
      "ids": [
        "bahmni.clinical.v2.search.myPatients",
        "bahmni.clinical.v2.search.opd1"
      ],
      "config": {
        "query": "emrapi.sqlSearch.activePatientsByProvider",
        "refreshTime": 30
      }
    },
    {
      "ids": ["bahmni.clinical.v2.search.commonSearch"],
      "config": [
        {
          "context": "patient",
          "translationKey": "ADVANCED_SEARCH_LABEL",
          "requiredPrivileges": ["app:clinical"],
          "url": "/openmrs/ws/rest/v1/patient/search",
          "pageSize": 10,
          "batchSize": 50,
          "criteria": [
            {
              "id": "given-name",
              "field": { "key": "names.givenName" },
              "translationKey": "PATIENT_QUEUE_CRITERION_GIVEN_NAME",
              "default": true,
              "input": {
                "kind": "text",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_GIVEN_NAME_PLACEHOLDER"
              }
            },
            {
              "id": "family-name",
              "field": { "key": "names.familyName" },
              "translationKey": "PATIENT_QUEUE_CRITERION_FAMILY_NAME",
              "input": {
                "kind": "text",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_FAMILY_NAME_PLACEHOLDER"
              }
            },
            {
              "id": "identifier",
              "field": {
                "key": "identifiers",
                "keyType": "d3153eb0-5e07-11ef-8f7c-0242ac120002"
              },
              "translationKey": "PATIENT_QUEUE_CRITERION_IDENTIFIER",
              "input": {
                "kind": "text",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_IDENTIFIER_PLACEHOLDER"
              }
            },
            {
              "id": "phone",
              "field": {
                "key": "attributes",
                "keyType": "a384873b-847a-4a86-b869-28fb601162dd"
              },
              "translationKey": "PATIENT_QUEUE_CRITERION_PHONE",
              "input": {
                "kind": "text",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_PHONE_PLACEHOLDER"
              }
            },
            {
              "id": "gender",
              "field": { "key": "gender" },
              "translationKey": "PATIENT_QUEUE_CRITERION_GENDER",
              "input": {
                "kind": "options",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_GENDER_PLACEHOLDER",
                "options": [
                  { "translationKey": "GENDER_F", "value": "F" },
                  { "translationKey": "GENDER_M", "value": "M" }
                ]
              }
            },
            {
              "id": "birthdate",
              "field": { "key": "birthdate" },
              "translationKey": "PATIENT_QUEUE_CRITERION_BIRTHDATE",
              "input": {
                "kind": "date",
                "placeholderTranslationKey": "PATIENT_QUEUE_CRITERION_BIRTHDATE_PLACEHOLDER",
                "rangeAllowed": true
              }
            }
          ],
          "resultFields": [
            {
              "translationKey": "PATIENT_QUEUE_COLUMN_IDENTIFIER",
              "expression": "identifiers[preferred = true][0].identifier",
              "enableSort": true,
              "action": "openPatient"
            },
            {
              "translationKey": "PATIENT_QUEUE_COLUMN_NAME",
              "expression": "name.givenName & \" \" & name.familyName",
              "enableSort": true
            },
            {
              "translationKey": "PATIENT_QUEUE_COLUMN_GENDER",
              "expression": "gender",
              "transform": "formatGender"
            },
            {
              "translationKey": "PATIENT_QUEUE_COLUMN_BIRTH_DATE",
              "expression": "birthdate",
              "transform": "formatDate",
              "enableSort": true
            }
          ],
          "actions": [
            {
              "key": "openPatient",
              "type": "navigate",
              "requiredPrivileges": ["app:clinical"],
              "navigationURL": "/bahmni-v2/clinical/{uuid}"
            }
          ]
        }
      ]
    },
    {
      "ids": ["bahmni.clinical.v2.search.notifications"],
      "config": { "view": "custom", "customView": "notifications" }
    },
    {
      "ids": ["bahmni.clinical.v2.search.all"],
      "config": {
        "patientDetailUrl": "/bahmni-v2/clinical/{{patientUuid}}",
        "customAttributes": [
          {
            "translationKey": "REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER",
            "type": "person",
            "fields": ["phoneNumber", "alternatePhoneNumber"],
            "expectedFields": [
              {
                "field": "phoneNumber",
                "translationKey": "REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER"
              },
              {
                "field": "alternatePhoneNumber",
                "translationKey": "REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER"
              }
            ]
          },
          {
            "translationKey": "REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL",
            "type": "person",
            "fields": ["email"],
            "expectedFields": [
              {
                "field": "email",
                "translationKey": "REGISTRATION_PATIENT_SEARCH_HEADER_EMAIL"
              }
            ]
          },
          {
            "translationKey": "REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE",
            "type": "address",
            "fields": ["city_village"],
            "expectedFields": [
              {
                "field": "city_village",
                "translationKey": "REGISTRATION_PATIENT_SEARCH_HEADER_VILLAGE"
              }
            ]
          },
          {
            "translationKey": "REGISTRATION_PATIENT_SEARCH_DROPDOWN_LOCALITY",
            "type": "address",
            "fields": ["address2"],
            "expectedFields": [
              {
                "field": "address2",
                "translationKey": "REGISTRATION_PATIENT_SEARCH_HEADER_LOCALITY"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

- **Lookup:** the widget fetches the file from its `configUrl`, finds the `tabs` entry whose `ids` contains the tab id, and validates only that `config` with its own schema. The `ids` list is how several tabs (for example My Patients and OPD-1) share one config. The tab `id` is the join key between `app.json` and this file.
- **Merge:** for `sqlSearch`, the settings are `{ ...defaults.sqlSearch, ...config }`. A key in `config` replaces the default whole, so a tab that sets `columns` restates the full list.
- **`config` shape:** it is exactly the widget's own config. `sqlSearch` takes an object (keys below), `defaultSearch` takes its existing object (`patientDetailUrl`, `customAttributes`), and `commonSearch` takes its existing array of contexts. Neither existing schema changes.
- **`sqlSearch` keys** keep their legacy meaning: `query` (required unless `view` is `custom`), `view`, `customView`, `pageSize`, `forwardUrl`, `links`, `linkColumn`, `targetedTab`, `searchColumns`, `refreshTime`, `additionalParams`, `columns`, `ignoredTabularViewHeadings`, `identifierHeadings`, `iconAttribute` and `preferExtraIdInSearchResults`.
- `pageSize`: rows per page in the table (default 10). Legacy tables had no paging.
- Column options: `key`, `translationKey`, `enableSort` (default on, as in legacy), `transform` (`formatDate`, `formatTime`, `formatDateTime`), `link`, and `type: "name"` for the name cell (clickable, bed icon for `hasBeenAdmitted`, `iconAttribute` icon).
- Legacy-compatible mode: omit `columns` and the widget derives them from the first row, minus `ignoredTabularViewHeadings`, with `identifierHeadings` as link columns.

**All tab link.** `defaultSearch` links to `/registration/patient/{{patientUuid}}` unless its config sets `patientDetailUrl`. BAH-5069 requires the clinical queue to open the consultation, so clinical's `defaultSearch` entry must contain `{ "patientDetailUrl": "/bahmni-v2/clinical/{{patientUuid}}" }`, as in the example.

**Schema change.** The clinical and registration schemas already accept the extension entries above (clinical's `extensionParams` allows extra properties, and registration's strict one accepts `searchHandler` and `configUrl`). The only change is typing `order`:

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

**Why the app schema stays loose:** a validation failure there breaks the whole clinical app. Each widget validates its own slice of the file (Ajv, as `getConfig` does), so one bad tab shows an error in that tab only. `sqlSearch` rules: a table tab needs `query` and either `forwardUrl` or `links`; a `custom` tab needs `customView`; `view` is `table`, `tile` or `custom`; `forwardUrl` starts with `/` (not `//`) or `http(s)://`; `refreshTime` is at least 0; unknown keys are rejected.

## 3. Widget contract

`SearchWidgetProps` gives a widget its `extensionParams` and, new in this ADR, the tab `id` (an optional prop that `searchView` passes from `ext.id`; existing widgets ignore it). To add a widget:

1. Create the component in `packages/bahmni-widgets/src/search/<name>/` with its own `schema.json`.
2. Load its config with the shared loader in `@bahmni/widgets`: it fetches `configUrl`, finds the `tabs` entry whose `ids` contains the tab `id`, and returns that `config`. The widget validates it with its own schema (`getConfig` validation rules). If the file has no `tabs` key, the loader returns the whole file, so registration's existing `defaultSearchConfig.json` keeps working.
3. Register it in `<name>/index.ts`: `registerSearchWidget({ key: '<name>', component: Widget })`, and import that folder from `search/index.ts` so it loads.
4. Add an extension to the app's `v2/app.json` with `extensionParams: { searchHandler: '<name>', configUrl }`, and a `tabs` entry for its `id` in the shared file.
5. Add the tab label and all widget text keys to `apps/<app>/public/locales/locale_en.json`.
6. Set `requiredPrivileges` on the extension. Tabs the user cannot access are hidden.
7. Test it by registering it in a test, as `apps/clinical/src/pages/list/extensions/searchView/__tests__/index.test.tsx` does, and call `clearSearchWidgetRegistry()` afterwards.

The `sqlSearch` widget lives in `packages/bahmni-widgets/src/search/sqlSearch/` and calls a new `fetchSqlSearch()` in `@bahmni/services`. `defaultSearch` and `commonSearch` switch to the shared loader and keep their schemas.

## 4. Table, columns, sorting, pagination, links

- **Table first.** `view` defaults to `table`; `tile` (avatar, bed icon, icons, infinite scroll) and `custom` (for example Notifications, a micro-frontend today) follow without changing existing configs.
- **Sorting:** per column, on by default. Rows keep server order until a header is clicked. Empty values sort last in both directions, as legacy did and BAH-5069 requires. The current `DataTable` puts them first when ascending, so it needs an opt-in fix.
- **Filtering:** the filter box matches `searchColumns` (default identifier and name), not every column.
- **Pagination:** client-side over the full response; `pageSize` default 10.
- **Built-in behaviour kept from legacy:** tab count `(n)` (the filtered count while typing), Enter with one match opens the patient, the last selected tab is restored, the name cell icons, and a row column named `forwardUrl` overrides the link and opens a new tab.
- **Print is deferred.** Legacy `showPrint` shows a Print button that renders an Angular HTML file (`printHtmlLocation`) from the rows on screen. Neither key is used in `standard-config` or `clinic-config`; the only known use is the wiki's Data Quality Dashboard. The template service and `DocumentPrintButton` already exist, but no list template does and no search widget passes rows to the button. If needed later, a `printOptions` key can be added to `sqlSearch` without changing existing configs: it would reuse `DocumentPrintButton`, send the filtered and sorted rows as `data` through `getRenderData`, and render a new list template registered in `templates.json`. Until then the browser's print covers the rare case.
- **One row per patient** is the SQL query's job. The widget does not de-duplicate.
- **Links:** `{{placeholders}}` resolve from the row (`patientUuid` is `uuid`, `visitUuid` is `activeVisitUuid`, any other name is a column of that name), then from the page's query string (document upload needs `encounterType`, `topLevelConcept`). `encounterUuid` defaults to `active`. Values are URL-encoded; if one is missing, the cell is plain text. A URL starting with `/bahmni-v2/` navigates inside the app (the router already adds that prefix, so the widget strips it); any other `/...` or `https://...` is a full page load; `#` and `//host` are rejected. This is the router-versus-full-page idea of the existing search results code, adapted to the base path and to legacy Angular links.

## 5. Extension points

Legacy has about 22 extension points read by code. This card uses one, `org.bahmni.patient.search`, shared by all six apps and documented on the wiki; every other point (consultation tabs, observation templates, ADT and IPD actions, home and admin tiles) is a separate feature.

- **Legacy never validated extension points.** The framework builds its list from the entries themselves, so any string worked. The wiki says the id must match one declared in `app.json`, but the code does not enforce it.
- **The page already ignores points it has no handler for.** A misspelled `org.bahmni.clinical.v2.serch` silently shows no tabs.
- **Proposal:** the supported points are fixed by code. Warn on unknown points, and list the supported ones. No schema enum, so a bad value cannot break the whole app.
- Three points are declared or configured but nothing reads them in code (`org.bahmni.orders.search`, `org.bahmni.clinical.orders`, `org.bahmni.admin.v2.dashboard`).

## 6. Reusability

- **Where:** the widgets in `@bahmni/widgets`, the service in `@bahmni/services`, both reusable. Each app keeps its own list page and tabs component, as today; the clinical copy is the one changed here.
- **To use the queue in another app:**
  1. Add the extension point `org.bahmni.<app>.v2.search` and a handler for it in that app's list page.
  2. Add the tab extensions to the app's `v2/app.json` and a `patientQueue.json` with one `tabs` entry per tab id.
  3. Check that app's config schema accepts `searchHandler` and `configUrl` in `extensionParams` (registration's does).
  4. Add the translation keys.
- **Document upload** works the same way, with a `forwardUrl` like `/bahmni-v2/patient-documents/{{patientUuid}}?encounterType={{encounterType}}&topLevelConcept={{topLevelConcept}}`.
- **Out of scope:** the ADT Ward List tab, which legacy injects by moving DOM nodes.

## 7. Backend scope

**No change needed.**

<!-- prettier-ignore -->
| Purpose | Request |
|---|---|
| Queue | `GET /openmrs/ws/rest/v1/bahmnicore/sql?q=<query>&v=full&location_uuid=..&provider_uuid=..[&additionalParams=..]` |
| _All_ tab | `GET /openmrs/ws/rest/v1/bahmni/search/patient/lucene?...` (existing `defaultSearch`) |

- `q` can name **any** global property whose value is SQL; there is no prefix restriction, and an unknown name fails with "No such query". By convention `emrapi.sqlSearch.*` queries return patient lists and `*.sqlGet.*` queries fetch other data.
- **Every request parameter becomes a `${placeholder}` in the SQL.** The backend adds `visit_location_uuid` (derived from `location_uuid`) and `user_locale`. `additionalParams` is parsed as JSON (a list of tests) and expands a `${testName}` placeholder, as in the wiki's high-risk patients queue.
- `location_uuid` (from the `bahmni.user.location` cookie) is required. `provider_uuid` is required by provider-scoped queries, from the active practitioner.
- An unknown query or a missing required parameter returns **HTTP 500 with an HTML body**; an unauthenticated call returns 401 JSON, which the shared client turns into a redirect to login. The service must show a generic translated error, never the body.
- A queue query should return `name`, `identifier`, `uuid` (links and the patient image), `activeVisitUuid` and `hasBeenAdmitted` (bed icon), as the wiki documents. `provider_uuid` is always sent, whether or not the query uses it.
- A column can be shown only if the query returns it. The SQL text is readable at `GET .../bahmnicore/sql/globalproperty?property=<query>`.
- Queries differ in what makes a patient appear. _Active_ uses the visit location; _My Patients_ needs an encounter by the current provider; _PatientsByLocation_ needs an encounter at the login location.

## Changes needed alongside

<!-- prettier-ignore -->
| # | Change |
|---|---|
| C1 | `DataTable`: opt-in "empty values last" sorting; per-column global filter for `searchColumns` |
| C2 | `order` on the shared `Extension` type, the clinical schema, and sorting in the tabs component |
| C3 | Tabs component: count badge in the tab label; optional `isActive` prop so a tab refetches when selected |
| C4 | `SearchWidgetProps` gets an optional `id` and `searchView` passes `ext.id`; a shared loader in `@bahmni/widgets` returns a tab's `config` from the `tabs` list (whole file if there is no `tabs` key); `defaultSearch` and `commonSearch` switch to it; the list page adds `configName` |
| C5 | Clinical config in `standard-config` and `clinic-config`: tab extensions, `patientQueue.json`, locale keys |
| C6 | Default search parity for the _All_ tab (tracked separately, search is out of scope for BAH-5069): auto-open when exactly one result, `filterOutAttributeForAllSearch`, primary identifier name in the placeholder |

## Consequences and risks

- New queue tabs, in any app, become a config edit, and legacy tabs move over with the same keys.
- **Hidden tabs still load.** Carbon mounts every tab panel at start, so each queue tab fetches immediately and refreshes on its own timer, as legacy did. Legacy also re-fetched on tab select; `isActive` lets the widget do the same. Tabs with the same query, location and provider share one request (legacy made 6 calls for 3 distinct queries).
- **Page resets on refresh.** `DataTable` returns to page 1 when its rows change. React Query keeps the same rows when data is unchanged, so this only happens on real changes.
- **Value types:** SQL returns `hasBeenAdmitted` as the string `"true"` or `"false"`; the _All_ search returns a boolean. Handle both.
- The row `Status` that legacy stores on the root scope for ADT is Angular-only and is not carried.
- **A misspelled widget name** (for example `defaultSerch`) shows "widget not registered" in that tab, because `searchHandler` only ever names a widget.
- **A tab id missing from `patientQueue.json`**, or listed in two entries, is a config error shown in that tab only.
- **Shared file:** one `patientQueue.json` is fetched by every tab. React Query caches by URL, so it is one request. Each widget validates only its own slice, so one bad entry does not break the others.
- **`defaultSearch` backend contract.** Each `customAttributes` entry adds one option to the attribute dropdown. A `person` entry searches the `fields` as person attributes and an `address` entry searches them as address fields, through `GET /openmrs/ws/rest/v1/bahmni/search/patient`. A column in `expectedFields` shows a value only if its `field` is also listed in that entry's `fields`. The name and ID box uses the same endpoint, and the `Locality` and `Village` fields are `address2` and `city_village`. The clinical app does not bundle the `REGISTRATION_PATIENT_SEARCH_*` labels used here, so they are added to the clinical translations (change C5).
- **`commonSearch` backend contract.** The tab posts `{ entity, criteria, meta }` to `/openmrs/ws/rest/v1/patient/search`, which supports only the `patient` entity. Fields: `names.givenName`, `names.familyName`, `gender`, `birthdate` and `dateCreated` (`ge` and `le` for dates), plus `identifiers` and `attributes` with a `keyType` (the identifier type or person attribute type uuid) that the widget turns into `.kind` and `.value` conditions. Matching is exact (`eq`), and the name check is case-insensitive. Leave `locationAware` unset: the widget would add a `location.uuid` condition, which this endpoint rejects as an unknown field. The identifier type uuid in the example is the standard environment's `Patient Identifier`, and the phone uuid is its `phoneNumber` attribute type; both differ per installation.
- Links to legacy Angular pages cause a full page load until those apps migrate.
- **ADT _To Acknowledge_** uses `emrapi.sqlSearch.toAcknowledgeNotes`, defined in `standard-config` `gp_ipd.xml`. It is empty on environments that have not loaded the IPD global properties.

## Open points

1. **Rejected query:** show an error in that tab (proposed), or fall back to the default search? A silent fallback hides misconfiguration.
2. **Tab ids:** keep the legacy ids (`allActivePatients` is really "Active - Legacy") or use readable ids?
3. **`configName`:** the list page route for tab sets such as Programs.
4. **Tile design:** BAH-5256 has no content yet.
5. **Shared file for all apps:** keep one `patientQueue.json` per app, or let several apps point at one file? Per app is proposed, because tab ids and privileges differ.

## Alternatives rejected

<!-- prettier-ignore -->
| Alternative | Why |
|---|---|
| All tab config inline in `extensionParams` | Registration's schema rejects extra keys there, and columns would repeat on every tab |
| One generic config shape for all three widgets | `commonSearch` (array, JSONata), `defaultSearch` (object) and `sqlSearch` (flat rows) differ too much; it would rewrite two production widgets |
| Config keyed by `extensionPointId` | Every tab on a page shares the same point, so tabs cannot be told apart |
| Name the new widget `patientQueue` | The queue is the whole page with all its tabs, not one widget |
| Treat any unregistered `searchHandler` as a SQL query | A misspelled widget name would run as a failing SQL call |
| Reuse `commonSearch` / `ResultsTable` | JSONata per column is overkill for flat SQL rows; it stores `-` in row data, breaking empty-last sorting |
| `SortableDataTable` | No filtering, which BAH-5069 requires |
| Server-side pagination | The SQL endpoint has no paging; needs a backend change |
| Trim legacy keys nobody ships | The code supports them, so implementers may use them |
| Build print and fetch settings now | No shipped use; can be added later without changing existing configs |
