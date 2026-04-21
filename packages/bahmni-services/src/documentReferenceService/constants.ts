import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_DOCUMENT_REFERENCES_URL = (
  patientUuid: string,
  encounterUuids?: string[],
  count: number = 100,
  offset: number = 0,
): string => {
  const baseUrl = `${OPENMRS_FHIR_R4}/DocumentReference?patient=${patientUuid}&_sort=-date&_count=${count}&_getpagesoffset=${offset}`;
  if (encounterUuids && encounterUuids.length > 0) {
    return `${baseUrl}&encounter=${encounterUuids.join(',')}`;
  }
  return baseUrl;
};
