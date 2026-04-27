import {
  OPENMRS_REST_V1,
  SESSION_URL,
  BAHMNI_USER_COOKIE_NAME,
} from '../constants/app';

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 +
  `/user?username=${username}&v=custom:(display,username,uuid)`;
export const BAHMNI_USER_LOCATION_COOKIE = 'bahmni.user.location';
export const AVAILABLE_LOCATIONS_URL = `${OPENMRS_REST_V1}/location?tags=Login Location&v=default`;
export const SAVE_USER_LOCATION_URL = (userUuid: string) =>
  OPENMRS_REST_V1 + `/user/${userUuid}?v=full`;
export const APP_SETTINGS_URL = (module: string) =>
  OPENMRS_REST_V1 + `/bahmni/app/setting?module=${module}`;
export const DEFAULT_DATE_FORMAT_PROPERTY = 'default_dateFormat';
export const LOGOUT_URL = SESSION_URL;
export const LOGOUT_COOKIES = [
  BAHMNI_USER_COOKIE_NAME,
  BAHMNI_USER_LOCATION_COOKIE,
];
export const ERROR_MESSAGES = {
  LOGOUT_FAILED: 'USER_LOGOUT_FAILED',
};
