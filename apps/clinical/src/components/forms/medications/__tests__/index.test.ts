import { createMedicationRequestEntries } from '../../../../services/consultationBundleService';
import { useMedicationStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import MedicationsForm from '../MedicationsForm';

import '../index';

jest.mock('../../../../stores', () => ({
  useMedicationStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createMedicationRequestEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../MedicationsForm', () => 'MedicationsForm');

afterAll(() => clearRegistry());

const mockGetState = useMedicationStore.getState as jest.Mock;
const mockSubscribe = useMedicationStore.subscribe as jest.Mock;
const mockCreateEntries = createMedicationRequestEntries as jest.Mock;

describe('medications index registration', () => {
  let mockReset: jest.Mock;
  let mockValidateAll: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidateAll = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validateAllMedications: mockValidateAll,
      selectedMedications: [],
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'medications')!;

  it('registers with key "medications" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(MedicationsForm);
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
    'hasData() returns $expected when selectedMedications has $count items',
    ({ count, expected }) => {
      mockGetState.mockReturnValue({
        selectedMedications: Array(count).fill({}),
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
    const selectedMedications = [{ id: 'med-1' }];
    mockGetState.mockReturnValue({ selectedMedications });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
      statDurationInMilliseconds: 1000,
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedMedications,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      statDurationInMilliseconds: ctx.statDurationInMilliseconds,
    });
  });
});
