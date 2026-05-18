import { createMedicationRequestEntries } from '../../../services/consultationBundleService';
import { useMedicationStore } from '../../../stores';
import { registerInputControl } from '../registry';
import MedicationsForm from './MedicationsForm';

registerInputControl({
  key: 'medications',
  component: MedicationsForm,
  reset: () => useMedicationStore.getState().reset(),
  validate: () => useMedicationStore.getState().validateAllMedications(),
  hasData: () => useMedicationStore.getState().selectedMedications.length > 0,
  subscribe: (cb) => useMedicationStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createMedicationRequestEntries({
      selectedMedications: useMedicationStore.getState().selectedMedications,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      statDurationInMilliseconds: ctx.statDurationInMilliseconds,
    }),
});

export { default } from './MedicationsForm';
