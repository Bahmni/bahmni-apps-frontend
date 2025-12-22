import { OPENMRS_FHIR_R4 } from '../constants/app';

/**
 * FHIR Observation endpoint URL builder
 * @param patientUuid - Patient UUID
 * @param conceptCodes - Array of concept UUIDs to filter observations
 * @returns URL string for FHIR Observation endpoint
 */
export const FHIR_OBSERVATION_URL = (
  patientUuid: string,
  conceptCodes: string[],
) => {
  const codeParams = conceptCodes.join(',');
  return `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}&code=${codeParams}&_include=Observation:has-member&_sort=-date`;
};
