export const FHIR_ENCOUNTER_TYPE_CODE_SYSTEM =
  'http://fhir.openmrs.org/code-system/encounter-type';
export const HL7_CONDITION_CATEGORY_CONDITION_CODE = 'problem-list-item';
export const HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-ver-status';
export const HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE = 'encounter-diagnosis';
export const HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-clinical';
export const HL7_CONDITION_CATEGORY_CODE_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/condition-category';
export const FHIR_CONCEPT_CLASS_EXTENSION_URL =
  'http://fhir.bahmni.org/ext/ValueSet/concept-class';
export const FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL =
  'http://fhir.bahmni.org/ext/lab-order-concept-type';
export const FHIR_MEDICATION_EXTENSION_URL =
  'http://fhir.openmrs.org/ext/medicine';
export const FHIR_MEDICATION_NAME_EXTENSION_URL =
  'http://fhir.openmrs.org/ext/medicine#drugName';
export const FHIR_OBSERVATION_INTERPRETATION_SYSTEM =
  'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation';
export const FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL =
  'http://fhir.bahmni.org/ext/observation/form-namespace-path';
export const FHIR_OBSERVATION_COMPLEX_DATA_URL =
  'http://fhir.bahmni.org/ext/observation/complex-data';
export const CONCEPT_DATATYPE_NUMERIC = 'Numeric';
export const CONCEPT_DATATYPE_COMPLEX = 'Complex';

export const FHIR_OBSERVATION_STATUS_FINAL = 'final';
export const FHIR_RESOURCE_TYPE_OBSERVATION = 'Observation';

export const DATE_REGEX_PATTERN = /^\d{4}-\d{2}-\d{2}/;
export const DATETIME_REGEX_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export const INTERPRETATION_TO_CODE: Record<
  string,
  { code: string; display: string }
> = {
  ABNORMAL: { code: 'A', display: 'Abnormal' },
  NORMAL: { code: 'N', display: 'Normal' },
};
