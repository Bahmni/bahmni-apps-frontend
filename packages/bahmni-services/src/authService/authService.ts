import { del } from '../api';
import { LOGIN_PATH } from '../api/constants';
import { LOGOUT_COOKIES, SESSION_URL } from '../constants/app';
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
