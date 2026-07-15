import { OPENMRS_FHIR_R4 } from '../constants/app';

export const FHIR_OBSERVATION_URL = (
  patientUuid: string,
  conceptCodes?: string[],
  serviceRequestId?: string,
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}`;

  if (conceptCodes && conceptCodes.length > 0) {
    const codeParams = conceptCodes.join(',');
    url += `&code=${codeParams}`;
  }

  if (serviceRequestId) {
    url += `&based-on=ServiceRequest/${serviceRequestId}`;
  }

  url +=
    '&_include=Observation:has-member&_include=Observation:encounter&_sort=-_lastUpdated';

  return url;
};

export const FHIR_OBSERVATION_WITH_ENCOUNTER_URL = (
  patientUuid: string,
  conceptCodes?: string[],
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
