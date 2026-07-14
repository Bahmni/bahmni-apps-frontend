import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
} from '@bahmni/services';
import { stopMedication } from '../../../services/stopMedicationService';
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
  onDirectSubmit: async () => {
    const state = useStopMedicationStore.getState();
    if (!state.medicationToStop?.id || !state.stopReason) return;
    await stopMedication({
      medicationRequestId: state.medicationToStop.id,
      reason: state.stopReason,
      effectiveDate: state.stopDate,
      note: state.note || undefined,
    });
    const patientUuid = state.medicationToStop.subject?.reference
      ?.split('/')
      .pop();
    if (patientUuid) {
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION
          .eventType as AuditEventType,
        patientUuid,
        messageParams: {},
      });
    }
  },
});
