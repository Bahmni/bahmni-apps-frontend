import type { InputControlRegistry } from '../../models';

export const makeMockEntry = (
  key: InputControlRegistry['key'] = 'allergies',
  overrides: Partial<InputControlRegistry> = {},
): InputControlRegistry => ({
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

export const mockUpdatedResources = {
  conditions: false,
  allergies: false,
  medications: false,
  serviceRequests: {} as Record<string, boolean>,
};
