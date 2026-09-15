import { del, get } from '../api';
import { LOGIN_PATH } from '../api/constants';
import {
  BAHMNI_USER_COOKIE_NAME,
  LOGOUT_COOKIES,
  SESSION_URL,
} from '../constants/app';
import { getErrorKind } from '../errorHandling';
import { deleteCookie, getCookieByName } from '../utils';

interface SessionUserResponse {
  user?: { username?: string } | null;
}

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

// Bahmni takes the logged-in identity from the bahmni.user cookie, while
// OpenMRS decides what the caller may actually do from its own server-side
// session. Logging into OpenMRS directly as a different user leaves the cookie
// stale: Bahmni keeps showing the old username while operating with the new
// user's privileges. Nothing surfaces as an error, because the session is
// perfectly valid — it just belongs to someone else.

// The events that trigger a check can fire in quick succession, so a check
// already running is reused instead of issuing a second /session request.
let inFlightCheck: Promise<void> | null = null;

/**
 * Reads the username Bahmni recorded at login. Mirrors the decoding in
 * userService.getCurrentUser — the cookie value is URL encoded and quote
 * wrapped.
 * @returns The username, or null when there is no bahmni.user cookie
 */
const getCookieUsername = (): string | null => {
  const encodedUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedUsername) {
    return null;
  }
  return decodeURIComponent(encodedUsername).replace(/^"(.*)"$/, '$1');
};

const runSessionUserCheck = async (): Promise<void> => {
  const cookieUsername = getCookieUsername();
  // No cookie means nobody logged in through Bahmni, so there is no recorded
  // identity to contradict. Any subsequent call returns a 401, which the api
  // client interceptor already redirects to login on.
  if (!cookieUsername) {
    return;
  }

  let session: SessionUserResponse;
  try {
    session = await get<SessionUserResponse>(SESSION_URL);
  } catch {
    // A failed lookup is not evidence that the user changed — a network blip
    // looks identical — so the session is left alone rather than logging
    // someone out on a false positive.
    return;
  }

  const sessionUsername = session.user?.username;
  if (
    sessionUsername &&
    sessionUsername.toLowerCase() === cookieUsername.toLowerCase()
  ) {
    return;
  }

  await logout();
};

/**
 * Invalidates the session when the OpenMRS session user no longer matches the
 * user Bahmni recorded at login, ending the OpenMRS session too and
 * redirecting to the login page. Safe to call repeatedly — concurrent calls
 * share a single check.
 * @returns Promise resolving once the check, and any logout, has completed
 * @throws Error when the logout itself fails
 */
export const validateSessionUser = async (): Promise<void> => {
  inFlightCheck ??= runSessionUserCheck().finally(() => {
    inFlightCheck = null;
  });
  return inFlightCheck;
};
