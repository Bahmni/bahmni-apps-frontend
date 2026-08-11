import { UserLocation, UserPrivilege } from '@bahmni/services';
import {
  CommonSearchWidgetConfig,
  CriterionConfig,
  CriterionRow,
  ResultFieldConfig,
} from '../../models';

const mockResultFields: ResultFieldConfig[] = [
  {
    translationKey: 'PATIENT_NAME',
    expression: 'name',
    enableSort: true,
  },
];

export const mockCommonSearchWidgetConfig: CommonSearchWidgetConfig = [
  {
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
    ],
  },
];

export const mockMultiContextConfig: CommonSearchWidgetConfig = [
  {
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
    ],
  },
  {
    context: 'appointment',
    translationKey: 'APPOINTMENT_SEARCH',
    requiredPrivileges: ['View Appointments'],
    locationAware: 'allowedLocation',
    url: '/openmrs/ws/rest/v1/appointment/search',
    pageSize: 10,
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
    ],
  },
];

export const mockCommonSearchWidgetConfigWithoutLocationAware: CommonSearchWidgetConfig =
  [
    {
      context: 'patient',
      translationKey: 'PATIENT_SEARCH',
      requiredPrivileges: ['View Patients'],
      url: '/openmrs/ws/rest/v1/patientSearch',
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
      ],
    },
  ];

export const mockGenderCriterionConfig: CriterionConfig = {
  id: 'patient.gender',
  field: { key: 'patient.gender' },
  translationKey: 'PATIENT_GENDER',
  requiresAdditionalCriterion: true,
  input: {
    kind: 'options',
    placeholderTranslationKey: 'PATIENT_GENDER_PLACEHOLDER',
    options: [{ translationKey: 'MALE', value: 'M' }],
  },
};

export const mockRowGenderWithValue: CriterionRow = {
  rowId: 'row-gender',
  criterionKey: 'patient.gender',
  value: { value: 'M' },
  validationError: null,
  rangeOrderError: null,
};

export const mockCommonSearchWidgetConfigWithRequiresAdditional: CommonSearchWidgetConfig =
  [
    {
      context: 'patient',
      translationKey: 'PATIENT_SEARCH',
      requiredPrivileges: ['View Patients'],
      locationAware: 'loggedInLocation',
      url: '/openmrs/ws/rest/v1/patient/search',
      pageSize: 20,
      resultFields: mockResultFields,
      criteria: [mockGenderCriterionConfig],
    },
  ];

export const mockPrivilegeViewPatients: UserPrivilege[] = [
  { uuid: 'priv-uuid-1', name: 'View Patients' },
];

export const mockPrivilegeViewAppointments: UserPrivilege[] = [
  { uuid: 'priv-uuid-2', name: 'View Appointments' },
];

export const mockWidgetLocation: UserLocation = {
  uuid: 'loc-uuid-1',
  name: 'Ward A',
  display: 'Ward A',
};

export const mockTextCriterionConfig: CriterionConfig = {
  id: 'patient.name.given',
  field: { key: 'patient.name.given' },
  translationKey: 'PATIENT_GIVEN_NAME',
  default: true,
  input: {
    kind: 'text',
    placeholderTranslationKey: 'PATIENT_GIVEN_NAME_PLACEHOLDER',
  },
};

export const mockNumericRangeCriterionConfig: CriterionConfig = {
  id: 'patient.age',
  field: { key: 'patient.age' },
  translationKey: 'PATIENT_AGE',
  default: true,
  input: {
    kind: 'numeric',
    placeholderTranslationKey: 'PATIENT_AGE_PLACEHOLDER',
    rangeAllowed: true,
  },
};

export const mockRowWithEmptyValue: CriterionRow = {
  rowId: 'row-1',
  criterionKey: 'patient.name.given',
  value: null,
  validationError: null,
  rangeOrderError: null,
};

export const mockRowWithValidValue: CriterionRow = {
  rowId: 'row-1',
  criterionKey: 'patient.name.given',
  value: { value: 'Rahul' },
  validationError: null,
  rangeOrderError: null,
};

export const mockCommonSearchWidgetConfigWithRange: CommonSearchWidgetConfig = [
  {
    context: 'patient',
    translationKey: 'PATIENT_SEARCH',
    requiredPrivileges: ['View Patients'],
    locationAware: 'loggedInLocation',
    url: '/openmrs/ws/rest/v1/patient/search',
    pageSize: 20,
    resultFields: mockResultFields,
    criteria: [mockNumericRangeCriterionConfig],
  },
];

export const mockRowWithRangeOrderError: CriterionRow = {
  rowId: 'row-1',
  criterionKey: 'patient.age',
  value: {
    from: { value: '50', comparator: null },
    to: { value: '20', comparator: null },
  },
  validationError: null,
  rangeOrderError: null,
};
