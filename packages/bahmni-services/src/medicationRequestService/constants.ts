import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

/**
 * Query parameters for medication requests
 * These separate parameters to allow flexibility in API calls and avoid large payloads
 */
export const MEDICATION_REQUEST_QUERY_PARAMS = {
  // Base parameters for all medication request queries
  SORT: '_sort=-_lastUpdated',
  COUNT: '_count=100',
  // Include parameter to fetch related Medication resource in single call
  // Trade-off: Larger payload but avoids redundant API calls
  // Use only when medication details are needed immediately
  INCLUDE_MEDICATION: '_include=MedicationRequest:medication',
} as const;

export const PATIENT_MEDICATION_RESOURCE_URL = (
  patientUUID: string,
  code?: string,
  encounterUuids?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 +
    '/MedicationRequest?' +
    MEDICATION_REQUEST_QUERY_PARAMS.SORT +
    '&' +
    MEDICATION_REQUEST_QUERY_PARAMS.COUNT;
  let url = `${baseUrl}&patient=${patientUUID}`;

  if (code) {
    url += `&code=${code}`;
  }

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  }
  return url;
};

/**
 * Patient medication URL with related Medication resource included
 * Use this when you need medication details to avoid making separate medication lookup calls
 * Note: Payload will be larger, so use only when needed
 */
export const PATIENT_MEDICATION_RESOURCE_URL_WITH_INCLUDE = (
  patientUUID: string,
  code?: string,
  encounterUuids?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 +
    '/MedicationRequest?' +
    MEDICATION_REQUEST_QUERY_PARAMS.SORT +
    '&' +
    MEDICATION_REQUEST_QUERY_PARAMS.COUNT +
    '&' +
    MEDICATION_REQUEST_QUERY_PARAMS.INCLUDE_MEDICATION;
  let url = `${baseUrl}&patient=${patientUUID}`;

  if (code) {
    url += `&code=${code}`;
  }

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  }
  return url;
};

export const MEDICATION_ORDERS_METADATA_URL =
  OPENMRS_REST_V1 + '/bahmnicore/config/drugOrders';

/**
 * Search medications by name
 * Returns Medication resources with form information for dosage form display
 */
export const MEDICATIONS_SEARCH_URL = (searchTerm: string, count: number) =>
  OPENMRS_FHIR_R4 +
  `/Medication?name=${encodeURIComponent(searchTerm)}&_count=${count}&_sort=-_lastUpdated`;

export const VACCINES_URL =
  OPENMRS_FHIR_R4 + '/Medication?code=http://hl7.org/fhir/sid/cvx|&_count=100';
