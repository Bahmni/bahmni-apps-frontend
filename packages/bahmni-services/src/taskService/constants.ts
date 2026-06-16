import { OPENMRS_FHIR_R4 } from '../constants/app';

export const TASKS_URL = (
  patientUuid: string,
  basedOnReference?: string,
  encounterUuids?: string[],
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 + `/Tasks?patient=${patientUuid}&_sort=-_lastUpdated`;
  let url = baseUrl;

  if (basedOnReference) {
    url += `&based-on=${basedOnReference}`;
  }

  if (encounterUuids && encounterUuids.length > 0) {
    url += `&encounter=${encounterUuids.join(',')}`;
  }

  return url;
};
