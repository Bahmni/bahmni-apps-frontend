import { BAHMNI_HOME_PATH, BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { BAHMNI_USER_LOCATION_COOKIE } from '../userService/constants';
import { deleteCookie } from '../utils';

export const logout = (): void => {
  deleteCookie(BAHMNI_USER_COOKIE_NAME);
  deleteCookie(BAHMNI_USER_LOCATION_COOKIE);
  globalThis.location.href = BAHMNI_HOME_PATH;
};
