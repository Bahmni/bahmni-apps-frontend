import type { InputControl } from '../../../forms';

export const mockRegistry: InputControl[] = [
  {
    key: 'allergies',
    component: () => null,
    reset: jest.fn(),
    validate: jest.fn(),
    hasData: jest.fn(),
    subscribe: jest.fn(),
  },
  {
    key: 'medications',
    component: () => null,
    reset: jest.fn(),
    validate: jest.fn(),
    hasData: jest.fn(),
    subscribe: jest.fn(),
  },
  {
    key: 'observationForms',
    component: () => null,
    reset: jest.fn(),
    validate: jest.fn(),
    hasData: jest.fn(),
    subscribe: jest.fn(),
  },
];

export const makeMockEntry = (
  key: InputControl['key'] = 'allergies',
  overrides: Partial<InputControl> = {},
): InputControl => ({
  key,
  component: () => null,
  reset: jest.fn(),
  validate: jest.fn().mockReturnValue(true),
  hasData: jest.fn().mockReturnValue(false),
  subscribe: jest.fn().mockReturnValue(jest.fn()),
  ...overrides,
});

export const mockObsFormsState = {
  viewingForm: null,
  setViewingForm: jest.fn(),
  updateFormData: jest.fn(),
  getFormData: jest.fn().mockReturnValue(undefined),
  removeForm: jest.fn(),
};

export const mockSubmitResult = {
  patientUUID: 'patient-uuid',
  encounterTypeName: 'Consultation',
  updatedConcepts: new Map<string, string>(),
};

export const mockEncounterConcepts = {
  encounterTypes: [
    { name: 'Consultation', uuid: 'd34fe3ab-5e07-11ef-8f7c-0242ac120002' },
    { name: 'OPD', uuid: 'd37e03e0-0000-11ef-8f7c-0242ac120002' },
  ],
  visitTypes: [],
  orderTypes: [],
  conceptData: [],
};

export const mockUpdatedResources = {
  conditions: false,
  allergies: false,
  medications: false,
  immunizationHistory: false,
  serviceRequests: {} as Record<string, boolean>,
};
