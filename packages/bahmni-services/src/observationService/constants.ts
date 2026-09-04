import { OPENMRS_FHIR_R4 } from '../constants/app';

export const FHIR_OBSERVATION_URL = (
  patientUuid: string,
  conceptCodes?: string[],
  serviceRequestId?: string,
  includeEncounter?: boolean,
  encounterUuids?: string[],
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation?patient=${patientUuid}&_sort=-_lastUpdated&_count=100`;

  if (conceptCodes && conceptCodes.length > 0) {
    const codeParams = conceptCodes.join(',');
    url += `&code=${codeParams}`;

    if (includeEncounter) {
      url += '&_include=Observation:has-member&_include=Observation:encounter';
    }
  }

  if (serviceRequestId) {
    url += `&based-on=${serviceRequestId}`;
  }

  if (encounterUuids && encounterUuids.length > 0) {
    url += `&encounter=${encounterUuids.join(',')}`;
  }

  return url;
};

export const FHIR_OBSERVATION_LASTN_URL = (
  patientUuid: string,
  conceptCodes?: string[],
  encounterUuids?: string[],
  includeEncounter?: boolean,
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation/$last-n?patient=${patientUuid}&_sort=-_lastUpdated&_count=100&_include=Observation:has-member`;

  if (conceptCodes && conceptCodes.length > 0) {
    url += `&code=${conceptCodes.join(',')}`;

    if (includeEncounter) {
      url += '&_include=Observation:encounter';
    }
  }

  if (encounterUuids && encounterUuids.length > 0) {
    url += `&encounter=${encounterUuids.join(',')}`;
  }

  return url;
};

export const FHIR_OBSERVATIONS_BY_ENCOUNTER_URL = (
  encounterUUID: string,
  basedOn?: string,
) => {
  let url = `${OPENMRS_FHIR_R4}/Observation/$fetch-all?encounter=${encounterUUID}`;
  if (basedOn) {
    url += `&based-on=${basedOn}`;
  }
  return url;
};
