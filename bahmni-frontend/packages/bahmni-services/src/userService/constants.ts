import { OPENMRS_REST_V1 } from "../constants/app";

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;