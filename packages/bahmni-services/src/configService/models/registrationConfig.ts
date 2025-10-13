export interface PatientSearchField {
  translationKey: string;
  fields: string[];
  columnTranslationKeys: string[];
  type: 'person' | 'address' | 'program';
}

export interface PatientSearchConfig {
  customAttributes: PatientSearchField[];
}

export interface RegistrationConfig {
  patientSearch: PatientSearchConfig;
}
