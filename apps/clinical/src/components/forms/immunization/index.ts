import type { EncounterContext } from '../models';
import { registerInputControl } from '../registry';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY,
} from './constants';
import ImmunizationForm from './ImmunizationForm';
import { ImmunizationStoreKey } from './models';
import { getImmunizationStore } from './stores';
import { createImmunizationBundleEntries } from './utils';

const registerImmunizationControl = (key: ImmunizationStoreKey) => {
  const store = () => getImmunizationStore(key);
  const isAdministration =
    key === IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY;
  const isWaiver = key === IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY;
  registerInputControl({
    key,
    component: ImmunizationForm,
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
        isAdministration,
        isWaiver,
      }),
    updateItemCDSCards: (itemId: string, cards) =>
      store().getState().updateItemCDSCards(itemId, cards),
    hasCriticalCDSCards: () => store().getState().hasCriticalCDSCards(),
  });
};

registerImmunizationControl(IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY);
registerImmunizationControl(IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY);
registerImmunizationControl(IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY);

export { default } from './ImmunizationForm';
