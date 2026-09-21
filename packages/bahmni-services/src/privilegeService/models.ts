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
