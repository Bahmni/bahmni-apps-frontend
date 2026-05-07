import { createServiceRequestBundleEntries } from '../../../services/consultationBundleService';
import { useServiceRequestStore } from '../../../stores';
import { registerInputControl } from '../registry';
import InvestigationsForm from './InvestigationsForm';

registerInputControl({
  key: 'investigations',
  component: InvestigationsForm,
  reset: () => useServiceRequestStore.getState().reset(),
  validate: () => true,
  hasData: () =>
    useServiceRequestStore.getState().selectedServiceRequests.size > 0,
  subscribe: (cb) => useServiceRequestStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createServiceRequestBundleEntries({
      selectedServiceRequests:
        useServiceRequestStore.getState().selectedServiceRequests,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default } from './InvestigationsForm';
