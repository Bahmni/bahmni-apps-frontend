import './encounterDetails';
import './allergies';
import './investigations';
import './conditionsAndDiagnoses';
import './medicationRequest';
import './immunization';
import './documents';
import './observations';
import './stopMedications';
import './disposition';

export type {
  InputControl,
  EncounterContext,
  SubmissionResult,
} from './models';
export { default as InputControlRenderer } from './renderer';

export { getRegisteredInputControls } from './registry';
