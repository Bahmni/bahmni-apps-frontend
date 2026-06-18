/**
 * User properties for pinned forms service
 */
export interface UserProperties {
  defaultLocale?: string;
  favouriteObsTemplates?: string;
  pinnedObsTemplates?: string;
  favouriteWards?: string;
  loginAttempts?: string;
  recentlyViewedPatients?: string;
  [key: string]: unknown;
}

/**
 * User data for pinned forms service
 */
export interface UserData {
  uuid: string;
  username: string;
  userProperties?: UserProperties;
  [key: string]: unknown;
}
