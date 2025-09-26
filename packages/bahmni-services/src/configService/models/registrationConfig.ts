export interface PatientSearchField {
  label: string;
  fields: string[];
  type: 'person' | 'address' | 'program';
}

export interface PatientSearchConfig {
  customAttributes: PatientSearchField[];
}

export interface RegistrationAppConfig {
  patientSearch: PatientSearchConfig;
}

export interface RegistrationConfig {
  config: RegistrationAppConfig;
}
