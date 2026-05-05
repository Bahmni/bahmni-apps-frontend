import './encounterDetails';
import './allergies';
import './investigations';
import './conditionsAndDiagnoses';
import './medications';
import './vaccinations';
import './immunizationHistory';
import './observations';

export type { InputControl, EncounterContext } from './models';
export { default as InputControlRenderer } from './renderer';

export { getRegisteredInputControls } from './registry';
