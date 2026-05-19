import { clearRegistry, getRegisteredInputControls } from '../../registry';
import MedicationRequestForm from '../MedicationRequestForm';
import { getMedicationRequestStore } from '../store';
import { createMedicationRequestEntries } from '../utils';

import '../index';

jest.mock('../store', () => ({
  getMedicationRequestStore: jest.fn(),
  useMedicationRequestStore: jest.fn(),
}));

jest.mock('../utils', () => ({
  createMedicationRequestEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../MedicationRequestForm', () => 'MedicationRequestForm');

afterAll(() => clearRegistry());

const mockGetStore = getMedicationRequestStore as jest.Mock;
const mockCreateEntries = createMedicationRequestEntries as jest.Mock;

const makeStoreMock = (overrides = {}) => {
  const mockStore = {
    getState: jest.fn(),
    subscribe: jest.fn(),
  };
  mockStore.getState.mockReturnValue({
    reset: jest.fn(),
    validateAll: jest.fn().mockReturnValue(true),
    selectedMedicationRequests: [],
    ...overrides,
  });
  return mockStore;
};

describe('medicationRequest index registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStore.mockImplementation(() => makeStoreMock());
  });

  it.each(['medications', 'vaccinations'] as const)(
    'registers key "%s" pointing to MedicationRequestForm',
    (key) => {
      const entry = getRegisteredInputControls().find((e) => e.key === key);
      expect(entry).toBeDefined();
      expect(entry?.component).toBe(MedicationRequestForm);
    },
  );

  it.each(['medications', 'vaccinations'] as const)(
    'delegates reset and validateAll to store for key "%s"',
    (key) => {
      const mockReset = jest.fn();
      const mockValidateAll = jest.fn().mockReturnValue(true);
      mockGetStore.mockImplementation(() =>
        makeStoreMock({ reset: mockReset, validateAll: mockValidateAll }),
      );

      const entry = getRegisteredInputControls().find((e) => e.key === key);
      entry?.reset();
      expect(mockReset).toHaveBeenCalledTimes(1);
      entry?.validate();
      expect(mockValidateAll).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { key: 'medications' as const, count: 0, expected: false },
    { key: 'medications' as const, count: 1, expected: true },
    { key: 'vaccinations' as const, count: 0, expected: false },
    { key: 'vaccinations' as const, count: 1, expected: true },
  ])(
    'hasData() returns $expected when selectedMedicationRequests has $count items for "$key"',
    ({ key, count, expected }) => {
      mockGetStore.mockImplementation(() =>
        makeStoreMock({
          selectedMedicationRequests: new Array(count).fill({}),
        }),
      );
      const entry = getRegisteredInputControls().find((e) => e.key === key);
      expect(entry?.hasData()).toBe(expected);
    },
  );

  it.each(['medications', 'vaccinations'] as const)(
    'subscribe() delegates to store for key "%s"',
    (key) => {
      const mockSubscribe = jest.fn();
      const storeMock = { getState: jest.fn(), subscribe: mockSubscribe };
      storeMock.getState.mockReturnValue({ selectedMedicationRequests: [] });
      mockGetStore.mockImplementation(() => storeMock);

      const cb = jest.fn();
      const entry = getRegisteredInputControls().find((e) => e.key === key);
      entry?.subscribe?.(cb);
      expect(mockSubscribe).toHaveBeenCalledWith(cb);
    },
  );

  it.each(['medications', 'vaccinations'] as const)(
    'createBundleEntries() calls service with correct args for key "%s"',
    (key) => {
      const selectedMedicationRequests = [{ id: `${key}-1` }];
      mockGetStore.mockImplementation(() =>
        makeStoreMock({ selectedMedicationRequests }),
      );

      const ctx = {
        encounterSubject: { reference: 'Patient/1' },
        encounterReference: 'enc-1',
        practitionerUUID: 'prac-1',
        consultationDate: new Date(),
        statDurationInMilliseconds: 1000,
      };

      const entry = getRegisteredInputControls().find((e) => e.key === key);
      entry?.createBundleEntries?.(ctx);

      expect(mockCreateEntries).toHaveBeenCalledWith({
        selectedMedicationRequests: selectedMedicationRequests,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        statDurationInMilliseconds: ctx.statDurationInMilliseconds,
      });
    },
  );
});
