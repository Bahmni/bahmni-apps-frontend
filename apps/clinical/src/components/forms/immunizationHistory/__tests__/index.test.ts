import { clearRegistry, getRegisteredInputControls } from '../../registry';
import { IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY } from '../constants';
import ImmunizationHistoryForm from '../ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from '../stores';
import { createImmunizationBundleEntries } from '../utils';

import '../index';

jest.mock('../stores', () => ({
  useImmunizationHistoryStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../utils', () => ({
  createImmunizationBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../ImmunizationHistoryForm', () => 'ImmunizationHistoryForm');

afterAll(() => clearRegistry());

const mockGetState = useImmunizationHistoryStore.getState as jest.Mock;
const mockSubscribe = useImmunizationHistoryStore.subscribe as jest.Mock;
const mockCreateEntries = createImmunizationBundleEntries as jest.Mock;

describe('immunizationHistory index registration', () => {
  let mockReset: jest.Mock;
  let mockValidateAll: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidateAll = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validateAll: mockValidateAll,
      selectedImmunizations: [],
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find(
      (e) => e.key === IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
    )!;

  it('registers with correct key and component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(ImmunizationHistoryForm);
  });

  it('delegates reset and validate to store', () => {
    getEntry().reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
    getEntry().validate();
    expect(mockValidateAll).toHaveBeenCalledTimes(1);
  });

  it.each([
    { count: 0, expected: false },
    { count: 1, expected: true },
  ])(
    'hasData() returns $expected when selectedImmunizations has $count items',
    ({ count, expected }) => {
      mockGetState.mockReturnValue({
        selectedImmunizations: Array(count).fill({}),
      });
      expect(getEntry().hasData()).toBe(expected);
    },
  );

  it('subscribe() delegates to store', () => {
    const cb = jest.fn();
    getEntry().subscribe(cb);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it('createBundleEntries() calls util with correct args', () => {
    const selectedImmunizations = [{ id: 'imm-1' }];
    mockGetState.mockReturnValue({ selectedImmunizations });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedImmunizations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  });
});
