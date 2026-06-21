export type PatientFieldKey =
  | 'name'
  | 'identifier'
  | 'age'
  | 'gender'
  | 'birthDate'
  | 'addressFieldValue'
  | 'extraIdentifiers'
  | 'customAttribute'
  | 'activeVisitUuid';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  newTab?: boolean;
}

export interface PatientActionContext {
  patientUuid: string;
  patientIdentifier?: string;
}

export interface PatientAction {
  id: string;
  label: string;
  icon?: string;
  getPath: (context: PatientActionContext) => string;
  basePath: string;
}

export interface PatientFieldsConfig {
  primaryFields: PatientFieldKey[];
  additionalFields: PatientFieldKey[];
}

export type AnnotationSearchType = 'patientAttribute' | 'patientNameOrId';

export interface SearchAnnotation {
  prefix: string;
  label: string;
  searchType?: AnnotationSearchType;
  fieldType: 'person' | 'address';
  fieldsToSearch: string[];
}

export type TriggerConfig =
  | { type: 'combination'; keys: string[] }
  | { type: 'double'; keys: string[]; interval?: number };
