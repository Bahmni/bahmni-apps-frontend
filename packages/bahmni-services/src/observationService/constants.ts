import { OPENMRS_FHIR_R4 } from '../constants/app';

export const FHIR_OBSERVATION_URL = (
  patientUuid: string,
  conceptCodes?: string[],
  serviceRequestId?: string,
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}&_sort=-_lastUpdated`;

  if (conceptCodes && conceptCodes.length > 0) {
    const codeParams = conceptCodes.join(',');
    url += `&code=${codeParams}`;
  }

  if (serviceRequestId) {
    url += `&based-on=${serviceRequestId}`;
  }

  return url;
};

export const FHIR_OBSERVATION_WITH_ENCOUNTER_URL = (
  patientUuid: string,
  conceptCodes: string[],
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}`;

  if (conceptCodes && conceptCodes.length > 0) {
    const codeParams = conceptCodes.join(',');
    url += `&code=${codeParams}`;
  }

  url +=
    '&_include=Observation:has-member&_include=Observation:encounter&_sort=-_lastUpdated';

  return url;
};

export const FHIR_OBSERVATIONS_BY_ENCOUNTER_URL = (encounterUUID: string) =>
  `${OPENMRS_FHIR_R4}/Observation/$fetch-all?encounter=${encounterUUID}`;
