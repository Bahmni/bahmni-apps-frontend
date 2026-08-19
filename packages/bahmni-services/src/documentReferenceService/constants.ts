import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const DOCUMENT_REFERENCE_URL = `${OPENMRS_FHIR_R4}/DocumentReference`;

export const DOCUMENT_UPLOAD_MAX_SIZE_SETTING =
  'bahmni.documentUpload.maxFileSizeInMB';

export const DOCUMENT_UPLOAD_MAX_SIZE_URL = `${OPENMRS_REST_V1}/systemsetting?q=${DOCUMENT_UPLOAD_MAX_SIZE_SETTING}&v=custom:(property,value)`;

export const PATIENT_DOCUMENT_REFERENCES_URL = (
  patientUuid: string,
  encounterUuids?: string[],
  count: number = 100,
  offset: number = 0,
): string => {
  const baseUrl = `${OPENMRS_FHIR_R4}/DocumentReference?patient=${patientUuid}&_sort=-_lastUpdated&_count=${count}&_getpagesoffset=${offset}`;
  if (encounterUuids && encounterUuids.length > 0) {
    return `${baseUrl}&encounter=${encodeURIComponent(encounterUuids.join(','))}`;
  }
  return baseUrl;
};
