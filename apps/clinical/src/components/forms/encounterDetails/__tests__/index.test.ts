import { useEncounterDetailsStore } from '../../../../stores';
import { clearRegistry, getRegisteredInputControls } from '../../registry';
import EncounterDetails from '../EncounterDetails';

import '../index';

jest.mock('../../../../stores', () => ({
  useEncounterDetailsStore: {
    getState: jest.fn(),
    subscribe: jest.fn(),
  },
}));

jest.mock('../EncounterDetails', () => 'EncounterDetails');

afterAll(() => clearRegistry());

const mockGetState = useEncounterDetailsStore.getState as jest.Mock;
const mockSubscribe = useEncounterDetailsStore.subscribe as jest.Mock;

describe('encounterDetails index registration', () => {
  let mockReset: jest.Mock;

  beforeEach(() => {
    mockReset = jest.fn();
    jest.clearAllMocks();
    mockGetState.mockReturnValue({
      reset: mockReset,
      isEncounterDetailsFormReady: false,
    });
  });

  const getEntry = () =>
    getRegisteredInputControls().find((e) => e.key === 'encounterDetails')!;

  it('registers with key "encounterDetails" and correct component', () => {
    const entry = getEntry();
    expect(entry).toBeDefined();
    expect(entry.component).toBe(EncounterDetails);
  });

  it('reset() delegates to store', () => {
    getEntry().reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it.each([
    { isReady: false, expected: false },
    { isReady: true, expected: true },
  ])(
    'validate() returns $expected when isEncounterDetailsFormReady is $isReady',
    ({ isReady, expected }) => {
      mockGetState.mockReturnValue({ isEncounterDetailsFormReady: isReady });
      expect(getEntry().validate()).toBe(expected);
    },
  );

  it('hasData() always returns false', () => {
    expect(getEntry().hasData()).toBe(false);
  });

  it('subscribe() delegates to store', () => {
    const cb = jest.fn();
    getEntry().subscribe(cb);
    expect(mockSubscribe).toHaveBeenCalledWith(cb);
  });
});
