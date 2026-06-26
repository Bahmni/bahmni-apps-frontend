# ADR: Standardised `startConsultation` Event Payload

**Date**: Jun 2026
**Status**: Proposed
**Authors**: Mohankumar Thangavel

## Context

The `startConsultation` event is the primary mechanism for launching the consultation pad from any surface in Bahmni — patient summary display controls, CDS recommendation cards, medication lists, vaccination history, and more. Currently the payload contract is inconsistent across these entry points: some callers pass bare identifiers, others pass partial FHIR resources, and others embed domain-specific flags. This makes it difficult for the consultation pad to:

- Determine which input controls to render for a given encounter type.
- Distinguish between create, edit, and delete intents without ad-hoc conditional logic.
- Pass enough pre-fetched context to the target control so it doesn't re-query data that the caller already has.
- Support CDS-driven actions where a card recommends a specific order or intervention.

As Bahmni moves toward a more composable, widget-driven architecture — and toward supporting CDS Hooks card actions — a shared, high-level contract is needed that all callers can produce and all input controls can consume.

Taking inspiration from [CDS Hooks Card Actions](https://cds-hooks.hl7.org/#action) and FHIR resource semantics, the following structure is proposed.

## Proposed Payload Structure

```json
{
    "context": {
        "encounterType": "",
        "encounter": "<FhirResource<Encounter>>",
        "basedOn": "<FhirResource<any>>",
        "<additionalContextualKey>": "<value>"
    },
    "action": {
        "type": "create | update | delete",
        "resourceType": "Allergy | Condition | DocumentReference | ServiceRequest | Immunization | MedicationRequest | DiagnosticReport",
        "resources": ["<FhirResource<any>>"]
    }
}
```

| Field | Required | Description |
|---|---|---|
| `context.encounterType` | Yes | Encounter type name used to filter applicable input controls |
| `context.encounter` | No | Pre-fetched FHIR Encounter resource; present when editing an existing or in-progress encounter so the pad does not re-query |
| `context.basedOn` | No | Reference to the resource that triggered this action (e.g. a ServiceRequest, CDS card, or order) |
| `action.type` | Yes | Intent: `create`, `update`, or `delete`. Can be extensible only if domain specific action is needed and cannot be satisified with the standard |
| `action.resourceType` | No | When present, the pad renders only the input controls applicable to this FHIR resource type |
| `action.resources` | No | Pre-fetched resource(s) to pre-populate the target control (e.g. existing Allergy to edit) |

## How It Scales

1. **Control filtering** — The consultation pad uses `context.encounterType` (or the type from `context.encounter`) to filter the set of registered input controls down to those relevant to the encounter.
2. **Targeted rendering** — If `action.resourceType` is present, only the input control(s) that handle that resource type are rendered, avoiding an overwhelming full-pad open.
3. **Pre-population** — If `action.resources` is present, the pad identifies the correct control by matching `resource.resourceType` and passes the resource into the control so it can render in edit/delete mode immediately.
4. **Action-aware controls** — Each control receives both `context` and `action`. Controls use `action.type` to switch between create, edit, and delete rendering without needing caller-specific logic.
5. **CDS extensibility** — A CDS card action can emit exactly this payload, allowing recommended orders or interventions to pre-fill the appropriate control with zero extra integration work.

## Examples

### New Consultation button from header

```json
{}
```
- No context, no specific action. User change different encounter types and the controls can render based on the selected encounter type.

### Edit Consultation

```json
{
    "context": {
        "encounter": { "resourceType": "Encounter", "id": "enc-123", "status": "in-progress" }
    }
}
```
- Encounter is already known. Passes into context. The Encounter Details control will not allow edits to encounter type / changing encounter type.


### Edit Allergies

```json
{
    "context": {
        "encounter": { "resourceType": "Encounter", "id": "enc-123" }
    },
    "action": {
        "type": "update",
        "resources": [{ "resourceType": "AllergyIntolerance", "id": "allergy-456", "code": { "text": "Penicillin" } }]
    }
}
```
- Edit Allergies. Encounter is known as edit allowed only within encounter. resourceType identifed from the resources. AllergyInputControl rendered and it reads and renders in update mode for the given allergies.


### Edit Medications

```json
{
    "context": {
        "encounter": { "resourceType": "Encounter", "id": "enc-123" }
    },
    "action": {
        "type": "update",
        "resources": [{ "resourceType": "MedicationRequest", "id": "med-789", "status": "active" }]
    }
}
```

- Edit Medication. Encounter is known as edit allowed only within encounter. resourceType identifed from the resources. MedicationInputControl rendered and it reads and renders in update mode for the given medications.

### Stop Medication

```json
{
    "context": {
    },
    "action": {
        "type": "delete",
        "resources": [{ "resourceType": "MedicationRequest", "id": "med-789", "status": "active" }]
    }
}
```
- Stop Medication. Encounter may not be known as stop canbe done from a different encounter as well. resourceType identifed from the resources. MedicationStopInputControl rendered and it reads and renders in update mode for the given medications.


### Administer against a MedicationRequest for Vaccination

```json
{
    "context": {
        "encounterType": "Immunization Administration",
        "basedOn":{ "resourceType": "MedicationRequest", "id": "med-789" }
    },
    "action": {
        "type": "create",
        "resourceType": "Immunization"
    }
}
```
- Administer vaccination. Control filters by encounterType, then also supports the resourceType. Then ImmunizationAdministrationControl identifies order information from context.basedOn

### Add from Vaccination History

```json
{
    "context": { "encounterType": "Immunization History" },
    "action": { "type": "create", "resourceType": "Immunization" }
}
```
- Capturing vaccination history. Control filtered by encounter type.then also supports the resourceType. ImmnizationHistory input control renders accordingly.

### Open a new Form (Task Display Control)

```json
{
    "context": { 
        "encounterType": "OPD",
        "basedOn": { "resourceType": "Task", "id": "task-4589", "code": "12234", "input":[{}]},
        "formNameInputType": "cocnept-uuid"
     },
    "action": {
        "type": "create",
        "resourceType": "Observation"
    }
}
```
- Encounter Type filtering applied. Resource type is Observation, so ObservationForms Input Control renders. Then input control sees that there is a task in context, identifies form name from task and shows only that specific form to be able to submit.

### Edit Form (Forms Display Control)

```json
{
    "context": {
        "encounter": { "resourceType": "Encounter", "id": "enc-123" }
    },
    "action": {
        "type": "update",
        "resources": [
            { "resourceType": "Observation", "id": "obs-123" },
            { "resourceType": "Observation", "id": "obs-456" },
            { "resourceType": "Observation", "id": "obs-789" },
            ]
    }
}
```
- Encounter is already known since edit obs can be within only the same encounter. resourceType is Observation so ObservationInputControl only. Then input control sees action type as update, parses the resources and shows the form directly.

### Add from Order Display Control

```json
{
    "context": { "encounterType": "OPD" },
    "action": { "type": "create", "resourceType": "ServiceRequest" }
}
```
- Allows only the Order/Invetigation input control. Useful when we add + button on the orders display control.

### Add from Radiology Order from Radiology Display Control

```json
{
    "context": { "encounterType": "OPD", "category": "Radiology" },
    "action": { "type": "create", "resourceType": "ServiceRequest" }
}
```
- Allows only the Order/Invetigation input control. Useful when we add + button on the radiology orders display control. The input control uses the context now and shows only radiology orders

### Add specific order from CDS card (e.g. CBC) - Future plan

```json
{
    "context": {
        "encounterType": "OPD",
    },
    "action": {
        "type": "create",
        "resourceType": "ServiceRequest",
        "resources": [{
            "resourceType": "ServiceRequest",
            "code": { "coding": [{ "system": "http://loinc.org", "code": "58410-2", "display": "CBC panel" }] },
            "status": "draft",
            "intent": "proposal"
        }]
    }
}
```

### Add Document (Document Display Control)

```json
{
    "context": { "encounterType": "OPD" },
    "action": { "type": "create", "resourceType": "DocumentReference" }
}
```
