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
