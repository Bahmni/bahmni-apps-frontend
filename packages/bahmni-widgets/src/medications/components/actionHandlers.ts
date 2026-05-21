import { MEDICATIONS_INPUT_CONTROL_KEY } from '@bahmni/services';
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
        encounterType: action.encounterType,
        stopMedication: fhirResource,
        editOnly: 'stopMedications',
        editTitle: 'STOP_MEDICATION_FORM_TITLE',
        editEncounterUuid: encounterUuid,
      },
    }),
  );
};

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (action.type === 'stop') {
    handleStopAction(action, fhirResource);
    return;
  }

  if (action.type === 'administer') {
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: { encounterType: action.encounterType, basedOn: fhirResource },
      }),
    );
  }

  if (action.type === 'edit' && fhirResource) {
    const encounterRef = fhirResource.encounter?.reference;
    const editEncounterUuid = encounterRef?.split('/').pop() ?? undefined;

    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: {
          encounterType: action.encounterType,
          editMedications: [fhirResource],
          editOnly: MEDICATIONS_INPUT_CONTROL_KEY,
          editTitle: 'MEDICATIONS_EDIT_FORM_TITLE',
          editEncounterUuid,
        },
      }),
    );
  }
};
