import {
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  dispatchAuditEvent,
} from '@bahmni/services';
import { createStopMedicationEntry } from '../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import type { SubmissionResult } from '../models';
import { registerInputControl } from '../registry';
import StopMedicationForm from './StopMedicationForm';

const dispatchStopMedicationAuditEvent = (result: SubmissionResult) => {
  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION
      .eventType as AuditEventType,
    patientUuid: result.patientUUID,
    messageParams: {},
  });
};

registerInputControl({
  key: 'stopMedications',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: createStopMedicationEntry,
  onSubmitSuccess: dispatchStopMedicationAuditEvent,
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
  onSubmitSuccess: dispatchStopMedicationAuditEvent,
});
