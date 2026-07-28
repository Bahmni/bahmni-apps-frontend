import {
  CurrentSearchState,
  CriterionRow,
  SearchContextConfig,
} from '../../models';

const mockResultFields = [
  { key: 'id', translationKey: 'ID', expression: 'id' },
];

export const mockAppointmentContext: SearchContextConfig = {
  context: 'appointment',
  translationKey: 'APPOINTMENT_SEARCH',
  requiredPrivileges: ['View Appointments'],
  locationAware: 'loggedInLocation',
  url: '/api/appointment/search',
  pageSize: 20,
  resultFields: mockResultFields,
  criteria: [
    {
      field: { key: 'appointmentNumber' },
      translationKey: 'APPOINTMENT_NUMBER',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'APPOINTMENT_NUMBER_PLACEHOLDER',
      },
    },
    {
      field: { key: 'service' },
      translationKey: 'APPOINTMENT_SERVICE',
      input: {
        kind: 'options',
        placeholderTranslationKey: 'SERVICE_PLACEHOLDER',
        options: [],
      },
    },
    {
      field: { key: 'patientId' },
      translationKey: 'PATIENT_ID',
      input: {
        kind: 'lookup',
        placeholderTranslationKey: 'PATIENT_ID_PLACEHOLDER',
        lookup: { source: '/api/patients' },
      },
    },
    {
      field: { key: 'age' },
      translationKey: 'PATIENT_AGE',
      input: {
        kind: 'numeric',
        placeholderTranslationKey: 'AGE_PLACEHOLDER',
        rangeAllowed: true,
      },
    },
    {
      field: { key: 'appointmentDate' },
      translationKey: 'APPOINTMENT_DATE',
      input: {
        kind: 'date',
        placeholderTranslationKey: 'DATE_PLACEHOLDER',
        rangeAllowed: false,
      },
    },
    {
      field: { key: 'dateRange' },
      translationKey: 'DATE_RANGE',
      input: {
        kind: 'date',
        placeholderTranslationKey: 'DATE_RANGE_PLACEHOLDER',
        rangeAllowed: true,
      },
    },
    {
      field: { key: 'ageScalar' },
      translationKey: 'AGE_SCALAR',
      input: {
        kind: 'numeric',
        placeholderTranslationKey: 'AGE_SCALAR_PLACEHOLDER',
      },
    },
    {
      field: { key: 'gender' },
      translationKey: 'PATIENT_GENDER',
      input: {
        kind: 'options',
        placeholderTranslationKey: 'GENDER_PLACEHOLDER',
        options: [
          { translationKey: 'GENDER_MALE', value: 'MALE' },
          { translationKey: 'GENDER_FEMALE', value: 'FEMALE' },
        ],
      },
    },
  ],
};

export const mockTextRow: CriterionRow = {
  rowId: 'row-text',
  criterionKey: 'appointmentNumber',
  value: { value: 'AP000H7' },
  validationError: null,
  rangeOrderError: null,
};

export const mockOptionsRow: CriterionRow = {
  rowId: 'row-options',
  criterionKey: 'service',
  value: { value: 'US Health' },
  validationError: null,
  rangeOrderError: null,
};

export const mockLookupRow: CriterionRow = {
  rowId: 'row-lookup',
  criterionKey: 'patientId',
  value: { value: 'P001' },
  validationError: null,
  rangeOrderError: null,
};

export const mockNumericScalarRow: CriterionRow = {
  rowId: 'row-age-scalar',
  criterionKey: 'ageScalar',
  value: { value: '42' },
  validationError: null,
  rangeOrderError: null,
};

export const mockNumericRangeRow: CriterionRow = {
  rowId: 'row-age-range',
  criterionKey: 'age',
  value: {
    from: { value: '20', comparator: null },
    to: { value: '40', comparator: null },
  },
  validationError: null,
  rangeOrderError: null,
};

export const mockNumericFromOnlyRow: CriterionRow = {
  rowId: 'row-age-from-only',
  criterionKey: 'age',
  value: { from: { value: '20', comparator: null } },
  validationError: null,
  rangeOrderError: null,
};

export const mockDateScalarRow: CriterionRow = {
  rowId: 'row-date-scalar',
  criterionKey: 'appointmentDate',
  value: { from: { value: '2025-10-24T00:00:00.000Z', comparator: null } },
  validationError: null,
  rangeOrderError: null,
};

export const mockDateRangeRow: CriterionRow = {
  rowId: 'row-date-range',
  criterionKey: 'dateRange',
  value: {
    from: { value: '2025-10-24T00:00:00.000Z', comparator: null },
    to: { value: '2026-06-03T00:00:00.000Z', comparator: null },
  },
  validationError: null,
  rangeOrderError: null,
};

export const mockOptionsWithTranslationRow: CriterionRow = {
  rowId: 'row-options-translation',
  criterionKey: 'gender',
  value: { value: 'MALE' },
  validationError: null,
  rangeOrderError: null,
};

export const mockActiveSearchState: CurrentSearchState = {
  context: mockAppointmentContext,
  rows: [mockTextRow],
  resultFields: mockResultFields,
  results: [],
};
