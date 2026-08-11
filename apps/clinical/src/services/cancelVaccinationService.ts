import { get, post } from '@bahmni/services';
import { MedicationRequest, ValueSet, Bundle } from 'fhir/r4';
import {
  CANCEL_REASON_VALUESET_URL,
  CANCEL_REASON_VALUESET_EXPAND_URL,
  CANCEL_VACCINATION_URL,
} from '../constants/app';

export interface CancelReason {
  uuid: string;
  display: string;
}

/**
 * Fetches cancellation reasons from the FHIR ValueSet "Stopped Order Reason".
 * Reuses the same ValueSet as stop medication reasons — the backend distinguishes
 * stop vs cancel based on the order type (vaccination vs regular medication).
 *
 * 1. Searches: GET /ws/fhir2/R4/ValueSet?title=Stopped+Order+Reason
 * 2. Expands: GET /ws/fhir2/R4/ValueSet/{uuid}/$expand
 * 3. Returns the expanded concepts as cancellation reasons
 */
export async function fetchCancelReasons(): Promise<CancelReason[]> {
  try {
    const searchBundle = await get<Bundle>(CANCEL_REASON_VALUESET_URL);

    const valueSetEntry = searchBundle.entry?.[0]?.resource as
      | ValueSet
      | undefined;
    if (!valueSetEntry?.id) return [];

    const expanded = await get<ValueSet>(
      CANCEL_REASON_VALUESET_EXPAND_URL(valueSetEntry.id),
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

interface CancelVaccinationParams {
  medicationRequestId: string;
  reason: string;
  note?: string;
}

/**
 * Calls the FHIR $stop operation on a MedicationRequest to cancel a vaccination order.
 * POST /openmrs/ws/fhir2/R4/MedicationRequest/{id}/$stop
 *
 * Uses the same $stop FHIR operation as stop medication — the backend advice in
 * openmrs-module-iom-extension intercepts this to handle Odoo cancellation/reversal.
 */
export async function cancelVaccination(
  params: CancelVaccinationParams,
): Promise<MedicationRequest> {
  const { medicationRequestId, reason, note } = params;

  const today = new Date();
  const fhirParams = {
    resourceType: 'Parameters' as const,
    parameter: [
      { name: 'reason', valueString: reason },
      {
        name: 'effectiveDate',
        valueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      },
      ...(note ? [{ name: 'note', valueString: note }] : []),
    ],
  };

  return post<MedicationRequest>(
    CANCEL_VACCINATION_URL(medicationRequestId),
    fhirParams,
  );
}
