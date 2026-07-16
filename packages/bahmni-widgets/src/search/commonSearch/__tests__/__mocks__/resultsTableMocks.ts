import { ResultFieldConfig } from '../../models';

export const mockResultFields: ResultFieldConfig[] = [
  {
    key: 'name',
    translationKey: 'PATIENT_NAME',
    expression: 'name',
  },
  {
    key: 'age',
    translationKey: 'PATIENT_AGE',
    expression: 'age',
  },
];

export const mockInvalidExpressionFields: ResultFieldConfig[] = [
  {
    key: 'name',
    translationKey: 'PATIENT_NAME',
    expression: '$$$invalid',
  },
];

export const mockResults = [
  { id: '1', name: 'John Doe', age: 30 },
  { id: '2', name: 'Jane Smith', age: 25 },
];

export const mockResultWithoutId = { name: 'No ID User', age: 40 };
