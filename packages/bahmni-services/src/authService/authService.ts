import { del } from '../api';
import { LOGIN_PATH } from '../api/constants';
import { SESSION_URL } from '../constants/app';
import { LOGOUT_COOKIES } from '../userService/constants';
import { deleteCookie } from '../utils';

/**
 * Logs the user out by invalidating the server-side session first, then clearing
 * the local session cookies and redirecting to the login page.
 *
 */
export const logout = async (): Promise<void> => {
  await del(SESSION_URL);
  LOGOUT_COOKIES.forEach((cookieName) => deleteCookie(cookieName));
  globalThis.location.href = LOGIN_PATH;
};
