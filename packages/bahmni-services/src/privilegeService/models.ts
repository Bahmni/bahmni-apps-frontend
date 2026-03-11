/**
 * Interface for user privilege from OpenMRS session API
 */
export interface UserPrivilege {
  uuid: string;
  name: string;
  description?: string;
}

export interface SessionResponse {
  user: {
    privileges: UserPrivilege[];
  };
}
