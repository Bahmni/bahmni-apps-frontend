# Edit & Stop Medications — Engineering Deep Dive
### BAH-4654 (Edit) · BAH-4689 (Stop)

---

## 1. Overview

Two new actions on the Medications widget in Bahmni v2 (bahmni-apps-frontend):

| Feature | JIRA | PRs |
|---|---|---|
| Edit Medications | BAH-4654 | Frontend #411, FHIR2 OMOD #71, standard-config #119, clinic-config #253, fix #468 |
| Stop Medications | BAH-4689 | Frontend #474, standard-config BAH-4689 branch, clinic-config BAH-4689 branch |

Both features share the same cross-bundle event architecture, encounter/visit gating, and privilege-based visibility model.

---

## 2. System Architecture — The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│  @bahmni/widgets bundle                                              │
│                                                                     │
│  MedicationsTable → Actions → actionHandlers                        │
│         ↓ reads                      ↓ dispatches                  │
│  encounter session                CustomEvent('startConsultation')  │
│       store                               │                         │
└───────────────────────────────────────────┼─────────────────────────┘
                                            │ globalThis event bus
┌───────────────────────────────────────────┼─────────────────────────┐
│  @bahmni/clinical-app bundle             ↓                          │
│                                                                     │
│  ConsultationPage ← listens              PatientHeader              │
│       ↓ renders                               ↓ writes              │
│  ConsultationPad                     encounterSessionStore          │
│       ↓ dispatches                         (singleton)              │
│  ConsultationSaved event            DashboardSection reads ↗        │
└─────────────────────────────────────────────────────────────────────┘
                ↓
         FHIR2 OpenMRS
    $stop / REVISE operations
```

**Key design principle**: widgets (`@bahmni/widgets`) and the clinical app (`@bahmni/clinical-app`) are separate webpack bundles. They cannot share module-level state directly — communication happens via:
1. **CustomEvents** on `globalThis` (action triggers)
2. **encounterSessionStore** (vanilla pub/sub singleton, shared via `@bahmni/services`)

---

## 3. Event Architecture

### 3.1 The `startConsultation` CustomEvent

Defined in: `packages/bahmni-services/src/events/`
Dispatched by: `packages/bahmni-widgets/src/medications/components/actionHandlers.ts`
Consumed by: `apps/clinical/src/pages/ConsultationPage.tsx`

**Stop medication dispatch:**
```ts
globalThis.dispatchEvent(new CustomEvent('startConsultation', {
  detail: {
    encounterType: action.encounterType,
    stopMedication: fhirResource,          // the MedicationRequest to stop
    editOnly: 'stopMedications',            // which input control to show
    editTitle: 'STOP_MEDICATION_FORM_TITLE',
    editEncounterUuid: encounterUuid,       // encounter the med belongs to
  },
}));
```

**Edit medication dispatch:**
```ts
globalThis.dispatchEvent(new CustomEvent('startConsultation', {
  detail: {
    encounterType: action.encounterType,
    editMedications: [fhirResource],        // the MedicationRequest to edit
    editOnly: 'medications',                // which input control to show
    editTitle: 'MEDICATIONS_EDIT_FORM_TITLE',
    editEncounterUuid: encounterUuid,
  },
}));
```

**`editOnly`** is the key that tells ConsultationPad to render ONLY that one input control — creating a focused edit form rather than the full consultation pad.

### 3.2 Subscribe side

```ts
// apps/clinical/src/events/startConsultation/hooks.ts
useSubscribeConsultationStart((event) => {
  setEncounterSessionStartContext(event.detail);
  setIsActionAreaVisible(true);
});
```

### 3.3 `consultationSaved` event

After a successful stop or edit, ConsultationPad dispatches `consultationSaved`. MedicationsTable listens and calls `refetch()` on its TanStack Query to refresh the data.

```ts
// MedicationsTable.tsx
useSubscribeConsultationSaved(() => {
  refetch();
});
```

---

## 4. EncounterSessionStore — Cross-Bundle State Bridge

**File**: `packages/bahmni-services/src/encounterSessionService/encounterSessionStore.ts`

This is a **vanilla JavaScript pub/sub singleton** — NOT a React context, NOT Zustand. It uses `useSyncExternalStore` for React integration.

```
PatientHeader (clinical-app)
    ↓ writes via setEncounterSessionDecision()
encounterSessionStore (singleton in @bahmni/services)
    ↓ reads via useEncounterSessionStore()
DashboardSection (clinical-app)
    ↓ passes as props
MedicationsTable (widgets)
```

### 4.1 How PatientHeader writes

```ts
// PatientHeader.tsx
useEffect(() => {
  if (!isLoading) {
    setEncounterSessionDecision({
      reasons: matchReason,       // e.g. ['MATCHED'] or ['NO_ACTIVE_VISIT']
      encounter: activeEncounter, // the matched encounter object or null
    });
  }
}, [isLoading, matchReason, activeEncounter]);
```

The encounter session service (`useEncounterSession`) queries:
1. FHIR: `GET /ws/fhir2/R4/Encounter?patient={uuid}&status=in-progress` — find active encounters
2. OpenMRS GP: `sessionDurationInMinutes` — session window
3. Logic: match encounter by location + provider within session window

### 4.2 What DashboardSection reads

```ts
const { matchReasons, canEditOrCreate, activeEncounter } = useEncounterSessionStore();
const noActiveVisit = matchReasons.includes('NO_ACTIVE_VISIT');
const activeEncounterUuid = activeEncounter?.id ?? null;

// Passed as props to every widget:
<MedicationsTable
  disableActions={noActiveVisit}
  canEditOrCreate={canEditOrCreate}
  activeEncounterUuid={activeEncounterUuid}
/>
```

### 4.3 Match Reasons

| `matchReasons` value | Meaning | `canEditOrCreate` | `disableActions` |
|---|---|---|---|
| `['MATCHED']` | Perfect encounter match | `true` | `false` |
| `['LOCATION_MISMATCH']` | Different location, same session | `true` | `false` |
| `['PROVIDER_MISMATCH']` | Different provider, same session | `true` | `false` |
| `['NO_ACTIVE_VISIT']` | No visit in progress | `false` | `true` |
| `['NO_MATCHING_ENCOUNTER']` | Visit exists, no encounter | `true` | `false` |

**MATCHED uses the existing encounter; others create a new one.**

---

## 5. Config-Driven Action Model

Actions come from the dashboard JSON config, not from code. This means no code change is needed to add/remove actions per deployment.

### 5.1 Config shape (general.json / app.json)

```json
{
  "type": "treatment",
  "requiredPrivileges": ["Get Orders"],
  "config": {
    "actions": [
      {
        "type": "edit",
        "label": "Edit",
        "encounterType": "Consultation",
        "requiredPrivilege": ["Edit Orders"]
      },
      {
        "type": "stop",
        "label": "Stop",
        "encounterType": "Consultation",
        "requiredPrivilege": ["Edit Orders"]
      }
    ]
  }
}
```

### 5.2 InputControl registration (app.json consultationPad)

```json
{
  "consultationPad": {
    "inputControls": [
      { "type": "medications", ... },
      { "type": "stopMedications", ... }
    ]
  }
}
```

Stop uses `onDirectSubmit` (bypasses the FHIR bundle); Edit uses the standard bundle flow.

---

## 6. Privilege-Based Action Visibility

Actions with insufficient privilege are **completely hidden** (not disabled).

```ts
// MedicationsTable.tsx + Actions.tsx (both layers)
const permittedActions = useMemo(
  () => actions.filter((action) =>
    hasPrivilege(userPrivileges, action.requiredPrivilege)
  ),
  [actions, userPrivileges],
);

if (permittedActions.length === 0) return null;  // entire Actions column hidden
```

If only one permitted action: renders a `Button` or `IconButton`.
If multiple permitted actions: renders an `OverflowMenu`.

Stop action gets danger styling: `kind="danger--ghost"` (single) or `isDelete={true}` (overflow).

---

## 7. Encounter/Visit Gating

Five independent gates — ALL must pass for an action to be enabled:

| Gate | Check | Who enforces it |
|---|---|---|
| Active visit | `!disableActions` (from NO_ACTIVE_VISIT matchReason) | DashboardSection → MedicationsTable prop |
| Can edit/create | `canEditOrCreate` | encounterSessionStore → DashboardSection → prop |
| Active encounter UUID | `!!activeEncounterUuid` | encounterSessionStore → DashboardSection → prop |
| Medication from current encounter | `m.fhirResource?.encounter?.reference?.endsWith(activeEncounterUuid)` | MedicationsTable (edit only) |
| Active/on-hold status | `['active', 'on-hold'].includes(row.status)` | MedicationsTable (stop only) |

```ts
// MedicationsTable.tsx — edit eligibility
const editableMedications = useMemo(() => {
  if (!canEdit || !canEditEncounter || !activeEncounterUuid) return [];
  return activeAndScheduledMedications.filter(
    (m) =>
      (m.status === 'active' || m.status === 'on-hold') &&
      m.fhirResource?.encounter?.reference?.endsWith(activeEncounterUuid),
  );
}, [...]);
```

---

## 8. Stop Medication — Deep Dive

### 8.1 Full flow

```
User clicks Stop
  → actionHandlers.ts dispatches startConsultation
  → ConsultationPage renders ConsultationPad (editOnly: 'stopMedications')
  → StopMedicationForm renders
  → TanStack Query fetches: date range + stop reasons
  → User fills form (date, reason, note)
  → Submit → stopMedications index.ts onDirectSubmit
  → stopMedicationService.ts: POST $stop FHIR operation
  → consultationSaved event → MedicationsTable refetch
```

### 8.2 Stop Medications Zustand Store

```ts
// stopMedicationsStore.ts
interface StopMedicationsState {
  medicationToStop: FhirMedicationRequest | null;
  stopDate: string;                  // ISO date, pre-filled to today
  stopReason: string;
  note: string;
  validate: () => boolean;           // returns false if mandatory fields empty
  setMedicationToStop: (med) => void;
  setStopDate: (date) => void;
  setStopReason: (reason) => void;
  setNote: (note) => void;
  reset: () => void;
}
```

Validation respects field visibility config:
```ts
validate: () => {
  const cfg = get().fieldConfig;
  if (cfg.stopDate?.isVisible !== false && cfg.stopDate?.isMandatory && !get().stopDate) return false;
  if (cfg.stopReason?.isVisible !== false && cfg.stopReason?.isMandatory && !get().stopReason) return false;
  return true;
}
```

### 8.3 FHIR `$stop` Operation

```
POST /openmrs/ws/fhir2/R4/MedicationRequest/{id}/$stop
Content-Type: application/fhir+json

{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "reason",        "valueString": "Side effects" },
    { "name": "effectiveDate", "valueDate": "2025-07-02" },
    { "name": "note",          "valueString": "Patient requested" }
  ]
}
```

### 8.4 Stop Date Range

- **Min**: `effectiveStartDate` from `GET /ws/rest/v1/order/{uuid}?v=custom:(effectiveStartDate,effectiveStopDate)`
- **Max**: today (OpenMRS rejects future dates for `discontinueOrder`)
- **Pre-filled**: today
- TanStack Query key: `['orderDates', stopMedication?.id]`

### 8.5 Stop Reasons (ValueSet)

```
GET /ws/fhir2/R4/ValueSet?title=Stopped+Order+Reason
  → GET /ws/fhir2/R4/ValueSet/{uuid}/$expand
  → extracts .expansion.contains[] → [{code, display}]
```

Falls back to config-based strings if ValueSet is empty.

### 8.6 Direct Submit (bypasses FHIR Bundle)

Stop medications registers with `onDirectSubmit` (not the standard bundle pathway):

```ts
// apps/clinical/src/components/forms/stopMedications/index.ts
registerInputControl({
  type: 'stopMedications',
  hasData: () => !!useStopMedicationStore.getState().medicationToStop,
  validate: () => useStopMedicationStore.getState().validate(),
  onDirectSubmit: async () => {
    const state = useStopMedicationStore.getState();
    await stopMedication({
      medicationRequestId: state.medicationToStop!.id!,
      reason: state.stopReason,
      effectiveDate: state.stopDate,
      note: state.note || undefined,
    });
    dispatchAuditEvent({ eventType: 'STOP_MEDICATION', ... });
  },
});
```

ConsultationPad detects `onDirectSubmit` and skips bundle creation:
```ts
const directSubmitEntries = activeEntries.filter(e => e.hasData() && e.onDirectSubmit);
for (const entry of directSubmitEntries) {
  await entry.onDirectSubmit!();  // calls $stop directly
}
if (directSubmitEntries.length > 0 && bundleEntries.length === 0) {
  dispatchConsultationSaved();    // refresh widgets
  onClose();
  return;  // no bundle created
}
```

### 8.7 FHIR2 OMOD — Translator Fix

**Problem**: Stop reason and note live on the **discontinuation order** (action=DISCONTINUE), not the original MedicationRequest. The translator was not looking up the discontinuation order.

**Fix in `BahmniMedicationRequestTranslatorImpl.toFhirResource()`**:
```java
// Find the discontinuation order for this medication
Order discontinuationOrder = orderService.getAllOrdersByPatient(patient).stream()
    .filter(o -> o.getAction() == Order.Action.DISCONTINUE && o.getPreviousOrder().equals(order))
    .findFirst()
    .orElse(null);

if (discontinuationOrder != null) {
  // Map statusReason
  fhirMedReq.setStatusReason(toFhirCodeableConcept(discontinuationOrder.getOrderReasonNonCoded()));
  // Map dateStopped as extension
  fhirMedReq.addExtension(DATE_STOPPED_EXT_URL, new DateType(discontinuationOrder.getDateStopped()));
  // Map note
  fhirMedReq.addNote(new Annotation().setText(discontinuationOrder.getCommentToFulfiller()));
}
```

---

## 9. Edit Medication — Deep Dive

### 9.1 FHIR API Design (no PUT)

**Design rule**: FHIR-aligned, no `PUT` on existing MedicationRequest.

| Operation | FHIR approach |
|---|---|
| Edit active medication | Create new `MedicationRequest` with `priorPrescription` pointing to original, original gets `CANCELLED` status |
| Stop medication | `$stop` custom operation — creates DISCONTINUE order in OpenMRS |
| Revise (edit) | Action = `REVISE` in FHIR2 OMOD — handled by `BahmniMedicationRequestTranslatorImpl` |

### 9.2 Vanilla Zustand Store (medication request store)

Uses `createStore` (not `create`) inside a factory `getMedicationRequestStore(key)` keyed by `Map`:

```ts
// apps/clinical/src/components/forms/medicationRequest/store.ts
const storeRegistry = new Map<MedicationRequestStoreKey, StoreApi<MedicationRequestState>>();

export function getMedicationRequestStore(key: MedicationRequestStoreKey) {
  if (!storeRegistry.has(key)) {
    storeRegistry.set(key, createStore<MedicationRequestState>(...));
  }
  return storeRegistry.get(key)!;
}
```

Edit-specific state:
```ts
pendingFhirEdits: FhirMedicationRequest[]        // seeded from event detail
originalEditIds: string[]                          // IDs being edited
originalEditSnapshots: Map<string, InputEntry>     // for change detection
hasEditChanges(): boolean                          // enables "Done" button
```

### 9.3 encounterSessionStore encounter UUID fix (PR #468)

**Problem**: `CONSULTATION_ENCOUNTER_TYPE_UUID` was hardcoded as `d34fe3ab-...` — worked on standard but not dev-lite.

**Fix**: PatientHeader dynamically resolves the encounter type UUID:
```ts
const encounterTypeUUID = clinicalConfig.consultationPad.inputControls
  .find(c => c.type === 'encounterDetails')
  ?.metadata?.defaultEncounterType;

// Passed to useEncounterSession hook which uses it for FHIR query
useEncounterSession({ patientUUID, encounterTypeUUID });
```

### 9.4 Encounter sorting fix (PR #468)

**Problem**: Multiple encounters in session window — `encounters[0]` was unreliable (FHIR sort order not guaranteed).

**Fix**:
```ts
const sortedEncounters = encounters.sort(sortByMostRecent);  // by period.start desc
const mostRecentEncounter = sortedEncounters[0];
```

### 9.5 Standard FHIR Bundle submit path

Unlike stop, edit uses the full bundle pathway:

```
ConsultationPad.handleSubmit()
  → getEncounterByUuid(editEncounterUuid)   // fetch the encounter being edited
  → MATCHED? use existing encounter : create new
  → submitConsultation(bundle)
  → POST /ws/fhir2/R4 (transaction bundle)
  → includes MedicationRequest with priorPrescription + action=REVISE
```

---

## 10. TanStack Query Architecture

All data fetching uses TanStack Query `useQuery`. No `useMutation` — mutations are done imperatively in event handlers.

| Query Key | Endpoint | Consumer |
|---|---|---|
| `['medications', patientUUID, code, encounterUuids]` | `GET /ws/fhir2/R4/MedicationRequest?patient=...` | MedicationsTable |
| `['medicationConfig']` | config JSON URL | StopMedicationForm, MedicationRequestForm |
| `['stopReasons']` | `GET /ws/fhir2/R4/ValueSet?title=Stopped+Order+Reason` | StopMedicationForm |
| `['orderDates', stopMedication?.id]` | `GET /ws/rest/v1/order/{uuid}?v=custom:(effectiveStartDate,effectiveStopDate)` | StopMedicationForm |
| `['dashboardConfig', url]` | dashboard JSON | ConsultationPage |
| `['patient', patientUUID]` | `GET /ws/fhir2/R4/Patient/{uuid}` | PatientHeader, ObservationFormsContainer |
| `['cdssConfig']` | CDSS server config | ConsultationPad |

After stop/edit submit: `dispatchConsultationSaved()` triggers `refetch()` on the medications query.

---

## 11. Stopped Medication Display

Stopped medications appear in the "All" tab of MedicationsTable with:

```ts
// From FHIR extension: http://fhir.bahmni.org/ext/medicationRequest/dateStopped
"Stopped on 02 Jul 2025"

// From statusReason.text (mapped from orderReasonNonCoded on discontinuation order)
"due to Side effects"
```

Status display:
- `stopped` → "Stopped on [date]" + "due to [reason]"
- `cancelled` → same display
- No strikethrough styling (deliberately removed for clarity)

---

## 12. Key Decisions & Tradeoffs

| Decision | Rationale |
|---|---|
| CustomEvent for cross-bundle communication | Widgets and clinical-app are separate bundles; cannot share module state |
| `onDirectSubmit` for stop (not bundle) | Stop is a single FHIR operation; no encounter creation needed |
| Bundle path for edit | Edit needs to associate with an encounter (REVISE action in bundle) |
| No `PUT` on MedicationRequest | FHIR-aligned: edits create new resource with `priorPrescription` |
| Privilege → hide (not disable) | UX: if user can't do it, don't show it |
| encounterSessionStore as singleton | Both PatientHeader and DashboardSection are in clinical-app bundle; safe to share |
| Stop date min = effectiveStartDate (REST) | FHIR doesn't expose this; OpenMRS REST does |
| Stop date max = today | OpenMRS `discontinueOrder` rejects future dates |
| Config-driven actions | Deployments can have different action sets without code changes |

---

## 13. Files Changed Summary

### Frontend (PR #411 — Edit, PR #474 — Stop)

| File | Change |
|---|---|
| `packages/bahmni-widgets/src/medications/components/actionHandlers.ts` | Edit + Stop dispatch logic |
| `packages/bahmni-widgets/src/medications/components/Actions.tsx` | Multi-action menu, privilege filter, danger styling |
| `packages/bahmni-widgets/src/medications/MedicationsTable.tsx` | Encounter gating, editableMedications, disabledActionTypes |
| `apps/clinical/src/components/forms/stopMedications/StopMedicationForm.tsx` | Stop UI |
| `apps/clinical/src/components/forms/stopMedications/index.ts` | InputControl registration with onDirectSubmit |
| `apps/clinical/src/stores/stopMedicationsStore.ts` | Zustand store for stop form |
| `apps/clinical/src/services/stopMedicationService.ts` | $stop FHIR API + ValueSet fetch |
| `apps/clinical/src/components/forms/medicationRequest/store.ts` | pendingFhirEdits, change detection |
| `apps/clinical/src/components/consultationPad/index.tsx` | editOnly filter, directSubmit vs bundle |
| `packages/bahmni-services/src/encounterSessionService/encounterSessionStore.ts` | Pub/sub singleton |

### Config PRs

| Repo | Change |
|---|---|
| standard-config | `actions: [stop, edit]` on treatment control in general.json + `stopMedications` in app.json |
| clinic-config | Same as standard-config |

### FHIR2 OMOD (PR #71 — Edit, separate PR — Stop translator)

| File | Change |
|---|---|
| `BahmniMedicationRequestTranslatorImpl.java` | REVISE action handling (edit), statusReason/dateStopped/note from discontinuation order (stop) |
| `BahmniMedicationRequestTranslatorImplTest.java` | Tests for above |

---

## 14. Testing

- **Frontend (Edit)**: PR #411 — unit tests for store, service, components
- **Frontend (Stop)**: PR #474 — 48 clinical tests + 13 widget tests
- **FHIR2 OMOD (Edit)**: PR #71 — ArgumentCaptor tests, verify() calls, REVISE status tests
- **FHIR2 OMOD (Stop translator)**: 30 passing tests (5 new for toFhirResource)

---

*Document compiled from PRs #411, #468, #474 and local codebase analysis.*

---

## 15. Standard Config & Clinic Config — Deep Dive

Both configs (`standard-config` and `clinic-config`) follow the same structure. They live in the Bahmni configuration repo, served as static JSON files by the `/bahmni_config/` endpoint.

### 15.1 Config URL Structure

```
/bahmni_config/openmrs/apps/clinical/v2/app.json       → main clinical config
/bahmni_config/openmrs/apps/clinical/v2/general.json   → dashboard widget config
/bahmni_config/openmrs/apps/clinical/v2/medication.json → medication-specific config
```

All URLs are rooted at:
```ts
// apps/clinical/src/constants/app.ts
export const CLINICAL_V2_CONFIG_BASE_URL = '/bahmni_config/openmrs/apps/clinical/v2';
```

### 15.2 app.json — Registers InputControls on ConsultationPad

The `consultationPad.inputControls` array tells the pad which forms are available. Each entry maps to a registered `InputControl` key in the frontend.

```json
{
  "consultationPad": {
    "inputControls": [
      {
        "type": "encounterDetails",
        "metadata": { "defaultEncounterType": "OPD" }
      },
      {
        "type": "medications",
        "displayName": "Medications"
      },
      {
        "type": "stopMedications",
        "displayName": "Stop Medication"
      }
    ]
  }
}
```

`stopMedications` must be present here for the stop form to load when `editOnly: 'stopMedications'` is in the event payload. Without it, clicking Stop does nothing — the ConsultationPad finds no matching control.

### 15.3 general.json — Registers Actions on the Dashboard Widget

The `actions` array on the treatment/medications widget drives which buttons appear per row.

```json
{
  "type": "treatment",
  "requiredPrivileges": ["Get Orders"],
  "config": {
    "actions": [
      {
        "type": "edit",
        "label": "Edit",
        "encounterType": "Consultation",
        "requiredPrivilege": ["Edit Orders"]
      },
      {
        "type": "stop",
        "label": "Stop",
        "encounterType": "Consultation",
        "requiredPrivilege": ["Edit Orders"]
      }
    ]
  }
}
```

The `encounterType` in the action config is sent in the `startConsultation` event detail — it tells ConsultationPad which encounter type to create/match.

### 15.4 medication.json — Controls Stop Form Fields

This config drives which fields appear in the Stop Medication form and whether they are mandatory:

```json
{
  "stopMedicationFields": {
    "stopDate": {
      "isVisible": true,
      "isMandatory": true
    },
    "stopReason": {
      "isVisible": true,
      "isMandatory": false
    },
    "note": {
      "isVisible": true,
      "isMandatory": false
    }
  },
  "stopReasons": [
    "Side effects",
    "Patient request",
    "Completed course"
  ]
}
```

The `stopReasons` array is the **fallback** if the FHIR ValueSet (`Stopped Order Reason`) returns no concepts. The frontend always tries the ValueSet first.

### 15.5 Standard vs Clinic Config Difference

Both use the same JSON structure. The distinction:

| Aspect | standard-config | clinic-config |
|---|---|---|
| Target | Standard Bahmni deployments | IOM clinic deployments |
| PRs | #119 (edit), BAH-4689 branch (stop) | #253 (edit), BAH-4689 branch (stop) |
| Encounter type | May differ per deployment | May differ per deployment |
| Privileges | `Edit Orders` | `Edit Orders` |

The frontend reads whichever config the server serves — zero code difference between deployments.

---

## 16. FHIR2 OMOD — Deep Dive

The Bahmni FHIR2 OMOD (`bahmni-module-fhir2-addl-extension`) is the OpenMRS module that translates between OpenMRS domain objects and FHIR R4 resources.

### 16.1 Edit Medication — REVISE action

**PR #71** added support for `action=REVISE` in `BahmniMedicationRequestTranslatorImpl`.

When the frontend sends a FHIR transaction bundle with a new `MedicationRequest` that has `priorPrescription` referencing the original:

```json
{
  "resourceType": "MedicationRequest",
  "status": "active",
  "priorPrescription": {
    "reference": "MedicationRequest/abc-123-uuid"
  },
  ...
}
```

The OMOD translator detects `priorPrescription` and:
1. Creates a new `DrugOrder` with `action = REVISE`
2. Sets `previousOrder` to the original order
3. OpenMRS handles the revision chain — original gets superseded

```java
// BahmniMedicationRequestTranslatorImpl.java
if (medicationRequest.hasPriorPrescription()) {
    String priorId = medicationRequest.getPriorPrescription().getReferenceElement().getIdPart();
    DrugOrder previousOrder = (DrugOrder) orderService.getOrderByUuid(priorId);
    if (previousOrder != null && ACTIVE.equals(previousOrder.getStatus())) {
        newOrder.setAction(Order.Action.REVISE);
        newOrder.setPreviousOrder(previousOrder);
    }
}
```

**Review comments addressed (Suma's review)**:
- Used `else if (ACTIVE)` guard — future-proofs for `REFILL` action
- Added `ArgumentCaptor` in future-date stop test
- Added `verify()` calls for translator delegation tests
- All REVISE tests explicitly set `status=ACTIVE` on the previous order

### 16.2 Stop Medication — `$stop` Custom Operation

The `$stop` FHIR operation is a custom operation added to the OMOD. It accepts a `Parameters` FHIR resource and creates a `DISCONTINUE` order in OpenMRS.

```
POST /openmrs/ws/fhir2/R4/MedicationRequest/{uuid}/$stop
```

```json
{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "reason",        "valueString": "Side effects" },
    { "name": "effectiveDate", "valueDate": "2025-07-02" },
    { "name": "note",          "valueString": "Patient requested" }
  ]
}
```

OpenMRS creates a `DrugOrder` with:
- `action = DISCONTINUE`
- `previousOrder` = the original drug order
- `orderReasonNonCoded` = reason string
- `dateStopped` = effectiveDate
- `commentToFulfiller` = note

### 16.3 FHIR Translator Fix — Reading Stopped Data Back

**Problem**: When reading a stopped `MedicationRequest` back via FHIR GET, the stop reason and note lived on the **discontinuation order**, not the original. The translator only looked at the original order.

**Fix in `toFhirResource()`**:
```java
// Find the discontinuation order for this medication
Order discontinuationOrder = orderService.getAllOrdersByPatient(patient).stream()
    .filter(o ->
        o.getAction() == Order.Action.DISCONTINUE &&
        Objects.equals(o.getPreviousOrder(), order)
    )
    .findFirst()
    .orElse(null);

if (discontinuationOrder != null) {
    // statusReason ← orderReasonNonCoded from discontinuation order
    fhirMedReq.setStatusReason(toFhirCodeableConcept(
        discontinuationOrder.getOrderReasonNonCoded()
    ));
    // dateStopped as FHIR extension
    fhirMedReq.addExtension(
        "http://fhir.bahmni.org/ext/medicationRequest/dateStopped",
        new DateType(discontinuationOrder.getDateStopped())
    );
    // note ← commentToFulfiller
    if (discontinuationOrder.getCommentToFulfiller() != null) {
        fhirMedReq.addNote(new Annotation()
            .setText(discontinuationOrder.getCommentToFulfiller()));
    }
}
```

### 16.4 FHIR MedicationRequest Status Mapping

| OpenMRS DrugOrder state | FHIR `status` |
|---|---|
| `ACTIVE` | `active` |
| `ON_HOLD` | `on-hold` |
| `DISCONTINUED` | `stopped` |
| `EXPIRED` | `completed` |
| `VOIDED` | `cancelled` |

**Known edge case (BAH-4715)**: When `dateStopped < effectiveStartDate` at minute granularity, the status translator returns `CANCELLED` instead of `STOPPED` — not caused by our PRs.

### 16.5 `dateStopped` Extension Pipeline

The `dateStopped` value travels from OMOD through multiple layers to the UI:

```
OpenMRS DrugOrder.dateStopped
  → FHIR2 OMOD: extension "http://fhir.bahmni.org/ext/medicationRequest/dateStopped"
  → @bahmni/services medicationRequestParser: dateStopped extracted from extension
  → @bahmni/widgets MedicationsTable: "Stopped on [date]" display
```

---

## 17. Event-Based Architecture — Deep Dive

### 17.1 Why Events?

Bahmni v2 is a **micro-frontend** architecture. The medications widget (`@bahmni/widgets`) and the clinical app (`@bahmni/clinical-app`) are **separate webpack bundles** loaded independently. They cannot:
- Import from each other at build time
- Share React Context (different React roots)
- Share module-level singletons (different JS modules)

Events on `globalThis`/`window` are the only reliable cross-bundle channel.

### 17.2 Two Events, Two Directions

```
                    startConsultation (write intent)
widgets ──────────────────────────────────────────────────▶ clinical-app
        ◀──────────────────────────────────────────────── consultationSaved (refresh)
```

### 17.3 `startConsultation` Event — Full Spec

**Defined in**: `apps/clinical/src/events/startConsultation/`
**Dispatched by**: `@bahmni/widgets` (actionHandlers.ts)
**Consumed by**: `ConsultationPage.tsx`

```ts
// Payload type (EncounterSessionStartContext)
{
  encounterType?: string;           // e.g. "OPD"
  editOnly?: string;                // 'stopMedications' | 'medications' | undefined
  editTitle?: string;               // i18n key for the form title
  editEncounterUuid?: string;       // encounter the medication belongs to

  // Edit medication specific
  editMedications?: MedicationRequest[];

  // Stop medication specific
  stopMedication?: MedicationRequest;
  stopMedicationStartDate?: Date;

  // Can carry any additional properties
  [key: string]: unknown;
}
```

**When `editOnly` is set**, ConsultationPad filters its registered input controls to show only the matching one:
```ts
const activeEntries = editOnly
  ? registry.filter(entry => entry.type === editOnly)
  : registry.filter(entry => encounterType);
```

### 17.4 `consultation:saved` Event — Full Spec

**Defined in**: `packages/bahmni-services/src/events/consultationEvents.ts`
**Dispatched by**: `ConsultationPad` after successful submit
**Consumed by**: All dashboard widgets that need to refresh

```ts
export interface ConsultationSavedEventPayload {
  patientUUID: string;
  updatedResources: {
    conditions: boolean;
    allergies: boolean;
    medications: boolean;               // true when stop or edit medication saved
    immunizationHistory?: boolean;
    serviceRequests: Record<string, boolean>;
  };
  updatedConcepts: Map<string, string>; // UUID → concept name, for obs widgets
}
```

**`updatedConcepts` dual-purpose design** (noted in code comments):
- Keys (UUID): for widgets configured with concept UUIDs (e.g. Observations widget)
- Values (name): for widgets configured with concept names (e.g. VitalFlowSheet)

**`captureUpdatedResources()`** in ConsultationPad determines what was updated:
```ts
function captureUpdatedResources(entries: InputControl[]) {
  return {
    medications: hasData('medication') || hasData('vaccination') || hasData('stopMedications'),
    // ...
  };
}
```

**Deferred dispatch with `setTimeout(fn, 0)`**:
```ts
// Deferred to next event loop tick — lets UI updates complete first
export const dispatchConsultationSaved = (payload): void => {
  const event = new CustomEvent(CONSULTATION_SAVED_EVENT, { detail: payload });
  window.dispatchEvent(event);   // synchronous in this version
};
```

### 17.5 Memory Leak Prevention

The `useSubscribeConsultationSaved` hook uses a **ref pattern** to prevent stale closures without re-subscribing:

```ts
export const useSubscribeConsultationSaved = (callback, deps = []) => {
  const callbackRef = useRef(callback);

  // Always keep ref current (no re-subscribe)
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event: Event) => {
      callbackRef.current((event as CustomEvent).detail);  // uses latest callback
    };
    window.addEventListener(CONSULTATION_SAVED_EVENT, handler);
    return () => window.removeEventListener(CONSULTATION_SAVED_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);  // only re-subscribes when deps change (not on every callback change)
};
```

### 17.6 Complete Event Flow (Stop Medication)

```
1. User clicks Stop ──────────────────────────────────────────── @bahmni/widgets
   actionHandlers.ts dispatches 'startConsultation'
         ↓ (globalThis event)
2. ConsultationPage.tsx receives event ───────────────────────── @bahmni/clinical-app
   setEncounterSessionStartContext(event.detail)
   setIsActionAreaVisible(true)
         ↓ (React state)
3. ConsultationPad renders with editOnly='stopMedications'
   getActiveEntries filters to only StopMedicationForm
         ↓
4. StopMedicationForm renders, Zustand store seeded
   TanStack Query: fetches date range + stop reasons
         ↓ (user fills form, clicks Save)
5. ConsultationPad.handleSubmit()
   detectsOnDirectSubmit on stopMedications entry
   calls stopMedication() → POST $stop FHIR API
         ↓ (API success)
6. dispatchConsultationSaved({ medications: true })
         ↓ (window event)
7. MedicationsTable.useSubscribeConsultationSaved() ──────────── @bahmni/widgets
   calls refetch() → TanStack Query re-fetches medications
         ↓
8. Row updates: shows "Stopped on [date] due to [reason]"
```

---

## 18. TanStack Query — Deep Dive

### 18.1 QueryClient Configuration

```ts
// apps/clinical/src/config/tanstackQuery.ts
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 min — data fresh, no re-fetch
      gcTime: 10 * 60 * 1000,             // 10 min — evict from cache (formerly cacheTime)
      retry: (failureCount) => failureCount < 2,         // max 2 retries
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000), // exponential backoff, max 30s
      refetchOnMount: false,               // no re-fetch when component mounts
      refetchOnReconnect: true,            // re-fetch when network restores
      refetchOnWindowFocus: false,         // no re-fetch on tab switch
      refetchIntervalInBackground: false,  // no polling in background
    },
  },
};
```

**Key design choice**: `refetchOnMount: false` — data fetched once, lives in cache. Widgets show stale data until explicitly invalidated or refetched.

### 18.2 Medications Query (MedicationsTable)

```ts
const { data: medications, refetch } = useQuery({
  queryKey: ['medications', patientUUID, code, encounterUuids],
  queryFn: () => fetchMedications({ patientUUID, code, encounterUuids }),
  enabled: !!patientUUID,
});

// Re-fetch triggered by consultationSaved event
useSubscribeConsultationSaved((payload) => {
  if (payload.updatedResources.medications) {
    refetch();
  }
}, [refetch]);
```

The query key includes `encounterUuids` — different tabs (current visit vs all) use different query keys and are cached independently.

### 18.3 Stop Form Queries

```ts
// Stop reasons (ValueSet expand)
const { data: stopReasons } = useQuery({
  queryKey: ['stopReasons'],
  queryFn: fetchStopReasons,
  staleTime: Infinity,  // concepts don't change — cache forever
});

// Order dates for date picker range
const { data: orderDates } = useQuery({
  queryKey: ['orderDates', stopMedication?.id],
  queryFn: () => fetchOrderDates(stopMedication!.id!),
  enabled: !!stopMedication?.id,
});

// Medication config (field visibility, fallback reasons)
const { data: medConfig } = useQuery({
  queryKey: ['medicationConfig'],
  queryFn: fetchMedicationConfig,
});
```

### 18.4 Patient Context Query (PR on current branch)

Added in the newer version of `ObservationFormsContainer`:

```ts
const { data: fhirPatient } = useQuery({
  queryKey: ['patient', patientUUID],
  queryFn: () => getFormattedPatientById(patientUUID!),
  enabled: !!patientUUID,
});
```

**Shares the same cache key** as `ConsultationPage`'s patient query — no duplicate API call even though two components need the same data.

### 18.5 Why No `useMutation`?

All write operations (stop, edit submit) happen inside:
- `onDirectSubmit` callbacks (registered with the input control)
- `submitConsultation()` (the bundle submission function)

These are imperative async functions called from event handlers, not React render cycles. TanStack `useMutation` would add little value here — there's no loading state to track in the component tree for these operations.

After mutation: `dispatchConsultationSaved()` + targeted `refetch()` on specific queries.

### 18.6 Cache Invalidation Strategy

| Operation | How cache is refreshed |
|---|---|
| Stop medication saved | `consultationSaved` → `medications: true` → `refetch()` |
| Edit medication saved | `consultationSaved` → `medications: true` → `refetch()` |
| Conditions/diagnoses saved | `consultationSaved` → `conditions: true` → conditions query `refetch()` |
| Episode of care change | `queryClient.invalidateQueries(['encounters-for-eoc'])` |
| Patient navigation | New `patientUUID` → new query key → fresh fetch automatically |

---

## 19. Encounter / Visit Gating — Deep Dive

### 19.1 The Full Chain

```
FHIR API
  → useEncounterSession() hook (in PatientHeader)
  → encounterSessionStore (singleton in @bahmni/services)
  → DashboardSection reads store
  → passes props to every widget
  → MedicationsTable enforces gating per row
```

### 19.2 useEncounterSession Logic

Runs in `PatientHeader`. Three API calls:

1. **Session duration GP**: `GET /openmrs/ws/rest/v1/globalproperty/bahmni.encounterSession.duration`
   → Returns session window in minutes (e.g. 90)

2. **Active encounters**: `GET /ws/fhir2/R4/Encounter?patient={uuid}&status=in-progress`
   → Returns all in-progress encounters for the patient

3. **Match algorithm**:
```
For each encounter in (sorted by period.start DESC):
  if encounter.type matches config encounterType
    if encounter.start is within (now - sessionDuration)
      if encounter.location matches user location → MATCHED
      if location mismatch but within session → LOCATION_MISMATCH
      if provider mismatch but within session → PROVIDER_MISMATCH
if no match but active visit exists → NO_MATCHING_ENCOUNTER
if no active visit → NO_ACTIVE_VISIT
```

### 19.3 Match Reason → Action Gate Mapping

| Match Reason | canEditOrCreate | disableActions | Edit button | Stop button | Encounter used |
|---|---|---|---|---|---|
| `MATCHED` | ✅ | ❌ | Enabled (if same encounter) | Enabled | Existing encounter |
| `LOCATION_MISMATCH` | ✅ | ❌ | Enabled (if same encounter) | Enabled | New encounter |
| `PROVIDER_MISMATCH` | ✅ | ❌ | Enabled (if same encounter) | Enabled | New encounter |
| `NO_MATCHING_ENCOUNTER` | ✅ | ❌ | Enabled (if same encounter) | Enabled | New encounter |
| `NO_ACTIVE_VISIT` | ❌ | ✅ | **Hidden/Disabled** | **Disabled** | N/A |

### 19.4 Encounter UUID Fix (PR #468)

**The bug**: `CONSULTATION_ENCOUNTER_TYPE_UUID` was hardcoded as `d34fe3ab-...` — only matched the standard deployment's encounter type UUID.

**Root cause**: The encounter type UUID varies between environments (standard, dev-lite, clinic). Hardcoding it in constants caused sessions to never match on other deployments.

**Fix**: Dynamically resolve UUID from config:
```ts
// PatientHeader.tsx
const encounterTypeUUID = clinicalConfig.consultationPad.inputControls
  .find(c => c.type === 'encounterDetails')
  ?.metadata?.defaultEncounterType;

// encounterTypeUUID now correctly resolves to:
// "d34fe3ab-..." on standard
// "xyz-abc-..." on dev-lite
// whatever is in the config on any deployment
```

Constants `CONSULTATION_ENCOUNTER_TYPE_UUID` fully removed from:
- `constants.ts`
- `encounterSessionService/index.ts`
- `@bahmni/services/index.ts`

### 19.5 Edit-Specific Gate: Same Encounter Check

Even when `canEditOrCreate=true`, edit is only enabled for medications from the **current encounter**:

```ts
// MedicationsTable.tsx
const isEditable = (row: MedicationRow) =>
  editableMedications.some(m => m.id === row.id);

// editableMedications is computed as:
const editableMedications = activeAndScheduledMedications.filter(m =>
  (m.status === 'active' || m.status === 'on-hold') &&
  m.fhirResource?.encounter?.reference?.endsWith(activeEncounterUuid)
);
```

If a medication was prescribed in a previous visit or by a different provider, its encounter UUID won't match `activeEncounterUuid` — the edit button is disabled.

---

## 20. OpenMRS Coded Concepts — Deep Dive

### 20.1 What Are Coded Concepts?

In OpenMRS, a "coded" concept is one whose answer is another concept (rather than free text, a number, or a date). Stop reasons are coded — users pick from a predefined set of concepts, each with a UUID.

### 20.2 Stop Reasons Come from an OpenMRS ConvSet

Stop reasons are stored in the **OpenMRS concept dictionary** as a **ConvSet** — a concept whose class is `ConvSet` with `set=true` and set members (the individual reason concepts).

```
OpenMRS Concept Dictionary
  └── "Stopped Order Reason"  [class=ConvSet, set=true]
        ├── "Side effects"     [class=Misc]
        ├── "Patient request"  [class=Misc]
        └── "Completed course" [class=Misc]
```

The **FHIR2 OMOD** (`BahmniFhirValueSetServiceImpl`) exposes this ConvSet as a FHIR `ValueSet`. When `$expand` is called, it reads `concept.getSetMembers()` and maps each member to a `ValueSet.expansion.contains` entry:

```java
// BahmniFhirValueSetServiceImpl.java
private ValueSet.ValueSetExpansionComponent createExpansion(Concept concept) {
    Collection<Concept> setMembers = concept.getSetMembers(); // ← reads ConvSet members
    for (Concept memberConcept : setMembers) {
        addConceptHierarchically(memberConcept, contains, ...);
    }
    // expansion.contains = the reason concepts
}
```

### 20.3 Why Only ConvSet Works (Not Other Concept Classes)

This tripped us up during development — creating the concept with class `Question`, `Misc`, or `Finding` returned an empty expansion. **Only ConvSet worked.**

The reason is `getSetMembers()`:

| Concept Class | `set=true` by default | Has set members | `$expand` result |
|---|---|---|---|
| **ConvSet** | ✅ Designed for it | ✅ Returns members | ✅ Populated |
| `Question` | ❌ No | ❌ Empty | ❌ Empty → fallback |
| `Misc` | ❌ No | ❌ Empty | ❌ Empty → fallback |
| `Finding` | ❌ No | ❌ Empty | ❌ Empty → fallback |

The FHIR2 code does **not** check `conceptClass == ConvSet` anywhere — it would work with any concept that has `set=true` and set members. But **ConvSet is the only OpenMRS concept class specifically designed** for grouping concepts. Other classes are leaf concepts with answers, not set members.

**TL;DR**: Use `ConvSet` class when creating the `Stopped Order Reason` concept in OpenMRS. Anything else gives an empty expansion.

### 20.4 Frontend Fetch Flow

```
Step 1: Search for the ConvSet by title
GET /openmrs/ws/fhir2/R4/ValueSet?title=Stopped+Order+Reason
→ Returns FHIR Bundle with the ConvSet exposed as a ValueSet resource
→ Extract the ValueSet UUID (= ConvSet concept UUID)

Step 2: Expand (fetch set members)
GET /openmrs/ws/fhir2/R4/ValueSet/{uuid}/$expand
→ Returns expansion.contains[] = the set member concepts
→ Each item: { code: "concept-uuid", display: "Side effects" }
```

**Frontend service code:**
```ts
// stopMedicationService.ts
export async function fetchStopReasons(): Promise<StopReason[]> {
  const searchBundle = await get<Bundle>(STOP_REASON_VALUESET_URL);
  const valueSet = searchBundle.entry?.[0]?.resource as ValueSet;
  if (!valueSet?.id) return [];

  const expanded = await get<ValueSet>(STOP_REASON_VALUESET_EXPAND_URL(valueSet.id));
  return (expanded.expansion?.contains ?? []).map(c => ({
    uuid: c.code ?? '',
    display: c.display ?? '',
  }));
}
```

**Fallback**: If the ConvSet doesn't exist in OpenMRS or has no members, `fetchStopReasons()` returns `[]` and the frontend falls back to the `medication.json` config's `stopReasons` string array.

### 20.5 Concept Sent to API

When the user selects a stop reason and clicks Save, the selected concept's `display` string (not UUID) is sent as `valueString` in the `$stop` Parameters:

```json
{ "name": "reason", "valueString": "Side effects" }
```

The FHIR2 OMOD stores this in `orderReasonNonCoded` (free text) rather than `orderReason` (coded concept reference). This is intentional — it avoids requiring the concept to exist in every deployment.

### 20.6 Why `orderReasonNonCoded` Not `orderReason`?

| Field | Type | Requires concept in OpenMRS |
|---|---|---|
| `orderReason` | Coded concept (UUID reference) | Yes — concept must exist |
| `orderReasonNonCoded` | Free text string | No |

Using `orderReasonNonCoded` means stop reasons work even on deployments that don't have the exact concept. The display string is stored and shown back as-is.

### 20.7 Reading the Reason Back via FHIR

When the OMOD sends the stopped medication back via FHIR GET, the `statusReason` is mapped from the discontinuation order's `orderReasonNonCoded`:

```java
// BahmniMedicationRequestTranslatorImpl.java
fhirMedReq.setStatusReason(new CodeableConcept()
    .setText(discontinuationOrder.getOrderReasonNonCoded()));
```

Frontend reads it as:
```ts
// medicationRequestParser.ts
const stopReason = fhirResource.statusReason?.text;  // "Side effects"
```

And displays: `"due to Side effects"`

### 20.8 Concept in `updatedConcepts` Map (consultationSaved event)

When an observation-type form is saved, `updatedConcepts` carries a `Map<UUID, name>` so widgets know which concepts changed. For medication stop, `updatedConcepts` is an empty `Map` — stop medications don't update obs concepts, they update `MedicationRequest` resources.

Widgets distinguish by checking `updatedResources.medications` (boolean), not `updatedConcepts`.

---

*Sections 15–20 added: Standard/Clinic Config, FHIR2 OMOD, Event Architecture, TanStack Query, Encounter Gating, OpenMRS Coded Concepts.*
