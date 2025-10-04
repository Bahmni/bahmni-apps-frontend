export interface Age {
  years: number;
  months: number;
  days: number;
}

export interface FormattedPatientData {
  id: string;
  fullName: string | null;
  gender: string | null;
  birthDate: string | null;
  formattedAddress: string | null;
  formattedContact: string | null;
  identifiers: Map<string, string>;
  age: Age | null;
}

export interface PatientSearchResult {
  uuid: string;
  birthDate: Date;
  extraIdentifiers: string | null;
  personId: number;
  deathDate: Date | null;
  identifier: string;
  addressFieldValue: string | null;
  givenName: string;
  middleName: string;
  familyName: string;
  gender: string;
  dateCreated: Date;
  activeVisitUuid: string;
  customAttribute: string;
  hasBeenAdmitted: boolean;
  age: string;
}

export interface PatientSearchResultBundle {
  totalCount: number;
  pageOfResults: PatientSearchResult[];
}

export interface IdentifierSource {
  uuid: string;
  name: string;
  prefix: string;
}

export interface IdentifierType {
  uuid: string;
  name: string;
  description: string;
  format: string | null;
  required: boolean;
  primary: boolean;
  identifierSources: IdentifierSource[];
}

export type IdentifierTypesResponse = IdentifierType[];

export interface AppSetting {
  property: string;
  value: string;
}
export type AppSettingsResponse = AppSetting[];
