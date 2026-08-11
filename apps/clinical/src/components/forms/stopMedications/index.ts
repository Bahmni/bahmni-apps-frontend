import {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  createEncounterBundle,
} from '@bahmni/services';
import {
  createEncounterBundleEntry,
  postEncounterBundle,
} from '../../../services/encounterBundleService';
import { stopMedication } from '../../../services/stopMedicationService';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import { useStopMedicationStore } from '../../../stores/stopMedicationsStore';
import { createEncounterResource } from '../../../utils/fhir/encounterResourceCreator';
import { registerInputControl } from '../registry';
import StopMedicationForm from './StopMedicationForm';

async function resolveStopEncounterUuid(
  sessionEncounterUuid?: string,
): Promise<string | undefined> {
  if (sessionEncounterUuid) return sessionEncounterUuid;

  const {
    selectedEncounterType,
    patientUUID,
    encounterParticipants,
    activeVisit,
    selectedLocation,
  } = useEncounterDetailsStore.getState();

  if (
    !selectedEncounterType ||
    !patientUUID ||
    !activeVisit?.id ||
    !selectedLocation?.uuid
  ) {
    return undefined;
  }

  const encounterResource = createEncounterResource(
    selectedEncounterType.uuid,
    selectedEncounterType.name,
    patientUUID,
    encounterParticipants.map((p) => p.uuid),
    activeVisit.id,
    [],
    selectedLocation.uuid,
    null,
  );

  const entry = createEncounterBundleEntry(null, encounterResource);
  const bundle = await postEncounterBundle<{
    entry?: { resource?: { id?: string } }[];
  }>(createEncounterBundle([entry]));

  return bundle?.entry?.[0]?.resource?.id ?? undefined;
}

registerInputControl({
  key: 'stopMedications',
  onActionTriggered: true,
  component: StopMedicationForm,
  reset: () => useStopMedicationStore.getState().reset(),
  validate: () => useStopMedicationStore.getState().validate(),
  hasData: () => useStopMedicationStore.getState().hasData(),
  subscribe: (cb) => useStopMedicationStore.subscribe(cb),
  onDirectSubmit: async (sessionEncounterUuid?: string) => {
    const state = useStopMedicationStore.getState();
    if (!state.medicationToStop?.id || !state.stopReason) return;

    const patientUuid = state.medicationToStop.subject?.reference
      ?.split('/')
      .pop();

    const encounterUuid = await resolveStopEncounterUuid(sessionEncounterUuid);

    await stopMedication({
      medicationRequestId: state.medicationToStop.id,
      reason: state.stopReason,
      effectiveDate: state.stopDate,
      note: state.note || undefined,
      encounterUuid,
    });

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
