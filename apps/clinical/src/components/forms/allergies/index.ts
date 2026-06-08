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
    useAllergyStore
      .getState()
      .selectedAllergies.some((a) => a.isModified !== false),
  subscribe: (cb) => useAllergyStore.subscribe(cb),
  // New allergies (no resourceId) go through the ConsultationBundle for atomicity
  // with the encounter and other resources. Existing modified allergies are handled
  // via standalone FHIR calls in submitConsultation to avoid transaction issues.
  createBundleEntries: (ctx) =>
    createAllergiesBundleEntries({
      selectedAllergies: useAllergyStore
        .getState()
        .selectedAllergies.filter((a) => !a.resourceId),
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default } from './AllergiesForm';
