import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const ENCOUNTER_SEARCH_URL = OPENMRS_FHIR_R4 + '/Encounter';
//TODO: chnage URL to use bahmni config api
export const ENCOUNTER_SESSION_DURATION_GP_URL =
  OPENMRS_REST_V1 + '/systemsetting/bahmni.encountersession.duration';
export const CONSULTATION_ENCOUNTER_TYPE_UUID =
  'd34fe3ab-5e07-11ef-8f7c-0242ac120002';