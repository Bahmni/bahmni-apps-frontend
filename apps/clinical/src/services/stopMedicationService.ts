import { get, post } from '@bahmni/services';
import { MedicationRequest, ValueSet, Bundle } from 'fhir/r4';

const FHIR_BASE = '/openmrs/ws/fhir2/R4';
const STOP_REASON_VALUESET_TITLE = 'Stopped Order Reason';

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
    const searchBundle = await get<Bundle>(
      `${FHIR_BASE}/ValueSet?title=${encodeURIComponent(STOP_REASON_VALUESET_TITLE)}`,
    );

    const valueSetEntry = searchBundle.entry?.[0]?.resource as
      | ValueSet
      | undefined;
    if (!valueSetEntry?.id) return [];

    const expanded = await get<ValueSet>(
      `${FHIR_BASE}/ValueSet/${valueSetEntry.id}/$expand`,
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
  reason: string;
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
      { name: 'reason', valueString: reason },
      {
        name: 'effectiveDate',
        valueDate: `${effectiveDate.getFullYear()}-${String(effectiveDate.getMonth() + 1).padStart(2, '0')}-${String(effectiveDate.getDate()).padStart(2, '0')}`,
      },
      ...(note ? [{ name: 'note', valueString: note }] : []),
    ],
  };

  return post<MedicationRequest>(
    `${FHIR_BASE}/MedicationRequest/${medicationRequestId}/$stop`,
    fhirParams,
  );
}
