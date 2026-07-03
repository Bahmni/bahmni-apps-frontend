import { OPENMRS_REST_V1, OPENMRS_FHIR_R4 } from '@bahmni/services';

export const BAHMNI_CLINICAL_PATH =
  '/bahmni/clinical/index.html#/default/patient/search';
export const ENCOUNTER_CONCEPTS_URL =
  OPENMRS_REST_V1 +
  '/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS';

export const BAHMNI_USER_LOCATION_COOKIE_NAME = 'bahmni.user.location';

export const PROVIDER_RESOURCE_URL = (userUUID: string) =>
  OPENMRS_REST_V1 + `/provider?user=${userUUID}&v=custom:(uuid,display,person)`;

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;

export const ENCOUNTER_BUNDLE_URL = OPENMRS_FHIR_R4 + '/EncounterBundle';
export const ENCOUNTER_SEARCH_URL = OPENMRS_FHIR_R4 + '/Encounter';
export const OBSERVATION_FORMS_URL =
  OPENMRS_REST_V1 + '/bahmniie/form/latestPublishedForms';
export const CLINICAL_NAMESPACE = 'clinical';

export const CLINICAL_V2_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/clinical/v2';

export const CDSS_SERVER_CONFIG_URL = `${CLINICAL_V2_CONFIG_BASE_URL}/cdss-servers.json`;

export const STOP_REASON_VALUESET_TITLE = 'Stopped Order Reason';
export const STOP_REASON_VALUESET_URL =
  OPENMRS_FHIR_R4 +
  `/ValueSet?title=${encodeURIComponent('Stopped Order Reason')}`;
export const STOP_REASON_VALUESET_EXPAND_URL = (uuid: string) =>
  OPENMRS_FHIR_R4 + `/ValueSet/${uuid}/$expand`;
export const STOP_MEDICATION_URL = (id: string) =>
  OPENMRS_FHIR_R4 + `/MedicationRequest/${id}/$stop`;
