export {
  getActiveVisit,
  getPatientVisits,
  getVisits,
  getPatientEncounters,
  getEncounterTypeByName,
  getEncounterByUuid,
  createFhirEncounter,
  updateFhirEncounter,
  type EncounterTypeRef,
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export { type FormsEncounter } from './models';
