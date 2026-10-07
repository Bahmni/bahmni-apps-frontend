import { MedicationRequest } from 'fhir/r4';
import { MedicationAction } from '../models';

const handleStopAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (!fhirResource) return;

  const encounterUuid = fhirResource.encounter?.reference?.split('/').pop();

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        context: {
          encounterType: action.encounterType,
          encounter: encounterUuid
            ? { resourceType: 'Encounter', id: encounterUuid }
            : undefined,
        },
        action: { type: 'delete', resources: [fhirResource] },
      },
    }),
  );
};

const handleCancelVaccinationAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (!fhirResource) return;

  const encounterUuid = fhirResource.encounter?.reference?.split('/').pop();

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        context: {
          encounterType: action.encounterType,
          encounter: encounterUuid
            ? { resourceType: 'Encounter', id: encounterUuid }
            : undefined,
        },
        action: { type: 'delete', resources: [fhirResource] },
      },
    }),
  );
};

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
  startDate?: string,
): void => {
  if (action.type === 'stop') {
    handleStopAction(action, fhirResource);
    return;
  }

  if (action.type === 'cancel') {
    handleCancelVaccinationAction(action, fhirResource);
    return;
  }

  if (action.type === 'administer') {
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: {
          context: {
            encounterType: action.encounterType,
            basedOn: fhirResource,
          },
          action: { type: 'create', resourceType: 'Immunization' },
        },
      }),
    );
  }

  if (action.type === 'edit' && fhirResource) {
    const encounterRef = fhirResource.encounter?.reference;
    const sourceEncounterUuid = encounterRef?.split('/').pop() ?? undefined;

    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: {
          context: {
            encounter: sourceEncounterUuid
              ? { resourceType: 'Encounter', id: sourceEncounterUuid }
              : undefined,
          },
          action: { type: 'update', resources: [fhirResource] },
        },
      }),
    );
  }

  void startDate;
};
