import { MEDICATIONS_INPUT_CONTROL_KEY } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import { MedicationAction } from '../models';

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
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
