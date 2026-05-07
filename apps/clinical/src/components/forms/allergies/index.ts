import { createAllergiesBundleEntries } from '../../../services/consultationBundleService';
import { useAllergyStore } from '../../../stores';
import { registerInputControl } from '../registry';
import AllergiesForm from './AllergiesForm';

registerInputControl({
  key: 'allergies',
  component: AllergiesForm,
  reset: () => useAllergyStore.getState().reset(),
  validate: () => useAllergyStore.getState().validateAllAllergies(),
  hasData: () => useAllergyStore.getState().selectedAllergies.length > 0,
  subscribe: (cb) => useAllergyStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createAllergiesBundleEntries({
      selectedAllergies: useAllergyStore.getState().selectedAllergies,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default } from './AllergiesForm';
