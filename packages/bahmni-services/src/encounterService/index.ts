export {
  getActiveVisit,
  getPatientVisits,
  getVisits,
  getPatientEncounters,
  getEncounterTypeByName,
  getEncounterByUuid,
  createFhirEncounter,
  updateFhirEncounter,
  buildEncounterResource,
  type EncounterTypeRef,
  type BuildEncounterResourceParams,
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export { type FormsEncounter } from './models';
