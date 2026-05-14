import { clearRegistry, getRegisteredInputControls } from '../../registry';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
} from '../constants';
import ImmunizationForm from '../ImmunizationForm';
import { getImmunizationStore } from '../stores';
import { createImmunizationBundleEntries } from '../utils';

import '../index';

jest.mock('../stores', () => ({
  getImmunizationStore: jest.fn(),
}));

jest.mock('../utils', () => ({
  createImmunizationBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../ImmunizationForm', () => 'ImmunizationForm');

afterAll(() => clearRegistry());

const mockGetImmunizationStore = getImmunizationStore as jest.Mock;
const mockCreateEntries = createImmunizationBundleEntries as jest.Mock;

describe('immunizationHistory index registration', () => {
  let mockReset: jest.Mock;
  let mockValidateAll: jest.Mock;
  let mockSubscribe: jest.Mock;
  let mockGetState: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidateAll = jest.fn().mockReturnValue(true);
    mockSubscribe = jest.fn();
    jest.clearAllMocks();
    mockGetState = jest.fn().mockReturnValue({
      reset: mockReset,
      validateAll: mockValidateAll,
      selectedImmunizations: [],
    });
    mockGetImmunizationStore.mockReturnValue({
      getState: mockGetState,
      subscribe: mockSubscribe,
    });
  });

  const getEntry = (key: string) =>
    getRegisteredInputControls().find((e) => e.key === key)!;

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
  ])('registers %s with correct key and component', (key) => {
    const entry = getEntry(key);
    expect(entry).toBeDefined();
    expect(entry.component).toBe(ImmunizationForm);
  });

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
  ])('delegates reset and validate to correct store for %s', (key) => {
    getEntry(key).reset();
    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockReset).toHaveBeenCalledTimes(1);

    getEntry(key).validate();
    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockValidateAll).toHaveBeenCalledTimes(1);
  });

  it.each([
    { key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY, count: 0, expected: false },
    { key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY, count: 1, expected: true },
    {
      key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
      count: 0,
      expected: false,
    },
    {
      key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
      count: 1,
      expected: true,
    },
  ])(
    'hasData() returns $expected when selectedImmunizations has $count items for $key',
    ({ key, count, expected }) => {
      mockGetState.mockReturnValue({
        selectedImmunizations: new Array(count).fill({}),
      });
      expect(getEntry(key).hasData()).toBe(expected);
    },
  );

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
  ])('subscribe() delegates to correct store for %s', (key) => {
    const cb = jest.fn();
    getEntry(key).subscribe(cb);
    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
  ])('createBundleEntries() calls util with correct args for %s', (key) => {
    const selectedImmunizations = [{ id: 'imm-1' }];
    mockGetState.mockReturnValue({ selectedImmunizations });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    getEntry(key).createBundleEntries!(ctx as any);
    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedImmunizations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  });
});
