import { OPENMRS_REST_V1 } from '../constants/app';

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;
export const BAHMNI_USER_LOCATION_COOKIE = 'bahmni.user.location';
export const APP_SETTINGS_URL = (module: string) =>
  OPENMRS_REST_V1 + `/bahmni/app/setting?module=${module}`;
export const DEFAULT_DATE_FORMAT_PROPERTY = 'default_dateFormat';
