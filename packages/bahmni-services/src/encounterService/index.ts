export {
  getActiveVisit,
  getActiveVisitAtLoginLocation,
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
  getFormsDataByEncounterUuid,
  createOrderFulfillmentEncounter,
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export {
  type FormsEncounter,
  type OrderFulfillmentEncounterParams,
} from './models';
