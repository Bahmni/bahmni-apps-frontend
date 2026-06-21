import { type CDSSRule } from '@bahmni/services';
import type { PrintOption } from '@bahmni/widgets';

export interface AllergyConceptMap {
  medicationAllergenUuid: string;
  foodAllergenUuid: string;
  environmentalAllergenUuid: string;
  allergyReactionUuid: string;
}

export interface InputControlAttributes {
  name: string;
  required?: boolean;
  default?: string | number | boolean;
  readOnly?: boolean;
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
  cdss?: CDSSRule[];
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
  printOptions?: PrintOption[];
}

export interface ProgramConfig {
  fields: string[];
  translateValues?: string[];
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
