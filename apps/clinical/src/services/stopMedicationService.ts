import {
  get,
  post,
  createEncounterBundle,
  findActiveEncounterInSession,
  FHIR_EXT_MEDICATION_REQUEST_NOTE_CATEGORY,
  OPENMRS_FHIR_R4,
} from '@bahmni/services';
import { Bundle, MedicationRequest, ValueSet } from 'fhir/r4';
import {
  STOP_REASON_VALUESET_TITLE,
  STOP_REASON_VALUESET_EXPAND_URL,
} from '../constants/app';
import { useEncounterDetailsStore } from '../stores/encounterDetailsStore';
import { createEncounterResource } from '../utils/fhir/encounterResourceCreator';
import {
  createEncounterBundleEntry,
  postEncounterBundle,
} from './encounterBundleService';

const MEDICATION_REQUEST_URL = `${OPENMRS_FHIR_R4}/MedicationRequest`;

export const FHIR_EXT_MEDICATION_REQUEST_DATE_STOPPED =
  'http://fhir.bahmni.org/ext/medicationRequest/dateStopped'; // NOSONAR

export interface StopReason {
  uuid: string;
  display: string;
}

export async function fetchStopReasons(
  conceptSetName?: string,
): Promise<StopReason[]> {
  try {
    const title = conceptSetName ?? STOP_REASON_VALUESET_TITLE;
    const url = `${OPENMRS_FHIR_R4}/ValueSet?title=${encodeURIComponent(title)}`;
    const searchBundle = await get<Bundle>(url);
    const valueSetEntry = searchBundle.entry?.[0]?.resource as
      | ValueSet
      | undefined;
    if (!valueSetEntry?.id) return [];
    const expanded = await get<ValueSet>(
      STOP_REASON_VALUESET_EXPAND_URL(valueSetEntry.id),
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

async function resolveStopEncounter(patientUuid: string): Promise<string> {
  const {
    selectedEncounterType,
    patientUUID,
    practitioner,
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
    throw new Error('Missing session context for stop encounter');
  }

  // Reuse existing active session encounter if one exists
  const existing = await findActiveEncounterInSession(
    patientUuid,
    practitioner?.uuid,
    undefined,
    selectedEncounterType.uuid,
  );
  if (existing?.id) return existing.id;

  // No active encounter — create one.
  // EncounterDetails form is hidden in stop-only flow so encounterParticipants may be
  // empty; fall back to the active practitioner so the encounter is discoverable by
  // findActiveEncounterInSession (which filters by practitioner participant).
  const participants =
    encounterParticipants.length > 0
      ? encounterParticipants.map((p) => p.uuid)
      : practitioner
        ? [practitioner.uuid]
        : [];

  const encounterResource = createEncounterResource(
    selectedEncounterType.uuid,
    selectedEncounterType.name,
    patientUuid,
    participants,
    activeVisit.id,
    [],
    selectedLocation.uuid,
    null,
  );

  const entry = createEncounterBundleEntry(null, encounterResource);
  const bundle = await postEncounterBundle<Bundle>(
    createEncounterBundle([entry]),
  );
  const encounterId = bundle?.entry?.[0]?.resource?.id;
  if (!encounterId) throw new Error('Failed to create encounter for stop');
  return encounterId;
}

interface StopMedicationParams {
  medicationRequestId: string;
  patientUuid: string;
  reason: StopReason;
  effectiveDate: Date;
  note?: string;
}

export async function stopMedication(
  params: StopMedicationParams,
): Promise<void> {
  const { medicationRequestId, patientUuid, reason, effectiveDate, note } =
    params;

  const encounterId = await resolveStopEncounter(patientUuid);

  const stopDate = `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`;

  const resource: Record<string, unknown> = {
    resourceType: 'MedicationRequest',
    status: 'stopped',
    intent: 'order',
    subject: { reference: `Patient/${patientUuid}` },
    medicationCodeableConcept: { text: '' },
    priorPrescription: {
      reference: `MedicationRequest/${medicationRequestId}`,
    },
    encounter: { reference: `Encounter/${encounterId}` },
    statusReason: {
      coding: [{ code: reason.uuid, display: reason.display }],
      text: reason.display,
    },
    extension: [
      {
        url: FHIR_EXT_MEDICATION_REQUEST_DATE_STOPPED,
        valueDateTime: stopDate,
      },
    ],
  };

  if (note) {
    resource.note = [
      {
        extension: [
          {
            url: FHIR_EXT_MEDICATION_REQUEST_NOTE_CATEGORY,
            valueCode: 'cancellation-note',
          },
        ],
        text: note,
      },
    ];
  }

  await post<MedicationRequest>(MEDICATION_REQUEST_URL, resource);
}
