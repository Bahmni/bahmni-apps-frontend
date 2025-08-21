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
  extraIdentifiers: string;
  personId: number;
  deathDate: Date;
  identifier: string;
  addressFieldValue: string;
  givenName: string;
  middleName: string;
  familyName: string;
  gender: string;
  dateCreated: Date;
  activeVisitUuid: string;
  customAttribute: {
    phoneNumber: string;
    alternatePhoneNumber: string;
  };
  hasBeenAdmitted: boolean;
  age: string;
}

export interface PatientSearchResultBundle {
  totalCount: number;
  pageOfResults: PatientSearchResult[];
}
