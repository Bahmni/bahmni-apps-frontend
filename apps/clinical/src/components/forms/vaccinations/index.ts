import { createMedicationRequestEntries } from '../../../services/consultationBundleService';
import { useVaccinationStore } from '../../../stores';
import { registerInputControl } from '../registry';
import VaccinationForm from './VaccinationForm';

registerInputControl({
  key: 'vaccinations',
  component: VaccinationForm,
  reset: () => useVaccinationStore.getState().reset(),
  validate: () => useVaccinationStore.getState().validateAllVaccinations(),
  hasData: () => useVaccinationStore.getState().selectedVaccinations.length > 0,
  subscribe: (cb) => useVaccinationStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createMedicationRequestEntries({
      selectedMedications: useVaccinationStore.getState().selectedVaccinations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      statDurationInMilliseconds: ctx.statDurationInMilliseconds,
    }),
});

export { default } from './VaccinationForm';
