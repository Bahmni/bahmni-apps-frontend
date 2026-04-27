/**
 * Interface representing OpenMRS User resource from REST API
 */
export interface User {
  display: string;
  username: string;
  uuid: string;
}

export interface UserLocation {
  name: string;
  uuid: string;
  display?: string;
}

/**
 * Interface representing User response from REST API
 */
export interface UserResponse {
  results: User[];
}

/**
 * Interface representing App Settings response from Bahmni API
 */
export interface AppSetting {
  property: string;
  value: string;
}

export type AppSettingsResponse = AppSetting[];

/**
 * Interface representing Locations response from OpenMRS REST API
 */
export interface LocationsResponse {
  results: UserLocation[];
}
