export type { VisitType, VisitTypes, VisitData, ActiveVisit } from './models';
export {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  getActiveVisitByPatient,
  getVisitLocationUUID,
} from './visitService';
export {
  createFhirVisit,
  getActiveVisitAtLoginLocation,
} from './fhirVisitService';
