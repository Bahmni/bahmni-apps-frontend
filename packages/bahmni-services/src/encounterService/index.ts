export {
  getActiveVisit,
  getPatientVisits,
  getVisits,
  getEncounterByUuid,
  getObservationsBundleByEncounterUuid,
  createFhirEncounter,
  updateFhirEncounter,
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export { type FormsEncounter } from './models';
