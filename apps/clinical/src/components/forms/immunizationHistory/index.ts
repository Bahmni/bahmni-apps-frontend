import { registerInputControl } from '../registry';
import { IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY } from './constants';
import ImmunizationHistoryForm from './ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from './stores';
import { createImmunizationBundleEntries } from './utils';

registerInputControl({
  key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  component: ImmunizationHistoryForm,
  reset: () => useImmunizationHistoryStore.getState().reset(),
  validate: () => useImmunizationHistoryStore.getState().validateAll(),
  hasData: () =>
    useImmunizationHistoryStore.getState().selectedImmunizations.length > 0,
  subscribe: (cb) => useImmunizationHistoryStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createImmunizationBundleEntries({
      selectedImmunizations:
        useImmunizationHistoryStore.getState().selectedImmunizations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default } from './ImmunizationHistoryForm';
