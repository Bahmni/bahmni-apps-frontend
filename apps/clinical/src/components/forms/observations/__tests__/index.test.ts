import { createObservationBundleEntries } from '../../../../services/consultationBundleService';
import { useObservationFormsStore } from '../../../../stores/observationFormsStore';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import ObservationFormsPanel from '../ObservationFormsPanel';

import '../index';

jest.mock('../../../../stores/observationFormsStore', () => ({
  useObservationFormsStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createObservationBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../ObservationFormsPanel', () => 'ObservationFormsPanel');

afterAll(() => clearRegistry());

const mockGetState = useObservationFormsStore.getState as jest.Mock;
const mockSubscribe = useObservationFormsStore.subscribe as jest.Mock;
const mockCreateEntries = createObservationBundleEntries as jest.Mock;

describe('observations index registration', () => {
  let mockReset: jest.Mock;
  let mockValidate: jest.Mock;
  let mockGetObservationFormsData: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    mockValidate = jest.fn().mockReturnValue(true);
    mockGetObservationFormsData = jest.fn().mockReturnValue([]);
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      validate: mockValidate,
      selectedForms: [],
      getObservationFormsData: mockGetObservationFormsData,
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'observationForms')!;

  it('registers with key "observationForms" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(ObservationFormsPanel);
  });

  it('delegates reset and validate to store', () => {
    getEntry().reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
    getEntry().validate();
    expect(mockValidate).toHaveBeenCalledTimes(1);
  });

  it.each([
    { count: 0, expected: false },
    { count: 1, expected: true },
  ])(
    'hasData() returns $expected when selectedForms has $count items',
    ({ count, expected }) => {
      mockGetState.mockReturnValue({
        selectedForms: Array(count).fill({}),
        getObservationFormsData: mockGetObservationFormsData,
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
    const formsData = [{ formName: 'form-1' }];
    mockGetObservationFormsData = jest.fn().mockReturnValue(formsData);
    mockGetState.mockReturnValue({
      getObservationFormsData: mockGetObservationFormsData,
    });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      observationFormsData: formsData,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  });
});
