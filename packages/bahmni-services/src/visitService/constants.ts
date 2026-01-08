import { OPENMRS_REST_V1 } from '../constants/app';

export const VISIT_TYPES_URL = () =>
  OPENMRS_REST_V1 +
  `/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS`;

export const CREATE_VISIT_URL = OPENMRS_REST_V1 + '/visit';

export const GET_ACTIVE_VISIT_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 +
  `/visit?patient=${patientUuid}&includeInactive=false&v=custom:(uuid,visitType,startDatetime,stopDatetime)`;

export const GET_VISIT_LOCATION = (loginLocation: string) =>
  OPENMRS_REST_V1 + `/bahmnicore/visitLocation/${loginLocation}`;
