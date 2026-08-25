import { createStopMedicationEntry } from '../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import { registerInputControl } from '../registry';
import StopMedicationForm from './StopMedicationForm';

registerInputControl({
  key: 'stopMedications',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: createStopMedicationEntry,
});

registerInputControl({
  key: 'cancelVaccination',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: createStopMedicationEntry,
});
