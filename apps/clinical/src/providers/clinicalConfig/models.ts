export interface AllergyConceptMap {
  medicationAllergenUuid: string;
  foodAllergenUuid: string;
  environmentalAllergenUuid: string;
  allergyReactionUuid: string;
}

export interface InputControlAttributes {
  name: string;
  required: boolean;
}

export interface InputControl<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  type: string;
  label?: string;
  metadata: T;
  encounterTypes: string[];
  privileges: string[];
  attributes: InputControlAttributes[];
}

export interface ConsultationPad {
  allergyConceptMap: AllergyConceptMap;
  statDurationInMilliseconds?: number;
  inputControls: InputControl[];
}

export interface Dashboard {
  name: string;
  url: string;
  requiredPrivileges: string[];
  icon?: string;
  default?: boolean;
}

export interface ProgramConfig {
  fields: string[];
}

export interface ContextInformation {
  program?: ProgramConfig;
}

export interface PatientSearchDisplayField {
  field: 'name' | 'identifier' | 'gender' | 'age';
  bold?: boolean;
}

export interface PatientSearchConfig {
  displayFields?: PatientSearchDisplayField[];
}

export interface ClinicalConfig {
  patientInformation: Record<string, unknown>;
  contextInformation?: ContextInformation;
  patientSearch?: PatientSearchConfig;
  actions: Array<unknown>;
  dashboards: Array<Dashboard>;
  consultationPad: ConsultationPad;
}

export interface ClinicalConfigContextType {
  clinicalConfig: ClinicalConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
