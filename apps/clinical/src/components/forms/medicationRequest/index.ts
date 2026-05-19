import type { EncounterContext } from '../models';
import { registerInputControl } from '../registry';
import {
  MEDICATIONS_INPUT_CONTROL_KEY,
  VACCINATIONS_INPUT_CONTROL_KEY,
} from './constants';
import MedicationRequestForm from './MedicationRequestForm';
import { getMedicationRequestStore, MedicationRequestStoreKey } from './store';
import { createMedicationRequestEntries } from './utils';

const registerMedicationRequestControl = (key: MedicationRequestStoreKey) => {
  const store = () => getMedicationRequestStore(key);
  registerInputControl({
    key,
    component: MedicationRequestForm,
    reset: () => store().getState().reset(),
    validate: () => store().getState().validateAll(),
    hasData: () => store().getState().selectedMedicationRequests.length > 0,
    subscribe: (cb: () => void) => store().subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
      createMedicationRequestEntries({
        selectedMedicationRequests:
          store().getState().selectedMedicationRequests,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        statDurationInMilliseconds: ctx.statDurationInMilliseconds,
      }),
  });
};

registerMedicationRequestControl(MEDICATIONS_INPUT_CONTROL_KEY);
registerMedicationRequestControl(VACCINATIONS_INPUT_CONTROL_KEY);

export { default } from './MedicationRequestForm';
