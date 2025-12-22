import { get } from '../api';
import { FHIR_OBSERVATION_URL } from './constants';
import { type FHIRObservationBundle } from './models';

/**
 * Fetch patient observations from FHIR API
 * @param patientUuid - Patient UUID
 * @param conceptCodes - Array of concept UUIDs
 * @returns Promise resolving to FHIR observation bundle
 */
export async function getPatientObservations(
  patientUuid: string,
  conceptCodes: string[],
): Promise<FHIRObservationBundle> {
  const url = FHIR_OBSERVATION_URL(patientUuid, conceptCodes);
  return await get<FHIRObservationBundle>(url);
}
