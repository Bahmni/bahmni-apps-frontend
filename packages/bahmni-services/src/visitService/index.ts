export type { VisitType, VisitTypes, VisitData, ActiveVisit } from './models';
export {
  getVisitTypes,
  checkIfActiveVisitExists,
  createVisitForPatient,
  getActiveVisitByPatient,
} from './visitService';
