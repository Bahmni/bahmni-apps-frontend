import { UserLocation } from '@bahmni/services';
import { SearchContextConfig } from '../../models';

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
  criteria: [
    {
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    },
    {
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
  criteria: [
    {
      field: { key: 'appointment.number' },
      translationKey: 'APPOINTMENT_NUMBER',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'APPOINTMENT_NUMBER_PLACEHOLDER',
      },
    },
    {
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
  context: 'episodeOfCare',
  translationKey: 'EPISODE_SEARCH',
  requiredPrivileges: [],
  locationAware: 'loggedInLocation',
  url: '/openmrs/ws/rest/v1/episode/search',
  pageSize: 10,
  criteria: [
    {
      field: { key: 'episode.identifier' },
      translationKey: 'EPISODE_IDENTIFIER',
      input: {
        kind: 'text',
        placeholderTranslationKey: 'EPISODE_IDENTIFIER_PLACEHOLDER',
      },
    },
    {
      field: { key: 'episode.status' },
      translationKey: 'EPISODE_STATUS',
      input: {
        kind: 'options',
        placeholderTranslationKey: 'EPISODE_STATUS_PLACEHOLDER',
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
  criteria: [
    {
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
  criteria: [
    {
      field: { key: 'patient.name.given' },
      translationKey: 'PATIENT_GIVEN_NAME',
      default: true,
      input: {
        kind: 'text',
        placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
      },
    },
    {
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

export const mockConfig = [mockPatientContext, mockAppointmentContext];
