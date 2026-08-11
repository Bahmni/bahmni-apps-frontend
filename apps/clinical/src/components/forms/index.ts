import './encounterDetails';
import './allergies';
import './investigations';
import './conditionsAndDiagnoses';
import './medicationRequest';
import './immunization';
import './observations';
import './stopMedications';
import './cancelVaccination';

export type { InputControl, EncounterContext } from './models';
export { default as InputControlRenderer } from './renderer';

export { getRegisteredInputControls } from './registry';
