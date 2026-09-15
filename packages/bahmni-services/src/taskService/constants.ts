import { OPENMRS_FHIR_R4 } from '../constants/app';

export const TASKS_URL = (
  patientUuid?: string,
  basedOnReference?: string,
  encounterUuids?: string[],
) => {
  const baseUrl = OPENMRS_FHIR_R4 + `/Task?_sort=-_lastUpdated`;
  let url = baseUrl;

  if (patientUuid) {
    url += `&subject=${patientUuid}`;
  }

  if (basedOnReference) {
    url += `&based-on=${basedOnReference}`;
  }

  if (encounterUuids && encounterUuids.length > 0) {
    url += `&encounter=${encounterUuids.join(',')}`;
  }

  return url;
};

export const FHIR_TASK_URL = '/openmrs/ws/fhir2/R4/Task';

export const TASK_SEARCH_URL = `${FHIR_TASK_URL}/_search`;

export const TASKS_BY_BASED_ON_URL = (basedOnRefs: string[]) =>
  `${FHIR_TASK_URL}?based-on=${basedOnRefs.join(',')}&_include=Task:owner&_count=${basedOnRefs.length}`;
