import { stopMedication } from '../../../services/stopMedicationService';
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
  onDirectSubmit: async () => {
    const state = useStopMedicationStore.getState();
    if (!state.medicationToStop?.id || !state.stopReason) return;
    await stopMedication({
      medicationRequestId: state.medicationToStop.id,
      reason: state.stopReason,
      effectiveDate: state.stopDate,
      note: state.note || undefined,
    });
  },
});
