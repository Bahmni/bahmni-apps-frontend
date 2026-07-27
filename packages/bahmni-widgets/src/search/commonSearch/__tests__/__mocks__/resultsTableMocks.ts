import { ResultFieldConfig } from '../../models';

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

export const mockResultWithoutId = { name: 'No ID User', age: 40 };

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

export const mockDateTimeValue = '2024-03-28T14:30:00';
