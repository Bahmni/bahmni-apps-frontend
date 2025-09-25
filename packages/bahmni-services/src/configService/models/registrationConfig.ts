export interface PatientSearchField {
  label: string;
  placeholder?: string;
  fields: string[];
  type?: 'person' | 'address' | 'program';
  default?: boolean;
}

export interface PatientSearchConfig {
  customAttributes: PatientSearchField[];
}

export interface RegistrationConfig {
  patientSearch?: PatientSearchConfig;
}
