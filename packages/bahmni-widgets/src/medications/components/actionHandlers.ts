import { dispatchConsultationStart } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import { MedicationAction } from '../models';

const getEncounterUuid = (fhirResource: MedicationRequest) =>
  fhirResource.encounter?.reference?.split('/').pop();

const toEncounter = (encounterUuid?: string) =>
  encounterUuid
    ? { resourceType: 'Encounter' as const, id: encounterUuid }
    : undefined;

const handleDeleteAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (!fhirResource) return;

  dispatchConsultationStart({
    context: {
      encounterType: action.encounterType,
      encounter: toEncounter(getEncounterUuid(fhirResource)),
    },
    action: { type: 'delete', resources: [fhirResource] },
  });
};

export const handleAction = (
  action: MedicationAction,
  fhirResource?: MedicationRequest,
): void => {
  if (action.type === 'stop' || action.type === 'cancel') {
    handleDeleteAction(action, fhirResource);
    return;
  }

  if (action.type === 'administer') {
    dispatchConsultationStart({
      context: {
        encounterType: action.encounterType,
        basedOn: fhirResource,
      },
      action: { type: 'create', resourceType: 'Immunization' },
    });
  }

  if (action.type === 'edit' && fhirResource) {
    dispatchConsultationStart({
      context: { encounter: toEncounter(getEncounterUuid(fhirResource)) },
      action: { type: 'update', resources: [fhirResource] },
    });
  }
};
