export {
  getActiveVisit,
  getPatientVisits,
  getVisits,
  getPatientEncounters,
  getEncounterTypeByName,
  getEncounterByUuid,
  getObservationsBundleByEncounterUuid,
  createFhirEncounter,
  updateFhirEncounter,
  type EncounterTypeRef,
  createOrderFulfillmentEncounter
} from './encounterService';

export { shouldEnableEncounterFilter } from './encounterFilterUtils';

export {
  type FormsEncounter,
  type OrderFulfillmentEncounterParams,
} from './models';
