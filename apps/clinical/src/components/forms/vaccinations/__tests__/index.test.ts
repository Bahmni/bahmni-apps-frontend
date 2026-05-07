import { createMedicationRequestEntries } from '../../../../services/consultationBundleService';
import { useVaccinationStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import VaccinationForm from '../VaccinationForm';

import '../index';

jest.mock('../../../../stores', () => ({
  useVaccinationStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createMedicationRequestEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../VaccinationForm', () => 'VaccinationForm');

afterAll(() => clearRegistry());

const mockGetState = useVaccinationStore.getState as jest.Mock;
const mockSubscribe = useVaccinationStore.subscribe as jest.Mock;
const mockCreateEntries = createMedicationRequestEntries as jest.Mock;

describe('vaccinations index registration', () => {
  let mockReset: jest.Mock;
  let mockValidateAll: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidateAll = jest.fn().mockReturnValue(true);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validateAllVaccinations: mockValidateAll,
      selectedVaccinations: [],
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'vaccinations')!;

  it('registers with key "vaccinations" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(VaccinationForm);
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
    'hasData() returns $expected when selectedVaccinations has $count items',
    ({ count, expected }) => {
      mockGetState.mockReturnValue({
        selectedVaccinations: Array(count).fill({}),
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
    const selectedVaccinations = [{ id: 'vac-1' }];
    mockGetState.mockReturnValue({ selectedVaccinations });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
      statDurationInMilliseconds: 500,
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedMedications: selectedVaccinations,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
      statDurationInMilliseconds: ctx.statDurationInMilliseconds,
    });
  });
});
