export interface PatientSearchResult {
  uuid: string;
  birthDate: number;
  extraIdentifiers: string | null;
  personId: number;
  deathDate: number | null;
  identifier: string;
  addressFieldValue: string | null;
  givenName: string;
  middleName: string | null;
  familyName: string;
  gender: string;
  dateCreated: number;
  activeVisitUuid: string | null;
  customAttribute: string | null;
  patientProgramAttributeValue: string | null;
  hasBeenAdmitted: boolean;
  age: string;
}

export interface PatientSearchResponse {
  totalCount: number;
  pageOfResults: PatientSearchResult[];
}

export interface PatientSearchParams {
  searchTerm: string;
  loginLocationUuid: string;
}

export interface FormattedPatientSearchResult {
  id: string;
  patientId: string;
  fullName: string;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
  gender: string;
  age: string;
  registrationDate: string;
  uuid: string;
}
