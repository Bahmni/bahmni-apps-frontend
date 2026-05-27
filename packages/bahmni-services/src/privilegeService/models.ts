/**
 * Interface for user privilege from OpenMRS session API
 */
export interface UserPrivilege {
  uuid: string;
  name: string;
  description?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    privileges: UserPrivilege[];
  };
}
