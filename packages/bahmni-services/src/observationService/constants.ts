import { OPENMRS_FHIR_R4 } from '../constants/app';

export const FHIR_OBSERVATION_URL = (
  patientUuid: string,
  conceptCodes: string[],
) => {
  const codeParams = conceptCodes.join(',');
  return `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}&code=${codeParams}&_include=Observation:has-member&_sort=-_lastUpdated`;
};

export const FHIR_OBSERVATION_WITH_ENCOUNTER_URL = (
  patientUuid: string,
  conceptCodes: string[],
) => {
  const codeParams = conceptCodes.join(',');
  return `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}&code=${codeParams}&_include=Observation:has-member&_include=Observation:encounter&_sort=-_lastUpdated`;
};
