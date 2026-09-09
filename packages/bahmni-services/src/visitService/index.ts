export type { VisitType, VisitTypes, VisitData, ActiveVisit } from './models';
export {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  getActiveVisitByPatient,
  getVisitLocationUUID,
} from './visitService';
export { createVisitWithFhirR4 } from './fhirVisitService';
