import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  MedicationStatus,
} from '@bahmni/services';
import { CANCEL_VACCINATION_INPUT_CONTROL_KEY } from '@bahmni/widgets';
import { createStopMedicationEntry } from '../../../services/stopMedicationService';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import type { EncounterContext } from '../models';
import { registerInputControl } from '../registry';
import StopMedicationForm from './StopMedicationForm';

const createBundleEntriesForStopFlow = (ctx: EncounterContext) => {
  const state = useStopMedicationStore.getState();
  if (!state.medicationToStop?.id || !state.stopReason) return [];

  const patientUuid = state.medicationToStop.subject?.reference
    ?.split('/')
    .pop();
  if (!patientUuid) return [];

  const isCancelVaccination =
    state.inputControlKey === CANCEL_VACCINATION_INPUT_CONTROL_KEY;

  const entry = createStopMedicationEntry({
    medicationRequestId: state.medicationToStop.id,
    patientUuid,
    reason: state.stopReason,
    effectiveDate: state.stopDate,
    note: state.note || undefined,
    ctx,
    status: isCancelVaccination
      ? MedicationStatus.Cancelled
      : MedicationStatus.Stopped,
  });

  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION
      .eventType as AuditEventType,
    patientUuid,
    messageParams: {},
  });

  return [entry];
};

registerInputControl({
  key: 'stopMedications',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: createBundleEntriesForStopFlow,
});

registerInputControl({
  key: 'cancelVaccination',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  createBundleEntries: createBundleEntriesForStopFlow,
});
