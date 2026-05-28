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
    key: 'medication',
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

export const mockCDSSServerConfig = [
  {
    server: 'test-cdss-server',
    url: 'http://test-cdss.example.com',
    services: [
      {
        name: 'medication-prescribe',
        description: 'Medication prescribing decision support',
        contextResourceMap: [
          { type: 'MedicationRequest', attribute: 'draftOrders' },
          { type: 'Observation', attribute: 'observations' },
        ],
        prefetch: {
          patient: 'Patient/{{context.patientId}}',
        },
      },
    ],
  },
];

export const mockCDSSCards = [
  {
    summary: 'Drug interaction warning',
    indicator: 'warning',
    source: { label: 'Test CDSS' },
    suggestions: [
      {
        label: 'Consider alternative medication',
        actions: [
          {
            type: 'update',
            resource: {
              id: 'med-123',
              resourceType: 'MedicationRequest',
              status: 'active',
            },
          },
        ],
      },
    ],
  },
];

export const mockEmptyCDSSConfig: any[] = [];

export const mockCDSSCheckEvent = {
  controlKey: 'medications',
  itemId: 'item-123',
  event: 'onSelect',
};
