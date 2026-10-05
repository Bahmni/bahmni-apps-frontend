/**
 * Interface representing OpenMRS User resource from REST API
 */
export interface User {
  display: string;
  username: string;
  uuid: string;
  userProperties?: Record<string, string>;
}

/**
 * Last executed common-search criteria persisted as a user property.
 * The payload is generic so services stays independent of the widgets' search types.
 */
export interface RecentSearchCriteria<TCriteria = unknown> {
  version: 1;
  savedAt: string;
  payload: { entity: string; criteria: TCriteria };
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
