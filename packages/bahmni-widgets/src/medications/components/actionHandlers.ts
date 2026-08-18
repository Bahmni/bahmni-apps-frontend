import { MEDICATIONS_INPUT_CONTROL_KEY } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import { VACCINATION_CODE_PREFIX } from '../constants';
import { MedicationAction } from '../models';

const handleStopAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
  startDate?: string,
  isVaccinationCancellation?: boolean,
): void => {
  if (!fhirResource) return;

  const encounterUuid = fhirResource.encounter?.reference?.split('/').pop();

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        encounterType: action.encounterType,
        stopMedication: fhirResource,
        stopMedicationStartDate: startDate,
        editOnly: 'stopMedications',
        editTitle: isVaccinationCancellation
          ? 'CANCEL_VACCINE_FORM_TITLE'
          : 'STOP_MEDICATION_FORM_TITLE',
        editEncounterUuid: encounterUuid,
        isVaccinationCancellation: isVaccinationCancellation ?? false,
      },
    }),
  );
};

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
  startDate?: string,
  isVaccinationCancellation?: boolean,
): void => {
  if (action.type === 'stop') {
    handleStopAction(
      action,
      fhirResource,
      startDate,
      isVaccinationCancellation,
    );
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
