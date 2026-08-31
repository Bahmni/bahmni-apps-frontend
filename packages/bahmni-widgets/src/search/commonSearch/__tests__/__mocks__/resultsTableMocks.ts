import { ActionConfig, ResultFieldConfig, SortOrder } from '../../models';

export const mockResultFields: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
  },
  {
    translationKey: 'PATIENT_AGE',
    expression: 'age',
  },
];

export const mockResultFieldsWithFilter: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    filterType: 'text',
  },
  {
    translationKey: 'PATIENT_AGE',
    expression: 'age',
  },
];

export const mockInvalidExpressionFields: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: '$$$invalid',
  },
];

export const mockResults = [
  { id: '1', name: 'John Doe', age: 30 },
  { id: '2', name: 'Jane Smith', age: 25 },
];

export const mockResultWithoutId = {
  name: 'No ID User',
  age: 40,
};

export const mockActions: ActionConfig[] = [
  {
    key: 'viewPatient',
    type: 'navigate',
    requiredPrivileges: ['View Patients'],
    navigationURL: '/patient/{name}',
  },
  {
    key: 'editPatient',
    type: 'navigate',
    requiredPrivileges: ['Edit Patients'],
    navigationURL: '/patient/{name}/edit',
  },
];

export const mockActionsWithInvalidExpression: ActionConfig[] = [
  {
    key: 'viewPatient',
    type: 'navigate',
    requiredPrivileges: [],
    navigationURL: '/patient/{$$$invalid}',
  },
];

export const mockResultFieldsWithAction: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    action: 'viewPatient',
  },
  {
    translationKey: 'PATIENT_AGE',
    expression: 'age',
  },
];

export const mockResultFieldsWithMultipleActions: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    action: 'viewPatient',
  },
  {
    translationKey: 'PATIENT_ID',
    expression: 'id',
    action: 'editPatient',
  },
];

export const mockResultFieldsWithTransform: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_COUNTRY',
    expression: 'country',
    transform: 'formatCountry',
  },
];

export const mockResultFieldsWithUnknownTransform: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_COUNTRY',
    expression: 'country',
    transform: 'nonExistentTransform',
  },
];

export const mockResultFieldsWithTimeTransform: ResultFieldConfig[] = [
  {
    translationKey: 'APPOINTMENT_TIME',
    expression: 'startDateTime',
    transform: 'formatTime',
  },
];

export const mockResultFieldsWithDateTimeTransform: ResultFieldConfig[] = [
  {
    translationKey: 'APPOINTMENT_DATE_TIME',
    expression: 'startDateTime',
    transform: 'formatDateTime',
  },
];

export const mockResultFieldsWithAgeTransform: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_AGE',
    expression: 'birthDate',
    transform: 'formatAge',
    enableSort: true,
    sortOrder: SortOrder.Ascending,
  },
];

export const mockResultFieldsWithDateTransform: ResultFieldConfig[] = [
  {
    translationKey: 'REGISTRATION_DATE',
    expression: 'registrationDate',
    transform: 'formatDate',
    enableSort: true,
    sortOrder: SortOrder.Ascending,
  },
];

export const mockDateTimeValue = '2024-03-28T14:30:00';

export const mockResultFieldsWithSortOrder: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    enableSort: true,
    sortOrder: SortOrder.Ascending,
  },
  { translationKey: 'PATIENT_AGE', expression: 'age' },
];
