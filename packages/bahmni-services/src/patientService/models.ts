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
  id: string;
  patientId: string | null;
  fullName: string | null;
  gender: string | null;
  age: string | null;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
  registrationDate: string | null;
}

export interface PatientSearchApiResult {
  uuid: string;
  identifier: string;
  givenName: string;
  middleName?: string;
  familyName: string;
  gender: string;
  age: string;
  dateCreated: number;
  customAttribute: string | null;
}

export interface PatientSearchResponse {
  totalCount: number;
  pageOfResults: PatientSearchResult[];
}
