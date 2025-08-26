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

export interface PatientSearch {
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

export interface PatientSearchBundle {
  totalCount: number;
  pageOfResults: PatientSearch[];
}
