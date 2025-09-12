import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}`;

export const PATIENT_SEARCH_BASE_URL =
  '/openmrs/ws/rest/v1/bahmni/search/patient/lucene';

export const PATIENT_SEARCH_CONFIG = {
  PHONE_NUMBER: 'phoneNumber',
  ALTERNATE_PHONE_NUMBER: 'alternatePhoneNumber',
} as const;
