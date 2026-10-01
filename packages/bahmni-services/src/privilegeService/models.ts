/**
 * Interface for user privilege from OpenMRS session API
 */
export interface UserPrivilege {
  uuid: string;
  name: string;
  description?: string;
}

/**
 * The OpenMRS /session payload, as far as callers here rely on it.
 * `user` is optional rather than just nullable: an unauthenticated session
 * omits the key altogether, responding with only
 * { authenticated: false, locale, allowedLocales }.
 */
export interface SessionResponse {
  user?: {
    privileges: UserPrivilege[];
    username?: string;
  } | null;
}

/**
 * Router state an app's privilege guard hands to the home app when it
 * redirects there, so home can raise the access-denied notification.
 * `app` is the already-translated name of the app that denied access.
 */
export interface AccessDeniedRouteState {
  accessDenied?: { app?: string };
}
