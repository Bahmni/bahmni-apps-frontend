import { del, get } from '../api';
import { LOGIN_PATH } from '../api/constants';
import {
  BAHMNI_USER_COOKIE_NAME,
  LOGOUT_COOKIES,
  SESSION_URL,
} from '../constants/app';
import { getErrorKind } from '../errorHandling';
import { SessionResponse } from '../privilegeService/models';
import { deleteCookie, getCookieByName, decodeCookieValue } from '../utils';

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

const runSessionUserCheck = async (): Promise<void> => {
  // The username Bahmni recorded at login. No cookie means nobody logged in
  // through Bahmni, so there is no recorded identity to contradict. Any
  // subsequent call returns a 401, which the api client interceptor already
  // redirects to login on.
  const encodedCookieUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedCookieUsername) {
    return;
  }
  const cookieUsername = decodeCookieValue(encodedCookieUsername);

  let session: SessionResponse;
  try {
    session = await get<SessionResponse>(SESSION_URL);
  } catch {
    // A failed lookup is not evidence that the user changed — a network blip
    // looks identical — so the session is left alone rather than logging
    // someone out on a false positive.
    return;
  }

  // Only a username we can actually read, and which actually differs, is
  // treated as the user having changed. A session reporting no identifiable
  // user is deliberately left alone: it means nobody is authenticated rather
  // than somebody else being authenticated, and the api client already
  // redirects to login on the 401 that the next real request returns. Logging
  // out here instead would fire during the gaps where the session legitimately
  // reads as unauthenticated - notably while an app is still starting up - and
  // eject a user who was doing nothing wrong.
  const sessionUsername = session.user?.username;
  if (!sessionUsername) {
    return;
  }
  // Compared case-insensitively because the two sides hold the same name in
  // different forms: the cookie keeps whatever was typed at login, while the
  // session reports the stored form. That is safe here because OpenMRS
  // resolves username case-variants to one account - superman, SUPERMAN and
  // SuPerMan all authenticate and come back as username "superman" on user
  // uuid d7a669e7-5e07-11ef-8f7c-0242ac120002 - so Admin and admin cannot be
  // two distinct users that a case-sensitive check would need to tell apart.
  // Comparing an unambiguous identifier instead is not open to us: the cookie
  // only ever carries a username, never a uuid.
  if (sessionUsername.toLowerCase() === cookieUsername.toLowerCase()) {
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
