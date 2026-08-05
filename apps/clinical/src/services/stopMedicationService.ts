import { get, post } from '@bahmni/services';
import { MedicationRequest, ValueSet, Bundle } from 'fhir/r4';
import {
  STOP_REASON_VALUESET_URL,
  STOP_REASON_VALUESET_EXPAND_URL,
  STOP_MEDICATION_URL,
} from '../constants/app';

export interface StopReason {
  uuid: string;
  display: string;
}

/**
 * Fetches stop reasons from the FHIR ValueSet "Stopped Order Reason".
 *
 * 1. Searches: GET /ws/fhir2/R4/ValueSet?title=Stopped+Order+Reason
 * 2. Expands: GET /ws/fhir2/R4/ValueSet/{uuid}/$expand
 * 3. Returns the expanded concepts as stop reasons
 */
export async function fetchStopReasons(): Promise<StopReason[]> {
  try {
    const searchBundle = await get<Bundle>(STOP_REASON_VALUESET_URL);

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

interface StopMedicationParams {
  medicationRequestId: string;
  reason: StopReason;
  effectiveDate: Date;
  note?: string;
}

/**
 * Calls the FHIR $stop operation on a MedicationRequest.
 * POST /openmrs/ws/fhir2/R4/MedicationRequest/{id}/$stop
 */
export async function stopMedication(
  params: StopMedicationParams,
): Promise<MedicationRequest> {
  const { medicationRequestId, reason, effectiveDate, note } = params;

  const fhirParams = {
    resourceType: 'Parameters' as const,
    parameter: [
      {
        name: 'reason',
        valueCodableConcept: {
          coding: [{ code: reason.uuid, display: reason.display }],
          text: reason.display,
        },
      },
      {
        name: 'effectiveDate',
        valueDate: `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`,
      },
      ...(note ? [{ name: 'note', valueString: note }] : []),
    ],
  };

  return post<MedicationRequest>(
    STOP_MEDICATION_URL(medicationRequestId),
    fhirParams,
  );
}
