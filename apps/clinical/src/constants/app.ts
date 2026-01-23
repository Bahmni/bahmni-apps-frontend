import { OPENMRS_REST_V1, OPENMRS_FHIR_R4 } from '@bahmni/services';

export const BAHMNI_CLINICAL_PATH = '/bahmni/clinical/index.html';
export const ENCOUNTER_CONCEPTS_URL =
  OPENMRS_REST_V1 +
  '/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS';

export const BAHMNI_USER_LOCATION_COOKIE_NAME = 'bahmni.user.location';

export const PROVIDER_RESOURCE_URL = (userUUID: string) =>
  OPENMRS_REST_V1 + `/provider?user=${userUUID}&v=custom:(uuid,display,person)`;

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;

export const CONSULTATION_BUNDLE_URL = OPENMRS_FHIR_R4 + '/ConsultationBundle';
export const ENCOUNTER_SEARCH_URL = OPENMRS_FHIR_R4 + '/Encounter';
export const OBSERVATION_FORMS_URL =
  OPENMRS_REST_V1 + '/bahmniie/form/latestPublishedForms';
export const CLINICAL_NAMESPACE = 'clinical';
