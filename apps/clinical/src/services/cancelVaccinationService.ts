import { post } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import { CANCEL_VACCINATION_URL } from '../constants/app';

export interface CancelReason {
  uuid: string;
  display: string;
}

interface CancelVaccinationParams {
  medicationRequestId: string;
  reason: string;
  encounterUuid?: string;
  note?: string;
}

/**
 * Calls the FHIR $stop operation on a MedicationRequest to cancel a vaccination order.
 * POST /openmrs/ws/fhir2/R4/MedicationRequest/{id}/$stop
 *
 * The backend advice in openmrs-module-iom-extension intercepts this call
 * to handle the Odoo cancellation/reversal via /api/v1/quotation/cancel-line-item.
 */
export async function cancelVaccination(
  params: CancelVaccinationParams,
): Promise<MedicationRequest> {
  const { medicationRequestId, reason, encounterUuid, note } = params;

  const today = new Date();
  const fhirParams = {
    resourceType: 'Parameters' as const,
    parameter: [
      {
        name: 'reason',
        valueCodeableConcept: {
          text: reason,
        },
      },
      {
        name: 'effectiveDate',
        valueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      },
      ...(encounterUuid
        ? [{ name: 'encounter', valueString: encounterUuid }]
        : []),
      ...(note ? [{ name: 'note', valueString: note }] : []),
    ],
  };

  return post<MedicationRequest>(
    CANCEL_VACCINATION_URL(medicationRequestId),
    fhirParams,
  );
}
