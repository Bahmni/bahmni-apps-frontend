import { MedicationRequest } from 'fhir/r4';
import { MedicationAction } from '../models';

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (action.type === 'administer')
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: { encounterType: action.encounterType, basedOn: fhirResource },
      }),
    );
};

export const handleEditAction = (
  editMedications: MedicationRequest[],
  encounterType: string,
): void => {
  // Extract the encounter UUID from the medication being edited
  const encounterRef = editMedications[0]?.encounter?.reference;
  const editEncounterUuid = encounterRef?.split('/').pop();

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        encounterType,
        editMedications,
        editOnly: 'medications',
        editTitle: 'MEDICATIONS_EDIT_FORM_TITLE',
        editEncounterUuid,
      },
    }),
  );
};
