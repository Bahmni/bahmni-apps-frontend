import { Observation, Bundle } from 'fhir/r4';
import { get } from '../api';
import { FHIR_OBSERVATION_URL } from './constants';

/**
 * Fetch patient observation bundle from FHIR API
 * @param patientUuid - Patient UUID
 * @param conceptCodes - Array of concept UUIDs
 * @returns Promise resolving to FHIR observation bundle
 */
export async function getPatientObservationsBundle(
  patientUuid: string,
  conceptCodes: string[],
): Promise<Bundle<Observation>> {
  const url = FHIR_OBSERVATION_URL(patientUuid, conceptCodes);
  return await get<Bundle<Observation>>(url);
}

/**
 * Fetch patient observations from FHIR API
 * @param patientUuid - Patient UUID
 * @param conceptCodes - Array of concept UUIDs
 * @returns Promise resolving to FHIR observation
 */
export async function getPatientObservations(
  patientUUID: string,
  conceptCodes: string[],
): Promise<Observation[]> {
  const bundle = await getPatientObservationsBundle(patientUUID, conceptCodes);
  const observations =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Observation')
      .map((entry) => entry.resource as Observation) ?? [];

  return observations;
}
