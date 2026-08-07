import { UserLocation } from '@bahmni/services';
import {
  CriterionRow,
  ResultFieldConfig,
  SearchContextConfig,
} from '../../models';

export const mockResultFields: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    enableSort: true,
  },
];

export const mockLocation: UserLocation = {
  uuid: 'loc-uuid-1',
  name: 'Ward A',
  display: 'Ward A',
};

export const mockLocationNoDisplay: UserLocation = {
  uuid: 'loc-uuid-2',
  name: 'Ward B',
};

export const mockPatientContext: SearchContextConfig = {
  context: 'patient',
  translationKey: 'PATIENT_SEARCH',
  requiredPrivileges: ['View Patients'],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/patient/search',
  pageSize: 20,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'patient.name.given',
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    },
    {
      id: 'patient.gender',
      field: { key: 'patient.gender' },
      translationKey: 'PATIENT_GENDER',
      input: {
        kind: 'options',
        placeholderTranslationKey: 'PATIENT_GENDER_PLACEHOLDER',
        options: [
          { translationKey: 'MALE', value: 'M' },
          { translationKey: 'FEMALE', value: 'F' },
        ],
      },
    },
    {
      id: 'patient.age',
      field: { key: 'patient.age' },
      translationKey: 'PATIENT_AGE',
      input: {
        kind: 'numeric',
        placeholderTranslationKey: 'PATIENT_AGE_PLACEHOLDER',
      },
    },
  ],
};

export const mockAppointmentContext: SearchContextConfig = {
  context: 'appointment',
  translationKey: 'APPOINTMENT_SEARCH',
  requiredPrivileges: ['View Appointments'],
  locationAware: 'allowedLocation',
  url: '/openmrs/ws/rest/v1/appointment/search',
  pageSize: 10,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'appointment.number',
      field: { key: 'appointment.number' },
      translationKey: 'APPOINTMENT_NUMBER',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'APPOINTMENT_NUMBER_PLACEHOLDER',
      },
    },
    {
      id: 'appointment.service',
      field: { key: 'appointment.service' },
      translationKey: 'APPOINTMENT_SERVICE',
      input: {
        kind: 'lookup',
        placeholderTranslationKey: 'APPOINTMENT_SERVICE_PLACEHOLDER',
        lookup: { source: 'appointmentService', prefetch: false },
      },
    },
  ],
};

export const mockContextNoDefaults: SearchContextConfig = {
  context: 'patientProgram',
  translationKey: 'PATIENT_PROGRAM_SEARCH',
  requiredPrivileges: [],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/program/search',
  pageSize: 10,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'patientProgram.identifier',
      field: { key: 'patientProgram.identifier' },
      translationKey: 'PATIENT_PROGRAM_IDENTIFIER',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_PROGRAM_IDENTIFIER_PLACEHOLDER',
      },
    },
    {
      id: 'patientProgram.status',
      field: { key: 'patientProgram.status' },
      translationKey: 'PATIENT_PROGRAM_STATUS',
      input: {
        kind: 'options',
        placeholderTranslationKey: 'PATIENT_PROGRAM_STATUS_PLACEHOLDER',
        options: [{ translationKey: 'ACTIVE', value: 'active' }],
      },
    },
  ],
};

export const mockPatientContextWithRangeNumeric: SearchContextConfig = {
  context: 'patient',
  translationKey: 'PATIENT_SEARCH',
  requiredPrivileges: ['View Patients'],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/patient/search',
  pageSize: 20,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'patient.age',
      field: { key: 'patient.age' },
      translationKey: 'PATIENT_AGE',
      default: true,
      input: {
        kind: 'numeric',
        placeholderTranslationKey: 'PATIENT_AGE_PLACEHOLDER',
        rangeAllowed: true,
      },
    },
  ],
};

export const mockContextMultipleDefaults: SearchContextConfig = {
  context: 'patient',
  translationKey: 'PATIENT_SEARCH',
  requiredPrivileges: ['View Patients'],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/patient/search',
  pageSize: 20,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'patient.name.given',
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    },
    {
      id: 'patient.gender',
      field: { key: 'patient.gender' },
      translationKey: 'PATIENT_GENDER',
      default: true,
      input: {
        kind: 'options',
        placeholderTranslationKey: 'PATIENT_GENDER_PLACEHOLDER',
        options: [
          { translationKey: 'MALE', value: 'M' },
          { translationKey: 'FEMALE', value: 'F' },
        ],
      },
    },
  ],
};

export const mockPatientContextWithRegex: SearchContextConfig = {
  context: 'patient',
  translationKey: 'PATIENT_SEARCH',
  requiredPrivileges: ['View Patients'],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/patient/search',
  pageSize: 20,
  resultFields: mockResultFields,
  criteria: [
    {
      id: 'patient.name.given',
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
        regex: '^[A-Za-z]+$',
      },
    },
  ],
};

export const mockConfig = [mockPatientContext, mockAppointmentContext];

export const mockSavedRows: CriterionRow[] = [
  {
    rowId: 'saved-row-1',
    criterionKey: 'patient.name.given',
    value: { value: 'Rahul' },
    validationError: null,
    rangeOrderError: null,
  },
  {
    rowId: 'saved-row-2',
    criterionKey: 'patient.gender',
    value: null,
    validationError: null,
    rangeOrderError: null,
  },
];
