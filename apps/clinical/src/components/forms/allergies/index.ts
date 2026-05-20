import { createAllergiesBundleEntries } from '../../../services/consultationBundleService';
import { useAllergyStore } from '../../../stores';
import { registerInputControl } from '../registry';
import AllergiesForm from './AllergiesForm';

registerInputControl({
  key: 'allergies',
  component: AllergiesForm,
  reset: () => useAllergyStore.getState().reset(),
  validate: () => useAllergyStore.getState().validateAllAllergies(),
  // In edit mode allergies are pre-loaded with isModified:false; Done should stay
  // disabled until the user actually changes something (isModified:true) or adds a
  // new allergy (isModified:undefined, i.e. not explicitly false).
  hasData: () =>
    useAllergyStore.getState().selectedAllergies.some((a) => a.isModified !== false),
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
