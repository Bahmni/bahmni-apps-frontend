import type { EncounterContext } from '../models';
import { registerInputControl } from '../registry';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
} from './constants';
import ImmunizationHistoryForm from './ImmunizationHistoryForm';
import { getImmunizationStore } from './stores';
import { createImmunizationBundleEntries } from './utils';

const registerImmunizationControl = (key: string) => {
  const store = () => getImmunizationStore(key);
  registerInputControl({
    key,
    component: ImmunizationHistoryForm,
    reset: () => store().getState().reset(),
    validate: () => store().getState().validateAll(),
    hasData: () => store().getState().selectedImmunizations.length > 0,
    subscribe: (cb: () => void) => store().subscribe(cb),
    createBundleEntries: (ctx: EncounterContext) =>
      createImmunizationBundleEntries({
        selectedImmunizations: store().getState().selectedImmunizations,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
      }),
  });
};

registerImmunizationControl(IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY);
registerImmunizationControl(IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY);

export { default } from './ImmunizationHistoryForm';
