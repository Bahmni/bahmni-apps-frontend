export const PATIENT_FIELD_KEYS = [
  'name',
  'identifier',
  'age',
  'gender',
  'birthDate',
  'addressFieldValue',
  'extraIdentifiers',
  'customAttribute',
  'activeVisitUuid',
] as const;

export type PatientFieldKey = (typeof PATIENT_FIELD_KEYS)[number];
