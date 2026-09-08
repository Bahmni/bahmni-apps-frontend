import { del } from '../api';
import { LOGIN_PATH } from '../api/constants';
import { LOGOUT_COOKIES, SESSION_URL } from '../constants/app';
import { getErrorKind } from '../errorHandling';
import { deleteCookie } from '../utils';

// The client has no global request timeout, so without one here a stalled
// logout call would hang indefinitely instead of surfacing a timeout error.
const LOGOUT_REQUEST_TIMEOUT_MS = 10000;

/**
 * Logs the user out by invalidating the server-side session first, then clearing
 * the local session cookies and redirecting to the login page.
 *
 */
export const logout = async (): Promise<void> => {
  try {
    await del(SESSION_URL, { timeout: LOGOUT_REQUEST_TIMEOUT_MS });
  } catch (error) {
    // A 401 means the session had already ended server-side — the api client
    // interceptor redirects to login on its own, but local cookies must still
    // be cleared here so no stale session state lingers after that redirect.
    if (getErrorKind(error) === 'unauthorized') {
      LOGOUT_COOKIES.forEach((cookieName) => deleteCookie(cookieName));
    }
    throw error;
  }
  LOGOUT_COOKIES.forEach((cookieName) => deleteCookie(cookieName));
  globalThis.location.href = LOGIN_PATH;
};
