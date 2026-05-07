import { createServiceRequestBundleEntries } from '../../../../services/consultationBundleService';
import { useServiceRequestStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import InvestigationsForm from '../InvestigationsForm';

import '../index';

jest.mock('../../../../stores', () => ({
  useServiceRequestStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../../../../services/consultationBundleService', () => ({
  createServiceRequestBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../InvestigationsForm', () => 'InvestigationsForm');

afterAll(() => clearRegistry());

const mockGetState = useServiceRequestStore.getState as jest.Mock;
const mockSubscribe = useServiceRequestStore.subscribe as jest.Mock;
const mockCreateEntries = createServiceRequestBundleEntries as jest.Mock;

describe('investigations index registration', () => {
  let mockReset: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      selectedServiceRequests: new Map(),
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'investigations')!;

  it('registers with key "investigations" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(InvestigationsForm);
  });

  it('reset() delegates to store', () => {
    getEntry().reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('validate() always returns true', () => {
    expect(getEntry().validate()).toBe(true);
  });

  it.each([
    { size: 0, expected: false },
    { size: 1, expected: true },
  ])(
    'hasData() returns $expected when selectedServiceRequests size is $size',
    ({ size, expected }) => {
      const map = new Map(
        Array.from({ length: size }, (_, i) => [`key-${i}`, {}]),
      );
      mockGetState.mockReturnValue({ selectedServiceRequests: map });
      expect(getEntry().hasData()).toBe(expected);
    },
  );

  it('subscribe() delegates to store', () => {
    const cb = jest.fn();
    getEntry().subscribe(cb);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });

  it('createBundleEntries() calls service with correct args', () => {
    const selectedServiceRequests = new Map([['req-1', { id: 'req-1' }]]);
    mockGetState.mockReturnValue({ selectedServiceRequests });
    const ctx = {
      encounterSubject: { reference: 'Patient/1' },
      encounterReference: 'enc-1',
      practitionerUUID: 'prac-1',
      consultationDate: new Date(),
    };
    getEntry().createBundleEntries!(ctx as any);
    expect(mockCreateEntries).toHaveBeenCalledWith({
      selectedServiceRequests,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  });
});
