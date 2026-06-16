export interface FormPatientContext {
  uuid: string;
  identifier: string | null;
  name: string | null;        // backward compat: "givenName familyName" — same as old patientMapper
  display: string | null;
  givenName: string | null;
  familyName: string | null;
  age: number | null;
  ageInDays: number | null;
  birthdate: string | null;
  birthtime: string | null;
  gender: string | null;
  activeVisitUuid: string | null;
  currentEncounterUuid: string | null;
}

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
