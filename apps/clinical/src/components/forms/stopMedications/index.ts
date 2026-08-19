import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
} from '@bahmni/services';
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

  const entry = createStopMedicationEntry({
    medicationRequestId: state.medicationToStop.id,
    patientUuid,
    reason: state.stopReason,
    effectiveDate: state.stopDate,
    note: state.note || undefined,
    ctx,
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
