import {
  get,
  createBundleEntry,
  FHIR_EXT_MEDICATION_REQUEST_NOTE_CATEGORY,
  OPENMRS_FHIR_R4,
} from '@bahmni/services';
import { BundleEntry, MedicationRequest, ValueSet, Bundle } from 'fhir/r4';
import type { EncounterContext } from '../components/forms/models';
import { STOP_REASON_VALUESET_EXPAND_URL } from '../constants/app';
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

interface StopMedicationEntryParams {
  medicationRequestId: string;
  patientUuid: string;
  reason: StopReason;
  effectiveDate: Date;
  note?: string;
  ctx: EncounterContext;
}

export function createStopMedicationEntry({
  medicationRequestId,
  patientUuid,
  reason,
  effectiveDate,
  note,
  ctx,
}: StopMedicationEntryParams): BundleEntry {
  const stopDate = `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`;

  const resource: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: 'stopped',
    intent: 'order',
    subject: { reference: `Patient/${patientUuid}` },
    medicationCodeableConcept: { text: '' },
    encounter: createEncounterReferenceFromString(ctx.encounterReference),
    priorPrescription: {
      reference: `MedicationRequest/${medicationRequestId}`,
    },
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

  return createBundleEntry(
    `urn:uuid:stop-${medicationRequestId}`,
    resource,
    'POST',
  );
}
