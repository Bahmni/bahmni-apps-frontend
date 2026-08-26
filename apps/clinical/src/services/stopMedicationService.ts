import {
  get,
  createBundleEntry,
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  FHIR_EXT_MEDICATION_REQUEST_NOTE_CATEGORY,
  MedicationStatus,
  OPENMRS_FHIR_R4,
} from '@bahmni/services';
import { CANCEL_VACCINATION_INPUT_CONTROL_KEY } from '@bahmni/widgets';
import { BundleEntry, MedicationRequest, ValueSet, Bundle } from 'fhir/r4';
import type { EncounterContext } from '../components/forms/models';
import { STOP_REASON_VALUESET_EXPAND_URL } from '../constants/app';
import { useStopMedicationStore } from '../stores/stopMedicationsStore';
import { createEncounterReferenceFromString } from '../utils/fhir/referenceCreator';

export const FHIR_EXT_MEDICATION_REQUEST_DATE_STOPPED =
  'http://fhir.bahmni.org/ext/medicationRequest/dateStopped'; // NOSONAR

export interface StopReason {
  uuid: string;
  display: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchStopReasons(
  conceptSetUuid: string,
): Promise<StopReason[]> {
  try {
    let valueSetId: string | undefined;

    if (UUID_REGEX.test(conceptSetUuid)) {
      valueSetId = conceptSetUuid;
    } else {
      const url = `${OPENMRS_FHIR_R4}/ValueSet?title=${encodeURIComponent(conceptSetUuid)}`;
      const searchBundle = await get<Bundle>(url);
      const valueSetEntry = searchBundle.entry?.[0]?.resource as
        | ValueSet
        | undefined;
      valueSetId = valueSetEntry?.id;
    }

    if (!valueSetId) return [];
    const expanded = await get<ValueSet>(
      STOP_REASON_VALUESET_EXPAND_URL(valueSetId),
    );
    const contains = expanded.expansion?.contains ?? [];
    return contains.map((c) => ({
      uuid: c.code ?? '',
      display: c.display ?? '',
    }));
  } catch {
    return [];
  }
}

export function createStopMedicationEntry(
  ctx: EncounterContext,
): BundleEntry[] {
  const state = useStopMedicationStore.getState();
  if (!state.medicationToStop?.id || !state.stopReason) return [];

  const patientUuid = state.medicationToStop.subject?.reference
    ?.split('/')
    .pop();
  if (!patientUuid) return [];

  const isCancelVaccination =
    state.inputControlKey === CANCEL_VACCINATION_INPUT_CONTROL_KEY;
  const status = isCancelVaccination
    ? MedicationStatus.Cancelled
    : MedicationStatus.Stopped;

  const stopDate = `${state.stopDate.getFullYear()}-${String(state.stopDate.getMonth() + 1).padStart(2, '0')}-${String(state.stopDate.getDate()).padStart(2, '0')}`;

  const resource: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: status as MedicationRequest['status'],
    intent: 'order',
    subject: { reference: `Patient/${patientUuid}` },
    medicationCodeableConcept: { text: '' },
    encounter: createEncounterReferenceFromString(ctx.encounterReference),
    priorPrescription: {
      reference: `MedicationRequest/${state.medicationToStop.id}`,
    },
    statusReason: {
      coding: [
        { code: state.stopReason.uuid, display: state.stopReason.display },
      ],
      text: state.stopReason.display,
    },
    extension: [
      {
        url: FHIR_EXT_MEDICATION_REQUEST_DATE_STOPPED,
        valueDateTime: stopDate,
      },
    ],
  };

  if (state.note) {
    resource.note = [
      {
        extension: [
          {
            url: FHIR_EXT_MEDICATION_REQUEST_NOTE_CATEGORY,
            valueCode: 'cancellation-note',
          },
        ],
        text: state.note,
      },
    ];
  }

  // [Todo] Refactor | Should Be Dispatched After Submission
  dispatchAuditEvent({
    eventType: AUDIT_LOG_EVENT_DETAILS.STOP_MEDICATION
      .eventType as AuditEventType,
    patientUuid,
    messageParams: {},
  });

  return [
    createBundleEntry(
      `urn:uuid:stop-${state.medicationToStop.id}`,
      resource,
      'POST',
    ),
  ];
}
