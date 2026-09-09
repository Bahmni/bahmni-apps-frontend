import { clearRegistry, getRegisteredInputControls } from '../../registry';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY,
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
      updateItemCDSCards: jest.fn(),
      hasCriticalCDSCards: jest.fn().mockReturnValue(false),
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
    [IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY],
  ])('registers %s with correct key and component', (key) => {
    const entry = getEntry(key);
    expect(entry).toBeDefined();
    expect(entry.component).toBe(ImmunizationForm);
  });

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
    [IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY],
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
    { key: IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY, count: 0, expected: false },
    { key: IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY, count: 1, expected: true },
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
    [IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY],
  ])('subscribe() delegates to correct store for %s', (key) => {
    const cb = jest.fn();
    getEntry(key).subscribe(cb);
    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it.each([
    {
      key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
      isAdministration: false,
      isWaiver: false,
    },
    {
      key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
      isAdministration: true,
      isWaiver: false,
    },
    {
      key: IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY,
      isAdministration: false,
      isWaiver: true,
    },
  ])(
    'createBundleEntries() calls util with correct args for $key',
    ({ key, isAdministration, isWaiver }) => {
      const selectedImmunizations = [{ id: 'imm-1' }];
      mockGetState.mockReturnValue({ selectedImmunizations });
      const ctx = {
        encounterSubject: { reference: 'Patient/1' },
        encounterReference: 'enc-1',
        practitionerUUID: 'prac-1',
        consultationDate: new Date(),
        isAdministration,
      };
      getEntry(key).createBundleEntries!(ctx as any);
      expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
      expect(mockCreateEntries).toHaveBeenCalledWith({
        selectedImmunizations,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        isAdministration,
        isWaiver,
      });
    },
  );

  it.each([
    [IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY],
    [IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY],
    [IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY],
  ])('updateItemCDSCards() delegates to store for %s', (key) => {
    const mockUpdateItemCDSCards = jest.fn();
    mockGetState.mockReturnValue({
      updateItemCDSCards: mockUpdateItemCDSCards,
    });

    const mockCards = [
      {
        summary: 'Test card',
        indicator: 'warning' as const,
        source: { label: 'Test' },
      },
    ];

    getEntry(key).updateItemCDSCards?.('item-123', mockCards);

    expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
    expect(mockUpdateItemCDSCards).toHaveBeenCalledWith('item-123', mockCards);
  });

  it.each([
    { key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY, hasCritical: false },
    { key: IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY, hasCritical: true },
    { key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY, hasCritical: false },
    { key: IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY, hasCritical: true },
    { key: IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY, hasCritical: false },
    { key: IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY, hasCritical: true },
  ])(
    'hasCriticalCDSCards() returns $hasCritical for $key',
    ({ key, hasCritical }) => {
      const mockHasCriticalCDSCards = jest.fn().mockReturnValue(hasCritical);
      mockGetState.mockReturnValue({
        hasCriticalCDSCards: mockHasCriticalCDSCards,
      });

      const result = getEntry(key).hasCriticalCDSCards?.();

      expect(mockGetImmunizationStore).toHaveBeenCalledWith(key);
      expect(mockHasCriticalCDSCards).toHaveBeenCalledTimes(1);
      expect(result).toBe(hasCritical);
    },
  );
});
