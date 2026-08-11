import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
} from '@bahmni/services';
import { cancelVaccination } from '../../../services/cancelVaccinationService';
import { useCancelVaccinationStore } from '../../../stores/cancelVaccinationStore';
import { registerInputControl } from '../registry';
import CancelVaccinationForm from './CancelVaccinationForm';

registerInputControl({
  key: 'cancelVaccination',
  onActionTriggered: true,
  component: CancelVaccinationForm,
  reset: () => useCancelVaccinationStore.getState().reset(),
  validate: () => useCancelVaccinationStore.getState().validate(),
  hasData: () => useCancelVaccinationStore.getState().hasData(),
  subscribe: (cb) => useCancelVaccinationStore.subscribe(cb),
  onDirectSubmit: async () => {
    const state = useCancelVaccinationStore.getState();
    if (!state.medicationToCancel?.id) return;
    const encounterUuid =
      state.medicationToCancel.encounter?.reference?.split('/').pop();
    await cancelVaccination({
      medicationRequestId: state.medicationToCancel.id,
      reason: state.cancellationReason ?? '',
      encounterUuid,
      note: state.note || undefined,
    });
    const patientUuid = state.medicationToCancel.subject?.reference
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
