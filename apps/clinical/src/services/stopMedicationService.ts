import { get, post } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import {
  STOP_REASON_CONCEPT_NAME,
  STOP_REASON_CONCEPT_URL,
  STOP_MEDICATION_URL,
} from '../constants/app';

export interface StopReason {
  uuid: string;
  display: string;
}

interface ConceptMember {
  uuid: string;
  display: string;
}

interface ConceptSearchResult {
  results: Array<{
    uuid: string;
    setMembers: ConceptMember[];
    answers: ConceptMember[];
  }>;
}

/**
 * Fetches stop reasons from the OpenMRS concept "Stopped Order Reason".
 *
 * Returns setMembers (ConvSet) or answers (Coded), whichever is populated.
 * GET /openmrs/ws/rest/v1/concept?name=Stopped+Order+Reason&v=custom:(uuid,setMembers:(uuid,display),answers:(uuid,display))
 */
export async function fetchStopReasons(): Promise<StopReason[]> {
  try {
    const result = await get<ConceptSearchResult>(
      STOP_REASON_CONCEPT_URL(STOP_REASON_CONCEPT_NAME),
    );

    const concept = result.results?.[0];
    if (!concept) return [];

    const members =
      concept.setMembers?.length > 0 ? concept.setMembers : concept.answers;
    if (!members?.length) return [];

    return members.map((m) => ({
      uuid: m.uuid,
      display: m.display,
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
    STOP_MEDICATION_URL(medicationRequestId),
    fhirParams,
  );
}
