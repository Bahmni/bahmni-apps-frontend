export interface PatientSearchCriteria {
  identifier?: string;
  name?: string;
  phoneNumber?: string;
}

export interface PatientSearchResult {
  uuid: string;
  identifier: string;
  name: string;
  gender: string;
  age: number;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  registrationDate: string;
  givenName?: string;
  familyName?: string;
  birthDate?: string;
  extraIdentifier?: string;
}

export interface PatientSearchResponse {
  results: PatientSearchResult[];
}

export interface OpenMRSPatientSearchParams {
  q?: string;
  identifier?: string;
  name?: string;
  phoneNumber?: string;
  v?: string;
  startIndex?: number;
  limit?: number;
}
