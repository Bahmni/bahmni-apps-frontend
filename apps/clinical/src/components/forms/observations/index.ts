import { createObservationBundleEntries } from '../../../services/consultationBundleService';
import { useObservationFormsStore } from '../../../stores/observationFormsStore';
import { registerInputControl } from '../registry';
import ObservationFormsPanel from './ObservationFormsPanel';

registerInputControl({
  key: 'observationForms',
  component: ObservationFormsPanel,
  reset: () => useObservationFormsStore.getState().reset(),
  validate: () => useObservationFormsStore.getState().validate(),
  hasData: () => useObservationFormsStore.getState().selectedForms.length > 0,
  subscribe: (cb) => useObservationFormsStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createObservationBundleEntries({
      observationFormsData: useObservationFormsStore
        .getState()
        .getObservationFormsData(),
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default as ObservationFormsPanel } from './ObservationFormsPanel';
