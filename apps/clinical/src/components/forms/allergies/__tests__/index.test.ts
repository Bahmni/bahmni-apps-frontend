import { createAllergiesBundleEntries } from '../../../../services/consultationBundleService';
import { useAllergyStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import AllergiesForm from '../AllergiesForm';

import '../index';

jest.mock('../../../../stores', () => ({
  useAllergyStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createAllergiesBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../AllergiesForm', () => 'AllergiesForm');

afterAll(() => clearRegistry());

const mockGetState = useAllergyStore.getState as jest.Mock;
const mockSubscribe = useAllergyStore.subscribe as jest.Mock;
const mockCreateEntries = createAllergiesBundleEntries as jest.Mock;

describe('allergies index registration', () => {
  let mockReset: jest.Mock;
  let mockValidateAll: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidateAll = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validateAllAllergies: mockValidateAll,
      selectedAllergies: [],
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'allergies')!;

  it('registers with key "allergies" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(AllergiesForm);
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
    'hasData() returns $expected when selectedAllergies has $count items',
    ({ count, expected }) => {
      mockGetState.mockReturnValue({
        selectedAllergies: Array(count).fill({}),
      });
      expect(getEntry().hasData()).toBe(expected);
    },
  );

  it('subscribe() delegates to store', () => {
    const cb = jest.fn();
    getEntry().subscribe(cb);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it('createBundleEntries() calls service with correct args', () => {
    const selectedAllergies = [{ id: 'allergy-1' }];
    mockGetState.mockReturnValue({ selectedAllergies });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedAllergies,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  });
});
