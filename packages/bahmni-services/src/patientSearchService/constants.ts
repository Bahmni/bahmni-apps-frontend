export const PATIENT_SEARCH_BASE_URL =
  '/openmrs/ws/rest/v1/bahmni/search/patient/lucene';

export const PATIENT_SEARCH_CONFIG = {
  PHONE_NUMBER: 'phoneNumber',
  ALTERNATE_PHONE_NUMBER: 'alternatePhoneNumber',
} as const;

export const PATIENT_SEARCH_DEFAULTS = {
  FILTER_ON_ALL_IDENTIFIERS: true,
} as const;

export const LOCAL_STORAGE_KEYS = {
  LOGIN_LOCATION_UUID: 'loginLocationUuid',
} as const;
