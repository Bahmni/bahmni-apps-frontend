/**
 * Interface representing OpenMRS User resource from REST API
 */
export interface User {
  username: string;
  uuid: string;
}

/**
 * Interface representing User response from REST API
 */
export interface UserResponse {
  results: User[];
}
