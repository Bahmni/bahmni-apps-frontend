# CDSS Implementation Plan - Event-Driven with Item-Level Storage

## Overview

Implement Clinical Decision Support System (CDSS) framework for Bahmni Apps Frontend. The system will:

- Support event-driven CDSS checks across input controls
- Store CDS cards at item level (each selected item has its own cards)
- Display CDS cards inline in forms
- Block submission on critical alerts
- Build comprehensive FHIR bundles from all active controls
- Be extensible for future input controls and events

---

## Implementation Steps

### 1. Create CDSS Type Definitions

**File**: `apps/clinical/src/models/cdss.ts`

Create TypeScript interfaces for CDSS system:

- `ContextResourceMapping`: Mapping for resource types in context
  - `type: string` - FHIR resourceType (e.g., "MedicationRequest", "Immunization")
  - `attribute: string` - Context attribute name (e.g., "draftOrders", "medications")
- `CDSSServiceConfig`: Configuration for individual CDSS service
  - `name: string` - Service name (used as hook identifier)
  - `description: string` - Service description
  - `contextResourceMap?: ContextResourceMapping[]` - Optional resource filtering rules
  - `prefetch?: { [key: string]: string }` - Optional prefetch templates
- `CDSSServerConfig`: Configuration for CDSS server
  - `server: string` - Server identifier
  - `url: string` - Base API URL
  - `services: CDSSServiceConfig[]` - Array of service configurations
- `CDSSRule`: Rule configuration in input control config
  - `event: string` - Event name (e.g., "onSelect", "onSave")
  - `server: string` - Server identifier to use
  - `service: string` - Service name
- `CDSCard`: CDS Hooks card structure
  - `summary: string` - Card summary text
  - `indicator: 'info' | 'warning' | 'critical'` - Severity level
  - `source: { label: string }` - Source attribution
  - `suggestions?: any[]` - Optional suggestions
- `CDSHooksRequest`: CDS Hooks API request format
  - `hook: string` - Hook identifier (service name)
  - `hookInstance: string` - Unique instance ID
  - `context: { patientId: string, visitId?: string, episodeId?: string, [key: string]: any }` - Clinical context with dynamic attributes from contextResourceMap
  - `prefetch?: { [key: string]: string }` - Optional prefetch data
- `CDSSContext`: Context for CDSS invocation
  - `patientId: string` (required)
  - `visitId?: string` (optional)
  - `episodeId?: string` (optional)
- `CDSSCheckEventDetail`: Event payload for CDSS check requests
  - `controlKey: string` - Input control identifier
  - `itemId: string` - Selected item ID
  - `rules: CDSSRule[]` - Array of CDSS rules to execute (pre-filtered by event type)
  - **Note**: Rules are passed directly instead of event string for efficiency - avoids duplicate rule lookups in ConsultationPad
- `CDSSResultsEventDetail`: Event payload for CDSS results broadcast
  - `cards: CDSCard[]` - Array of CDS cards returned from CDSS service
  - `triggerItemId: string` - ID of the item that triggered the CDSS check
  - `controlKey: string` - Input control that initiated the request

---

### 2. Create CDSS Service Layer

**File**: `apps/clinical/src/services/cdssService.ts`

Implement CDSS API interaction service:

**Function: `loadCDSSServersConfig(): Promise<CDSSServerConfig[]>`**

- Fetch server configuration from `/bahmni_config/openmrs/apps/clinical/v2/cdss-servers.json`
- Cache configuration in memory after first load
- Return array of server configs with services

**Function: `findServiceConfig(serverName: string, serviceName: string): Promise<CDSSServiceConfig | null>`**

- Load servers configuration using `loadCDSSServersConfig`
- Find server by `serverName`
- Find service within server by `serviceName`
- Return service config or null if not found

**Function: `buildContextFromResourceMap(bundle: Bundle, resourceMap?: ContextResourceMapping[]): object`**

- If `resourceMap` is empty or undefined, return empty object
- For each mapping in `resourceMap`:
  - Filter bundle entries where `resource.resourceType === mapping.type`
  - Create Bundle with filtered entries
  - Add to context with key `mapping.attribute`
- Return context object with dynamic attributes

Example:

```typescript
// Input: resourceMap = [{type: "MedicationRequest", attribute: "draftOrders"}]
// Output: { draftOrders: { resourceType: "Bundle", entry: [...] } }
```

**Function: `invokeCDSSRule(rule: CDSSRule, context: CDSSContext, dataBundle: Bundle): Promise<CDSCard[]>`**

- Load service config using `findServiceConfig(rule.server, rule.service)`
- Build filtered context using `buildContextFromResourceMap(dataBundle, serviceConfig.contextResourceMap)`
- Build API URL: `${serverConfig.url}/${serviceConfig.name}`
- Create CDS Hooks request:
  - `hook`: service name
  - `context`: base context + filtered resources
  - `prefetch`: from service config
- POST request to CDSS endpoint
- Parse response and return CDSCard array
- Return empty array on errors (don't block UI)

---

### 3. Extend Clinical Configuration Schema

**File**: `apps/clinical/src/providers/clinicalConfig/schema.json`

Add CDSS support to input controls configuration:

- Add `cdss` as optional array property to inputControls schema
- Define schema for CDSS rule object:
  ```json
  {
    "type": "object",
    "properties": {
      "event": { "type": "string" },
      "server": { "type": "string" },
      "service": { "type": "string" }
    },
    "required": ["event", "server", "service"]
  }
  ```

**File**: `apps/clinical/src/providers/clinicalConfig/models.ts`

Update TypeScript interfaces:

- Add `cdss?: CDSSRule[]` to `InputControl<T>` interface

---

### 4. Create CDS Card Display Component

**File**: `apps/clinical/src/components/common/CDSCardAlert.tsx`

Create reusable component for displaying CDS cards:

```typescript
import { InlineNotification } from '@carbon/react';

const CDSCardAlert = ({ card }) => {
  // Map CDS indicator to Carbon notification kind
  const getNotificationKind = (indicator) => {
    switch(indicator) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <InlineNotification
      kind={getNotificationKind(card.indicator)}
      title={card.summary}
      subtitle={card.source?.label}
      lowContrast={true}
      hideCloseButton={true}
    >
      {/* Display suggestions if present */}
      {card.suggestions?.map((suggestion, idx) => (
        <div key={idx} className="cds-suggestion">
          <span>{suggestion.label}</span>
        </div>
      ))}
    </InlineNotification>
  );
};

export default CDSCardAlert;
```

Key features:

- Maps indicator to Carbon notification kind (critical → error)
- Displays card summary as title
- Shows source label as subtitle
- Renders suggestions within the notification
- Uses lowContrast for better visual hierarchy
- No close button (alerts are informational)

---

### 5. Update Input Control Interface

**File**: `apps/clinical/src/components/forms/models.ts`

Extend `InputControl` interface with CDSS methods:

```typescript
export interface InputControl {
  key: string;
  component: React.ComponentType<any>;
  reset: () => void;
  validate: () => boolean;
  hasData: () => boolean;
  subscribe: (cb: () => void) => () => void;
  createBundleEntries?: (ctx: EncounterContext) => BundleEntry[];

  // NEW: CDSS support
  updateItemCDSCards?: (itemId: string, cards: CDSCard[]) => void;
  hasCriticalCDSCards?: () => boolean;
}
```

These methods provide abstraction for ConsultationPad to interact with input controls without knowing their internal store implementation.

**Important: Bundle Entry Creation with Item IDs**
Each input control already has a `createBundleEntries` method that uses **existing resource creators**:

- Vaccinations → `createMedicationRequestEntries` → `createMedicationRequestResource`
- Medications → `createMedicationRequestEntries` → `createMedicationRequestResource`
- Diagnoses → `createDiagnosisBundleEntries` → `createEncounterDiagnosisResource`
- Conditions → `createConditionsBundleEntries` → `createEncounterConditionResource`
- Allergies → `createAllergiesBundleEntries` → `createEncounterAllergyResource`

**For CDSS, we need to ensure the resource ID matches the item's store ID:**

Example for vaccinations (using existing resource creator):

```typescript
// In vaccinations control's createBundleEntries
createBundleEntries: (ctx) => {
  const selectedVaccinations =
    useVaccinationStore.getState().selectedVaccinations;

  return selectedVaccinations.map((vaccination) => {
    const resourceId = vaccination.id; // Use item's store ID
    const medicationResource = createMedicationRequestResource(
      vaccination,
      ctx.encounterSubject,
      ctx.encounterReference,
      ctx.practitionerReference,
      ctx.statDurationInMilliseconds,
    );

    // Set resource ID to match item ID for CDSS correlation
    medicationResource.id = resourceId;

    return {
      fullUrl: `urn:uuid:${resourceId}`,
      resource: medicationResource,
      request: {
        method: "POST",
        url: "MedicationRequest",
      },
    };
  });
};
```

**Key Point:** The resource ID must match the item's store ID so CDSS responses can be correlated back to specific items.

**Note:** Bahmni's `createMedicationRequestResource` creates resources with `medicationReference` (not `medicationCodeableConcept`):

```typescript
{
  resourceType: "MedicationRequest",
  medicationReference: {
    reference: "Medication/{medicationId}"
  },
  // ... other fields
}
```

---

### 6. Update Input Control Store for CDS Cards

**File**: `apps/clinical/src/components/forms/<input-control>/stores.ts`

**Extend data model:**

- Add `cdsCards?: CDSCard[]` to the input control's entry interface (e.g., `ImmunizationInputEntry`, `MedicationEntry`, etc.)

**Add store actions:**

- `updateItemCDSCards(itemId: string, cards: CDSCard[])`: Update specific item's cdsCards array
- `hasCriticalCDSCards()`: Check if any selected item has critical CDS cards

**Implementation pattern:**

```typescript
updateItemCDSCards: (itemId: string, cards: CDSCard[]) => {
  set((state) => ({
    selectedItems: state.selectedItems.map(item =>
      item.id === itemId ? { ...item, cdsCards: cards } : item
    ),
  }));
},

hasCriticalCDSCards: () => {
  const { selectedItems } = get();
  return selectedItems.some(item =>
    item.cdsCards?.some(card => card.indicator === 'critical')
  );
}
```

**Note**: Replace `selectedItems` with the actual store field name (e.g., `selectedImmunizations`, `selectedMedications`, etc.)

---

### 7. Update Input Control Registration

**File**: `apps/clinical/src/components/forms/<input-control>/index.ts`

Add CDSS methods to input control registration:

```typescript
registerInputControl({
  key: 'controlKey', // e.g., 'immunizationHistory', 'medications', etc.
  component: ControlFormComponent,
  reset: () => store().getState().reset(),
  validate: () => store().getState().validateAll(),
  hasData: () => store().getState().selectedItems.length > 0,
  subscribe: (cb: () => void) => store().subscribe(cb),
  createBundleEntries: (ctx: EncounterContext) => { ... },

  // NEW: CDSS methods
  updateItemCDSCards: (itemId: string, cards: CDSCard[]) =>
    store().getState().updateItemCDSCards(itemId, cards),
  hasCriticalCDSCards: () =>
    store().getState().hasCriticalCDSCards(),
});
```

**Example for immunization control:**

```typescript
registerInputControl({
  key: "immunizationHistory",
  component: ImmunizationForm,
  // ... existing fields
  updateItemCDSCards: (itemId, cards) =>
    store().getState().updateItemCDSCards(itemId, cards),
  hasCriticalCDSCards: () => store().getState().hasCriticalCDSCards(),
});
```

---

### 8. Add CDSS Event System to ConsultationPad

**File**: `apps/clinical/src/components/consultationPad/index.tsx`

**Event Names**:
- Use `cdss:check` for CDSS check events (colon notation for namespacing)
- Use `cdss:results` for CDSS results broadcast events

**Add comprehensive bundle builder:**

```typescript
const buildComprehensiveCDSSBundle = (): Bundle => {
  const entries: BundleEntry[] = [];

  // Collect bundle entries from all active input controls with data
  activeEntries.forEach((entry) => {
    if (entry.hasData() && entry.createBundleEntries) {
      const ctx: EncounterContext = {
        encounterUuid: encounterSessionStartContext.encounterUuid,
        patientUuid: encounterSessionStartContext.patientUuid,
        visitUuid: encounterSessionStartContext.visitUuid,
        encounterDatetime: encounterSessionStartContext.encounterDatetime,
        // ... other context fields
      };
      const controlEntries = entry.createBundleEntries(ctx);
      entries.push(...controlEntries);
    }
  });

  return {
    resourceType: "Bundle",
    type: "collection",
    entry: entries,
  };
};
```

**Setup CDSS event listener:**

```typescript
useEffect(() => {
  const handleCDSSEvent = async (event: CustomEvent<CDSSCheckEventDetail>) => {
    const { controlKey, itemId, rules } = event.detail;

    // Find the input control entry
    const entry = activeEntries.find((e) => e.key === controlKey);
    if (!entry) return;

    // Rules are already pre-filtered by event type in the input control
    // This avoids duplicate rule lookups and improves efficiency
    if (rules.length === 0) return;

    // Build context from encounter session
    const context: CDSSContext = {
      patientId: encounterSessionStartContext.patientUuid,
      visitId: encounterSessionStartContext.visitUuid,
      episodeId: encounterSessionStartContext.episodeUuid
    };

    // Build comprehensive bundle from ALL active controls
    const dataBundle = buildComprehensiveCDSSBundle();

    // Call CDSS for all rules in parallel for better performance
    // Rules array is already filtered by event type in the input control
    const cardPromises = rules.map((rule) =>
      invokeCDSSRule(rule, context, dataBundle).catch((error) => {
        // Log error but don't fail the entire batch
        console.error(`CDSS rule failed for ${rule.service}:`, error);
        return []; // Return empty array on error to not block other rules
      }),
    );

    // Wait for all rules to complete and flatten results
    const cardArrays = await Promise.all(cardPromises);
    const cards: CDSCard[] = cardArrays.flat();

    // Update the store via InputControl interface method
    if (entry.updateItemCDSCards) {
      entry.updateItemCDSCards(itemId, cards);
    }
  };

  window.addEventListener("cdss:check", handleCDSSEvent as EventListener);
  return () =>
    window.removeEventListener("cdss:check", handleCDSSEvent as EventListener);
}, [activeEntries, encounterSessionStartContext]);
```

**Update submission logic:**

```typescript
const hasCriticalCDSCards = (): boolean => {
  return activeEntries.some(entry =>
    entry.hasCriticalCDSCards?.() === true
  );
};

const handleSubmit = async () => {
  // Existing field validation
  const validationResults = activeEntries.map(entry => ({
    key: entry.key,
    valid: entry.validate(),
  }));

  if (!validationResults.every(r => r.valid)) return;

  // Check for critical CDSS cards
  if (hasCriticalCDSCards()) {
    addNotification({
      type: 'error',
      message: 'Cannot save: Critical CDSS alerts must be resolved'
    });
    return;
  }

  // Proceed with submission
  await submitConsultation(...);
};
```

**Add consultation-save CDSS trigger:**

```typescript
const handleConsultationSave = async () => {
  // Existing validation...

  // Build comprehensive bundle
  const dataBundle = buildComprehensiveCDSSBundle();

  // Collect all CDSS rules for save event from all controls
  const saveEventRules = [];
  activeEntries.forEach(entry => {
    const cdssRules = entry.inputControlConfig?.cdss?.filter(
      rule => rule.event === 'onSave'
    ) || [];
    saveEventRules.push(...cdssRules);
  });

  if (saveEventRules.length > 0) {
    // Execute all save-triggered CDSS rules in parallel
    const context: CDSSContext = {
      patientId: encounterSessionStartContext.patientUuid,
      visitId: encounterSessionStartContext.visitUuid,
      episodeId: encounterSessionStartContext.episodeUuid
    };

    const cdssRequest = {
      hook: 'order-sign',
      hookInstance: generateUUID(),
      context: {
        ...context,
        draftOrders: dataBundle
      }
    };

    // Call all CDSS services in parallel
    const cardPromises = saveEventRules.map(rule =>
      invokeCDSSRule(rule, context, dataBundle)
        .catch(error => {
          console.error(`CDSS rule failed for ${rule.service}:`, error);
          return [];
        })
    );

    const cardArrays = await Promise.all(cardPromises);
    const allCards = cardArrays.flat();

    // Broadcast results to all input controls
    const event = new CustomEvent('cdss:results', {
      detail: {
        cards: allCards,
        triggerItemId: 'consultation-save', // Special ID for save events
        controlKey: 'consultation' // Indicates consultation-level check
      }
    });
    window.dispatchEvent(event);

    // Check if any critical cards block submission
    if (allCards.some(card => card.indicator === 'critical')) {
      addNotification({
        type: 'error',
        message: 'Cannot save: Critical CDSS alerts must be resolved'
      });
      return;
    }
  }

  // Continue with normal save
  await submitConsultation(...);
};
```

---

### 9. Integrate CDSS in Input Control Form Component

**File**: `apps/clinical/src/components/forms/<input-control>/FormComponent.tsx`

**Trigger CDSS check on item selection/addition:**

```typescript
const handleItemSelect = (item) => {
  // Create item with unique ID
  const itemId = generateUUID();
  const newItem = {
    id: itemId,
    ...item,
    // ... other fields
  };

  // Add to store first
  addItem(newItem);

  // Filter CDSS rules for the relevant event type
  const cdssRules = inputControlConfig?.cdss || [];
  const targetEvent = "onSelect"; // or 'onAdd', 'onChange', etc.
  const rulesForThisEvent = cdssRules.filter((rule) => rule.event === targetEvent);

  if (rulesForThisEvent.length > 0) {
    // Dispatch CDSS check event with pre-filtered rules
    // This avoids duplicate rule lookups in ConsultationPad
    const event = new CustomEvent("cdss:check", {
      detail: {
        controlKey: "inputControlKey", // e.g., 'immunizationHistory', 'medications'
        itemId: itemId,
        rules: rulesForThisEvent, // Pass filtered rules directly
      },
    });
    window.dispatchEvent(event);
  }
};
```

**Listen for consultation-save CDSS results (Self-Identification Pattern):**

```typescript
// Each input control listens for cdss:results and self-identifies relevant cards
useEffect(() => {
  const handleCDSSResults = (event: CustomEvent<CDSSResultsEventDetail>) => {
    const { cards, triggerItemId, controlKey } = event.detail;
    const { selectedItems } = useControlStore((state) => state);

    // Get all our item IDs
    const ourItemIds = new Set(selectedItems.map((item) => item.id));

    // Process each card
    cards.forEach((card) => {
      card.suggestions?.forEach((suggestion) => {
        suggestion.actions?.forEach((action) => {
          const resourceId = action.resource?.id;

          // Check if this resource ID belongs to our items
          if (resourceId && ourItemIds.has(resourceId)) {
            // This card is for our item
            updateItemCDSCards(resourceId, [
              {
                ...card,
                suggestions: [suggestion], // Keep only relevant suggestion
              },
            ]);
          }
        });
      });
    });
  };

  // Listen for CDSS results from consultation save or other controls
  window.addEventListener("cdss:results", handleCDSSResults);
  return () => window.removeEventListener("cdss:results", handleCDSSResults);
}, []);
```

**Render CDS cards in UI:**

```typescript
import CDSCardAlert from '../common/CDSCardAlert';

const selectedItems = useControlStore(state => state.selectedItems);

return (
  <div>
    <ItemSelector onSelect={handleItemSelect} />

    <h3>Selected Items</h3>
    {selectedItems.map(item => (
      <div key={item.id} className="selected-item-wrapper">
        {/* Display the item */}
        <SelectedItemComponent item={item} />

        {/* Display CDS cards below each item */}
        {item.cdsCards?.map((card, idx) => (
          <div key={idx} style={{ marginTop: '8px', marginLeft: '16px' }}>
            <CDSCardAlert card={card} />
          </div>
        ))}
      </div>
    ))}
  </div>
);
```

**Example for immunization control:**

```typescript
// In ImmunizationForm.tsx
import CDSCardAlert from '../common/CDSCardAlert';

const handleVaccineSelect = (vaccine) => {
  const itemId = generateUUID();
  const newItem = { id: itemId, immunization: vaccine, ... };

  addImmunization(newItem);

  // Filter rules for the specific event type
  const cdssRules = inputControlConfig?.cdss || [];
  const rulesForSelect = cdssRules.filter(rule => rule.event === 'onSelect');

  if (rulesForSelect.length > 0) {
    const event = new CustomEvent('cdss:check', {
      detail: {
        controlKey: 'immunizationHistory',
        itemId: itemId,
        rules: rulesForSelect // Pass pre-filtered rules
      }
    });
    window.dispatchEvent(event);
  }
};

// In render method
{selectedImmunizations.map(immunization => (
  <div key={immunization.id} className="immunization-item-wrapper">
    <ImmunizationDisplay immunization={immunization} />

    {/* CDS cards displayed below the item */}
    {immunization.cdsCards?.map((card, idx) => (
      <div key={idx} style={{ marginTop: '8px', marginLeft: '16px' }}>
        <CDSCardAlert card={card} />
      </div>
    ))}
  </div>
))}
```

---

## Configuration Examples

### App.json Configuration

Location: `/bahmni_config/openmrs/apps/clinical/v2/app.json`

```json
{
  "consultationPad": {
    "inputControls": [
      {
        "type": "immunizationHistory",
        "label": "Immunizations",
        "encounterTypes": ["Consultation"],
        "privileges": ["Add Immunizations"],
        "cdss": [
          {
            "event": "onSelect",
            "server": "clinical-cdss",
            "service": "vaccine-order-select"
          }
        ]
      }
    ]
  }
}
```

### CDSS Server Configuration

Location: `/bahmni_config/openmrs/apps/clinical/v2/cdss-servers.json`

Enhanced configuration with service-specific resource filtering:

```json
[
  {
    "server": "clinical-cdss",
    "url": "/openmrs/ws/rest/v1/clinical/cdss",
    "services": [
      {
        "name": "vaccine-order-select",
        "description": "CDSS service for vaccine order entry",
        "contextResourceMap": [
          {
            "type": "MedicationRequest",
            "attribute": "draftOrders"
          }
        ],
        "prefetch": {
          "patient": "Patient/{{context.patientId}}",
          "activeMedications": "MedicationRequest?patient={{context.patientId}}&status=active",
          "allergies": "AllergyIntolerance?patient={{context.patientId}}"
        }
      },
      {
        "name": "immunization-administration-select",
        "description": "CDSS service for immunization administration",
        "contextResourceMap": [
          {
            "type": "Immunization",
            "attribute": "draftOrders"
          }
        ]
      },
      {
        "name": "medication-order-select",
        "description": "CDSS service for medication order entry",
        "prefetch": {
          "patient": "Patient/{{context.patientId}}"
        }
      }
    ]
  }
]
```

**Configuration Fields:**

- `contextResourceMap` (optional): Defines which resource types to include and where to place them in context
  - `type`: FHIR resourceType to filter (e.g., "MedicationRequest", "Immunization")
  - `attribute`: Context attribute name (e.g., "draftOrders", "medications")
- `prefetch` (optional): Prefetch templates following CDS Hooks specification
- If `contextResourceMap` is omitted, only base context (patientId, visitId, episodeId) is sent

### API Call

When vaccine is selected:

- API Endpoint: `POST /openmrs/ws/rest/v1/clinical/cdss/vaccine-order-select`
- Service filters resources based on `contextResourceMap`
- Request Body: CDS Hooks format with filtered resources and prefetch:

```json
{
  "hook": "vaccine-order-select",
  "hookInstance": "generated-uuid",
  "context": {
    "patientId": "patient-456",
    "visitId": "visit-789",
    "episodeId": "episode-012",
    "draftOrders": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        /* Only MedicationRequest resources (filtered by contextResourceMap) */
      ]
    }
  },
  "prefetch": {
    "patient": "Patient/patient-456",
    "activeMedications": "MedicationRequest?patient=patient-456&status=active",
    "allergies": "AllergyIntolerance?patient=patient-456"
  }
}
```

---

## Flow Examples

### Example 1: Simple Immunization CDSS Check

**Scenario**: Nurse selects a vaccine, CDSS checks for contraindications

**Configuration**:

```json
{
  "type": "immunizationHistory",
  "cdss": [
    {
      "event": "onSelect",
      "server": "clinical-cdss",
      "service": "check-contraindications"
    }
  ]
}
```

**Flow**:

1. **User Action**: Nurse searches and selects "Meruvax II" vaccine

2. **ImmunizationForm Component**:
   - Generates unique `itemId` (e.g., "uuid-123")
   - Creates item: `{ id: "uuid-123", immunization: Meruvax, ... }`
   - Calls `addImmunization(item)` to add to store
   - Filters CDSS rules for event "onSelect": `rulesForSelect = cdssRules.filter(rule => rule.event === "onSelect")`
   - If rules exist, dispatches `cdss:check` custom event with `{ controlKey: "immunizationHistory", itemId: "uuid-123", rules: rulesForSelect }`
   - **Note**: Context is built in ConsultationPad, not passed in event (cleaner separation)

3. **ConsultationPad Event Listener**:
   - Receives `cdss:check` event with pre-filtered rules
   - Finds immunizationHistory entry in `activeEntries`
   - Builds context from encounterSessionStartContext
   - Calls `buildComprehensiveCDSSBundle()`:
     - Iterates all active controls (immunizations, diagnoses, medications, etc.)
     - For each control with data, calls `createBundleEntries(encounterContext)`
     - Combines all entries into single FHIR Bundle
     - Bundle now contains: Meruvax II + any existing diagnoses/medications/etc.

4. **CDSS Service Call**:
   - Calls `findServiceConfig("clinical-cdss", "check-contraindications")`
   - Gets service config with contextResourceMap
   - Filters bundle based on resource types (e.g., only Immunizations)
   - Builds full URL: `/openmrs/ws/rest/v1/clinical/cdss/check-contraindications`
   - POSTs CDS Hooks request:
     ```json
     {
       "hook": "check-contraindications",
       "hookInstance": "generated-uuid",
       "context": {
         "patientId": "patient-456",
         "visitId": "visit-789",
         "draftOrders": {
           "resourceType": "Bundle",
           "type": "collection",
           "entry": [
             {
               "fullUrl": "urn:uuid:uuid-123",
               "resource": {
                 "id": "uuid-123",
                 "resourceType": "Immunization",
                 "status": "completed",
                 "vaccineCode": {
                   "coding": [
                     {
                       "display": "Meruvax II"
                     }
                   ]
                 },
                 "patient": { "reference": "Patient/patient-456" }
               }
             }
           ]
         }
       },
       "prefetch": {
         /* Prefetch from service config if defined */
       }
     }
     ```
   - Receives response:
     ```json
     {
       "cards": [
         {
           "summary": "Patient has contraindication to live vaccines",
           "indicator": "warning",
           "source": { "label": "Vaccine Safety Service" },
           "suggestions": [
             {
               "label": "Review patient allergies",
               "actions": [
                 {
                   "type": "update",
                   "resource": { "id": "uuid-123" }
                 }
               ]
             }
           ]
         }
       ]
     }
     ```

5. **Store Update**:
   - ConsultationPad collects all returned cards
   - Calls `entry.updateItemCDSCards("uuid-123", cards)`
   - ImmunizationStore updates the Meruvax item with cdsCards array

6. **UI Update**:
   - ImmunizationForm re-renders (Zustand subscription)
   - Collects all cards from all items
   - Displays `CDSCardAlert` components above "Added Vaccination"
   - User sees yellow warning notification

---

### Example 2: Cross-Control CDSS Check

**Scenario**: Physician orders medication, CDSS checks against existing diagnoses and vaccines

**Configuration**:

```json
{
  "type": "medications",
  "cdss": [
    {
      "event": "onAdd",
      "server": "clinical-cdss",
      "service": "check-drug-interactions"
    }
  ]
}
```

**Active Input Controls in Consultation**:

- Diagnoses: Patient has "Type 2 Diabetes" diagnosis
- Immunizations: Patient received "Influenza vaccine"
- Medications: Adding new medication "Aspirin"

**Flow**:

1. **User Action**: Physician adds "Aspirin" medication

2. **MedicationsForm Component**:
   - Generates `itemId` for Aspirin
   - Adds to medications store
   - Filters CDSS rules: `rulesForAdd = cdssRules.filter(rule => rule.event === "onAdd")`
   - Dispatches `cdss:check` event: `{ controlKey: "medications", itemId: "aspirin-uuid", rules: rulesForAdd }`

3. **ConsultationPad Event Listener**:
   - Receives event with pre-filtered rules for "onAdd"
   - Finds medications entry in `activeEntries`
   - Builds context from encounterSessionStartContext
   - Calls `buildComprehensiveCDSSBundle()`:

     **Bundle Building Process**:
     - Checks `diagnosesEntry.hasData()` → true
     - Calls `diagnosesEntry.createBundleEntries(ctx)` → returns Condition resources for "Type 2 Diabetes"
     - Checks `immunizationsEntry.hasData()` → true
     - Calls `immunizationsEntry.createBundleEntries(ctx)` → returns Immunization resources for "Influenza vaccine"
     - Checks `medicationsEntry.hasData()` → true
     - Calls `medicationsEntry.createBundleEntries(ctx)` → returns MedicationRequest resource for "Aspirin"

     **Resulting Bundle**:

     ```json
     {
       "resourceType": "Bundle",
       "type": "collection",
       "entry": [
         {
           "fullUrl": "urn:uuid:diag-001",
           "resource": {
             "id": "diag-001",
             "resourceType": "Condition",
             "code": { "text": "Type 2 Diabetes" }
           }
         },
         {
           "fullUrl": "urn:uuid:imm-002",
           "resource": {
             "id": "imm-002",
             "resourceType": "Immunization",
             "vaccineCode": { "text": "Influenza" }
           }
         },
         {
           "fullUrl": "urn:uuid:aspirin-uuid",
           "resource": {
             "id": "aspirin-uuid",
             "resourceType": "MedicationRequest",
             "medicationCodeableConcept": { "text": "Aspirin" }
           }
         }
       ]
     }
     ```

4. **CDSS Service Call**:
   - Loads service config for "clinical-cdss/check-drug-interactions"
   - Service config filters for MedicationRequest resources only
   - POSTs to `/openmrs/ws/rest/v1/clinical/cdss/check-drug-interactions`
   - Sends CDS Hooks request:
     ```json
     {
       "hook": "check-drug-interactions",
       "hookInstance": "generated-uuid",
       "context": {
         "patientId": "patient-456",
         "visitId": "visit-789",
         "draftOrders": {
           "resourceType": "Bundle",
           "type": "collection",
           "entry": [
             /* Only MedicationRequest resource (Aspirin) - Conditions filtered out */
             {
               "fullUrl": "urn:uuid:aspirin-uuid",
               "resource": {
                 "id": "aspirin-uuid",
                 "resourceType": "MedicationRequest",
                 "medicationCodeableConcept": { "text": "Aspirin" }
               }
             }
           ]
         }
       }
     }
     ```
   - **CDSS Engine analyzes**:
     - Aspirin + Type 2 Diabetes → potential interaction detected
     - Aspirin + Influenza vaccine → no interaction
   - Returns CDS cards:
     ```json
     {
       "cards": [
         {
           "summary": "Aspirin may affect blood glucose levels in diabetic patients",
           "indicator": "warning",
           "source": { "label": "Drug Interaction Service" },
           "suggestions": [
             {
               "label": "Monitor blood glucose closely",
               "actions": [
                 {
                   "type": "update",
                   "resource": {
                     "id": "aspirin-uuid",
                     "resourceType": "MedicationRequest"
                   }
                 }
               ]
             }
           ]
         }
       ]
     }
     ```

5. **Store Update**:
   - ConsultationPad receives cards
   - Calls `medicationsEntry.updateItemCDSCards("aspirin-uuid", cards)`
   - MedicationsStore updates Aspirin item with warning card

6. **UI Display**:
   - MedicationsForm re-renders
   - Shows yellow warning below the Aspirin item using CDSCardAlert component
   - Physician sees interaction warning with suggestion directly under the affected medication

7. **Submission**:
   - Physician clicks "Save Consultation"
   - ConsultationPad checks `hasCriticalCDSCards()`
   - Warning indicator → allows submission to proceed
   - If indicator was "critical" → submission would be blocked with toast message

---

### Example 3: Parallel CDSS Rule Execution

**Scenario**: Multiple CDSS services need to check the same vaccine selection simultaneously

**Configuration**:

```json
{
  "type": "immunizationHistory",
  "cdss": [
    {
      "event": "onSelect",
      "server": "clinical-cdss",
      "service": "check-contraindications"
    },
    {
      "event": "onSelect",
      "server": "clinical-cdss",
      "service": "check-vaccine-drug-interactions"
    },
    {
      "event": "onSelect",
      "server": "clinical-cdss",
      "service": "check-vaccine-allergies"
    }
  ]
}
```

**Flow**:

1. **User Action**: Nurse selects "MMR vaccine"

2. **ImmunizationForm Component**:
   - Generates unique `itemId` for MMR vaccine
   - Filters all 3 CDSS rules matching "onSelect" event
   - Adds to store and dispatches `cdss:check` event with all 3 rules

3. **ConsultationPad Event Listener**:
   - Receives event with array of 3 pre-filtered rules
   - Builds comprehensive FHIR bundle once
   - **Parallel Execution**:

     ```typescript
     // All three rules from the event are executed simultaneously
     const cardPromises = rules.map(rule =>
       invokeCDSSRule(rule, context, bundle)
         .catch(error => {
           console.error(`CDSS rule failed for ${rule.service}:`, error);
           return []; // Return empty array on error
         })
     );

     // Wait for all to complete (happens in parallel)
     const results = await Promise.all(cardPromises);
     const allCards = results.flat();
     ```

4. **Performance Benefits**:
   - **Sequential Execution** (old):
     - Contraindications check: 500ms
     - Drug interactions check: 400ms
     - Allergy check: 300ms
     - Total time: 1200ms

   - **Parallel Execution** (new):
     - All three checks start simultaneously
     - Total time: 500ms (max of all three)
     - **Performance improvement: 58% faster**

5. **Error Handling**:
   - If contraindications service fails, it returns empty array
   - Other two services still complete successfully
   - User sees cards from successful services
   - No single point of failure

6. **Results Aggregation**:
   - All cards from all services are combined
   - Cards displayed in UI:
     - Critical alert from allergy service
     - Warning from contraindications service
     - Info card from interactions service

---

### Example 4: Complete Consultation-Save CDSS Flow

**Scenario**: Saving a consultation with vaccinations and medications triggers multiple CDSS services

**Configuration**:

```json
// cdss-servers.json
[
  {
    "server": "clinical-cdss",
    "url": "/openmrs/ws/rest/v1/clinical/cdss"
  }
]

// app.json
{
  "inputControls": [
    {
      "type": "vaccinations",
      "cdss": [{
        "event": "onSave",
        "server": "clinical-cdss",
        "service": "vaccine-contraindications"
      }]
    },
    {
      "type": "medications",
      "cdss": [{
        "event": "onSave",
        "server": "clinical-cdss",
        "service": "drug-interactions"
      }]
    }
  ]
}
```

**1. Frontend Bundle Creation** (using existing resource creators):

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "fullUrl": "urn:uuid:vacc-item-001",
      "resource": {
        "id": "vacc-item-001",
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationReference": {
          "reference": "Medication/mmr-vaccine-uuid",
          "display": "MMR Vaccine"
        },
        "subject": { "reference": "Patient/patient-123" },
        "encounter": { "reference": "Encounter/encounter-456" },
        "requester": { "reference": "Practitioner/pract-001" },
        "dosageInstruction": [
          {
            "text": "{\"instructions\":\"Subcutaneous\"}",
            "route": { "coding": [{ "code": "route-uuid" }] },
            "doseAndRate": [
              {
                "doseQuantity": { "value": 0.5, "code": "ml-uuid" }
              }
            ]
          }
        ],
        "priority": "routine"
      },
      "request": {
        "method": "POST",
        "url": "MedicationRequest"
      }
    },
    {
      "fullUrl": "urn:uuid:med-item-002",
      "resource": {
        "id": "med-item-002",
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationReference": {
          "reference": "Medication/prednisone-uuid",
          "display": "Prednisone 10 MG"
        },
        "subject": { "reference": "Patient/patient-123" },
        "encounter": { "reference": "Encounter/encounter-456" },
        "requester": { "reference": "Practitioner/pract-001" },
        "dosageInstruction": [
          {
            "text": "{\"instructions\":\"Once daily\"}",
            "route": { "coding": [{ "code": "oral-route-uuid" }] }
          }
        ],
        "priority": "routine"
      },
      "request": {
        "method": "POST",
        "url": "MedicationRequest"
      }
    }
  ]
}
```

**Note:** Both vaccinations and medications use `MedicationRequest` with `medicationReference` (Bahmni's existing pattern)

**2. Parallel CDSS Service Calls**:

Each service has its own `contextResourceMap` configuration that filters resources:

- **vaccine-contraindications**: contextResourceMap filters for `Immunization` only
- **drug-interactions**: contextResourceMap filters for `MedicationRequest` only

**Request to vaccine-contraindications:**

```json
{
  "hook": "vaccine-contraindications",
  "hookInstance": "consultation-save-xyz-789",
  "context": {
    "patientId": "patient-123",
    "visitId": "visit-456",
    "draftOrders": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        /* Only Immunization from step 1 */
        {
          "resource": {
            "id": "imm-item-001",
            "resourceType": "Immunization"
          }
        }
      ]
    }
  }
}
```

**Request to drug-interactions:**

```json
{
  "hook": "drug-interactions",
  "hookInstance": "consultation-save-abc-123",
  "context": {
    "patientId": "patient-123",
    "visitId": "visit-456",
    "draftOrders": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        /* Only MedicationRequest from step 1 */
        {
          "resource": {
            "id": "med-item-002",
            "resourceType": "MedicationRequest"
          }
        }
      ]
    }
  }
}
```

Sent to:

```
POST /openmrs/ws/rest/v1/clinical/cdss/vaccine-contraindications
POST /openmrs/ws/rest/v1/clinical/cdss/drug-interactions
```

**3. CDSS Responses**:

```json
// Response from vaccine-contraindications
{
  "cards": [{
    "uuid": "card-001",
    "summary": "MMR contraindicated with immunosuppressants",
    "indicator": "critical",
    "source": { "label": "Vaccine Safety Service" },
    "suggestions": [{
      "label": "Defer MMR vaccination",
      "actions": [{
        "type": "delete",
        "resource": {
          "id": "imm-item-001",
          "resourceType": "Immunization"
        }
      }]
    }]
  }]
}

// Response from drug-interactions
{
  "cards": [{
    "uuid": "card-002",
    "summary": "Monitor immune response",
    "indicator": "warning",
    "source": { "label": "Drug Interaction Service" },
    "suggestions": [{
      "label": "Add monitoring note",
      "actions": [{
        "type": "update",
        "resource": {
          "id": "med-item-002",
          "resourceType": "MedicationRequest"
        }
      }]
    }]
  }]
}
```

**4. Frontend Processing**:

```typescript
// ConsultationPad broadcasts combined results
window.dispatchEvent(
  new CustomEvent("cdss:results", {
    detail: {
      cards: [...vaccineCards, ...drugCards],
      triggerItemId: 'consultation-save',
      controlKey: 'consultation'
    },
  }),
);

// Vaccinations control processes (listening to cdss:results)
const ourItemIds = new Set(["vacc-item-001"]);
// Finds card-001 references vacc-item-001 → updates store

// Medications control processes (listening to cdss:results)
const ourItemIds = new Set(["med-item-002"]);
// Finds card-002 references med-item-002 → updates store
```

---

### Example 5: Service with Multiple Resource Types

**Scenario**: A CDSS service needs both medications and immunizations to check drug-vaccine interactions

**Service Configuration:**

```json
{
  "name": "drug-vaccine-interaction-check",
  "description": "Check interactions between drugs and vaccines",
  "contextResourceMap": [
    {
      "type": "MedicationRequest",
      "attribute": "medications"
    },
    {
      "type": "Immunization",
      "attribute": "immunizations"
    }
  ]
}
```

**Complete Bundle from Frontend:**

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "fullUrl": "urn:uuid:vacc-001",
      "resource": {
        "id": "vacc-001",
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationReference": {
          "reference": "Medication/mmr-vaccine-uuid",
          "display": "MMR Vaccine"
        },
        "subject": { "reference": "Patient/patient-456" }
      }
    },
    {
      "fullUrl": "urn:uuid:med-001",
      "resource": {
        "id": "med-001",
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationReference": {
          "reference": "Medication/prednisone-uuid",
          "display": "Prednisone"
        },
        "subject": { "reference": "Patient/patient-456" }
      }
    },
    {
      "fullUrl": "urn:uuid:cond-001",
      "resource": {
        "id": "cond-001",
        "resourceType": "Condition",
        "code": {
          "text": "Diabetes"
        },
        "subject": { "reference": "Patient/patient-456" }
      }
    }
  ]
}
```

**Filtered CDS Hooks Request:**

```json
{
  "hook": "drug-vaccine-interaction-check",
  "hookInstance": "uuid-123",
  "context": {
    "patientId": "patient-456",
    "visitId": "visit-789",
    "medications": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        {
          "fullUrl": "urn:uuid:vacc-001",
          "resource": {
            "id": "vacc-001",
            "resourceType": "MedicationRequest",
            "medicationReference": {
              "reference": "Medication/mmr-vaccine-uuid",
              "display": "MMR Vaccine"
            }
          }
        },
        {
          "fullUrl": "urn:uuid:med-001",
          "resource": {
            "id": "med-001",
            "resourceType": "MedicationRequest",
            "medicationReference": {
              "reference": "Medication/prednisone-uuid",
              "display": "Prednisone"
            }
          }
        }
      ]
    },
    "immunizations": {
      "resourceType": "Bundle",
      "type": "collection",
      "entry": [
        {
          "fullUrl": "urn:uuid:imm-001",
          "resource": {
            "id": "imm-001",
            "resourceType": "Immunization"
          }
        }
      ]
    }
  }
}
```

**Note:** Condition resource filtered out - not in contextResourceMap. Service receives resources in separate context attributes based on type.

---

### Example 6: Service with No contextResourceMap

**Scenario**: A CDSS service that doesn't need draft resource data, only patient context and prefetch

**Service Configuration:**

```json
{
  "name": "medication-order-select",
  "description": "Medication recommendations based on patient demographics",
  "prefetch": {
    "patient": "Patient/{{context.patientId}}"
  }
}
```

**Complete Bundle from Frontend:**

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    { "resource": { "id": "imm-001", "resourceType": "Immunization" } },
    { "resource": { "id": "med-001", "resourceType": "MedicationRequest" } }
  ]
}
```

**CDS Hooks Request (No Resources in Context):**

```json
{
  "hook": "medication-order-select",
  "hookInstance": "uuid-456",
  "context": {
    "patientId": "patient-456",
    "visitId": "visit-789"
  },
  "prefetch": {
    "patient": "Patient/patient-456"
  }
}
```

**Note:**

- No `draftOrders` or other resource attributes in context
- Service relies entirely on prefetch for patient data
- All draft resources filtered out since contextResourceMap is not defined

---

## Key Architecture Benefits

1. **Event-Driven Decoupling**: Input controls emit events; ConsultationPad orchestrates
2. **Interface Abstraction**: `updateItemCDSCards` method hides store implementation details
3. **Comprehensive Context**: Bundle includes all active controls for holistic decision support
4. **Reusable Infrastructure**: Existing `createBundleEntries` logic reused for CDSS
5. **Item-Level Granularity**: Each selected item stores its own CDS cards
6. **Scalable**: New input controls implement interface methods, no hardcoding needed
7. **Non-Blocking**: Async API calls don't freeze UI
8. **Configurable**: All behavior defined in configuration files
9. **Extensible**: Easy to add new events, servers, and services in future
10. **Parallel Execution**: Multiple CDSS rules execute simultaneously for optimal performance
11. **Fault Tolerant**: Individual rule failures don't block other rules from executing
12. **Efficient Rule Filtering**: Rules are pre-filtered by event type in input controls before dispatching, avoiding duplicate lookups in ConsultationPad

## Architectural Decision: Rules in Events

The implementation passes pre-filtered `rules` array in events instead of just the event type string. This design decision provides several benefits:

### Why Pass Rules Instead of Event String?

1. **Efficiency**: Rules are filtered once in the input control, not twice (once to check if event should be dispatched, once in ConsultationPad to find matching rules)

2. **Cleaner Separation of Concerns**:
   - Input controls know their configuration and filter relevant rules
   - ConsultationPad focuses on orchestration and API calls
   - No need for ConsultationPad to understand input control configurations

3. **Smaller Event Payload**: Context is built in ConsultationPad from encounterSessionStartContext, reducing event payload size

4. **Better Type Safety**: The `CDSSCheckEventDetail` interface ensures rules are properly typed and validated

5. **Performance**: Eliminates redundant array filtering operations in the event handler

### Event Flow Comparison

**Original Plan:**
```
InputControl → filter rules → dispatch event with "onSelect" → ConsultationPad → filter rules again → execute
```

**Actual Implementation:**
```
InputControl → filter rules → dispatch event with filtered rules → ConsultationPad → execute directly
```

This optimization reduces processing overhead and makes the code more maintainable.

---

## UI Display Implementation

### Visual Layout

CDS cards are displayed at item level using the `CDSCardAlert` component:

```
┌─────────────────────────────────────────────────┐
│ Selected Immunizations:                          │
│                                                   │
│ ▸ MMR Vaccine - 0.5mL - 01/15/2024             │
│   └─ [Error InlineNotification - Red]           │
│      MMR vaccine contraindicated                 │
│      Source: Vaccine Safety Service              │
│      • Defer MMR vaccination                     │
│                                                   │
│ ▸ Influenza Vaccine - 0.5mL - 01/15/2024       │
│   └─ [Info InlineNotification - Blue]           │
│      Vaccine properly stored                     │
│      Source: Storage Service                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Selected Medications:                            │
│                                                   │
│ ▸ Prednisone - 10mg - Once daily                │
│   └─ [Warning InlineNotification - Yellow]      │
│      May affect vaccine efficacy                 │
│      Source: Drug Interaction Service            │
│      • Monitor immune response                   │
└─────────────────────────────────────────────────┘
```

### Component Usage Pattern

All input controls follow the same pattern:

1. Import `CDSCardAlert` component
2. Display cards below each selected item
3. Use consistent spacing (marginTop: 8px, marginLeft: 16px)

---

## Key Implementation Notes

- **Single CDSS Server Config**: All servers defined in `cdss-servers.json` with base URLs
- **Service Endpoints**: Full URL constructed as `${baseUrl}/${serviceName}`
- **Self-Identification Pattern**: Input controls match resource IDs in suggestions against their own item IDs
- **Resource ID Strategy**: Bundle entries use item store IDs as resource IDs for easy correlation
- **Multiple CDSS rules per event**: If multiple rules match an event, all execute in parallel
- **Item-level card storage**: Cards stored with specific items they relate to
- **Item-level UI display**: CDS cards shown directly below each affected item using CDSCardAlert component
- **Two trigger patterns**:
  - **Item selection**: Individual CDSS checks when items added/selected
  - **Consultation save**: Comprehensive CDSS checks with full clinical context
- **Critical vs Warning**: Only "critical" indicator blocks submission; "warning" allows proceeding
- **Comprehensive bundles**: Every CDSS check gets full clinical context from all active controls
- **Carbon Design System**: Uses InlineNotification with indicator-to-kind mapping

---

## Future Enhancements

The following features are designed in the architecture but not yet implemented:

### 1. CDS Card Suggestions Display

**Current State**: The `CDSCardAlert` component displays only the card summary and indicator. Suggestions and actions from the CDS response are not rendered in the UI.

**Planned Enhancement**:
```typescript
// Enhanced CDSCardAlert component to display suggestions
const CDSCardAlert = ({ card }) => {
  return (
    <InlineNotification
      kind={getNotificationKind(card.indicator)}
      title={card.summary}
      subtitle={card.source?.label}
      lowContrast={true}
      hideCloseButton={true}
    >
      {/* Display suggestions with actions */}
      {card.suggestions?.map((suggestion, idx) => (
        <div key={idx} className="cds-suggestion">
          <span>{suggestion.label}</span>
          {/* Future: Add action buttons for each suggestion */}
          {suggestion.actions?.map((action, actionIdx) => (
            <Button
              key={actionIdx}
              size="small"
              onClick={() => handleAction(action)}
            >
              {action.label || 'Apply'}
            </Button>
          ))}
        </div>
      ))}
    </InlineNotification>
  );
};
```

**Use Cases**:
- Display recommended alternative medications
- Show suggested dosage adjustments
- Provide links to clinical guidelines
- Offer quick actions to modify orders

### 2. Consultation-Level CDSS on Save (onSave Event)

**Current State**: The `onSave` event handling is designed but not implemented. Individual item checks work, but consultation-wide validation at save time is pending.

**Planned Enhancement**:
- Trigger CDSS checks when user clicks "Save Consultation"
- Aggregate all draft orders from all input controls
- Execute rules configured with `event: "onSave"`
- Display results before final submission
- Allow user to review and address issues

**Configuration Example**:
```json
{
  "type": "medications",
  "cdss": [
    {
      "event": "onSave",
      "server": "clinical-cdss",
      "service": "order-sign-check"
    }
  ]
}
```

**Implementation Pattern**:
```typescript
// In ConsultationPad handleSave()
const handleConsultationSave = async () => {
  // Collect all onSave rules from all controls
  const saveEventRules = activeEntries.flatMap(entry =>
    entry.inputControlConfig?.cdss?.filter(rule => rule.event === 'onSave') || []
  );

  if (saveEventRules.length > 0) {
    // Build comprehensive bundle
    const dataBundle = buildComprehensiveCDSSBundle();

    // Execute all onSave rules in parallel
    const results = await Promise.all(
      saveEventRules.map(rule => invokeCDSSRule(rule, context, dataBundle))
    );

    // Display results and handle critical alerts
    // ... rest of implementation
  }
};
```

### 3. System Actions Support (Future Direction)

**Current State**: System Actions are not implemented in either frontend or backend. This concept is documented here as a potential future direction for handling global CDSS events that affect multiple input controls.

**Conceptual Design**:
The CDS Hooks specification includes a `systemActions` field that could enable automated system-level changes across multiple input controls. This would allow CDSS services to suggest or enforce changes that span beyond a single item or control.

```typescript
// Potential future interface
interface CDSSystemAction {
  type: 'create' | 'update' | 'delete';
  resource: any; // FHIR resource
  description?: string; // Human-readable description
}
```

**Potential Use Cases for Global CDSS Events**:         
- **Cross-Control Dependencies**: When adding a medication in one control requires adding a monitoring lab order in another control
- **Automated Companion Orders**: Adding required pre-medications when certain drugs are prescribed
- **Protocol Enforcement**: Ensuring complete order sets are added together (e.g., sepsis protocol requires specific medications + lab orders + procedures)
- **Safety Cascades**: When removing a contraindicated item requires adjusting related orders in other controls
- **Multi-Resource Updates**: Updating dosages across multiple related medications based on renal function

**Example Scenario**:
When a user selects chemotherapy medication:
1. CDSS service identifies need for pre-medications
2. Returns system actions to add anti-emetics to medications control
3. Also suggests adding lab orders for monitoring
4. All changes applied across different input controls automatically

**Why This Matters**:
- Current implementation handles CDSS at item level within each control
- System Actions would enable CDSS to orchestrate changes across the entire consultation
- This would support complex clinical protocols that require coordinated orders
- Would reduce manual work and ensure completeness of order sets

**Note**: This is a conceptual enhancement that would require:
- Backend CDSS services to generate system actions
- Frontend logic to process and apply actions across controls
- User confirmation workflow for automated changes
- Careful consideration of clinical safety and user autonomy

### 4. Advanced Event Types

**Planned Events**:
- `onChange`: Trigger when item details are modified
- `onRemove`: Trigger when item is removed from selection
- `onLoad`: Trigger when form initially loads with existing data
- `onQuantityChange`: Specific to dosage/quantity modifications

### 5. Prefetch Optimization

**Current State**: Prefetch templates are defined but actual prefetch data retrieval is not implemented.

**Planned Enhancement**:
- Implement prefetch data retrieval before CDSS calls
- Cache prefetch results for performance
- Support complex prefetch queries with patient context

### 6. CDSS Response Caching

**Planned Enhancement**:
- Cache CDSS responses for identical inputs
- Implement cache invalidation strategy
- Reduce redundant API calls for better performance