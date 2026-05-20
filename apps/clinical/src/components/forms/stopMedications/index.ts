import { createStopMedicationBundleEntries } from '../../../services/consultationBundleService';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import { registerInputControl } from '../registry';
import StopMedicationForm from './StopMedicationForm';

registerInputControl({
  key: 'stopMedications',
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createStopMedicationBundleEntries({
      stopMedicationState: useStopMedicationStore.getState(),
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});
