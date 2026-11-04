import {
  createOrderFulfillmentEncounter,
  getActiveVisitByPatient,
} from '@bahmni/services';
import { ensureEncounterForActiveVisit } from '../useEnsureEncounterForVisit';

jest.mock('@bahmni/services', () => ({
  getActiveVisitByPatient: jest.fn(),
  createOrderFulfillmentEncounter: jest.fn(),
}));

const mockGetActiveVisit = getActiveVisitByPatient as jest.Mock;
const mockCreateEncounter = createOrderFulfillmentEncounter as jest.Mock;

const baseParams = {
  patientUuid: 'patient-uuid-1',
  practitionerUuid: 'practitioner-uuid-1',
  locationUuid: 'location-uuid-1',
  encounterTypeUuid: 'encounter-type-uuid-1',
};

describe('ensureEncounterForActiveVisit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when patient has no active visit', async () => {
    mockGetActiveVisit.mockResolvedValue({ results: [] });

    const result = await ensureEncounterForActiveVisit(baseParams);

    expect(result).toBeNull();
    expect(mockCreateEncounter).not.toHaveBeenCalled();
  });

  it('creates encounter and returns UUID when patient has an active visit', async () => {
    const visitUuid = 'visit-uuid-1';
    const encounterUuid = 'created-encounter-uuid-1';
    mockGetActiveVisit.mockResolvedValue({
      results: [{ uuid: visitUuid }],
    });
    mockCreateEncounter.mockResolvedValue(encounterUuid);

    const result = await ensureEncounterForActiveVisit(baseParams);

    expect(result).toBe(encounterUuid);
    expect(mockCreateEncounter).toHaveBeenCalledWith({
      patientUuid: baseParams.patientUuid,
      visitUuid,
      practitionerUuid: baseParams.practitionerUuid,
      locationUuid: baseParams.locationUuid,
      encounterTypeUuid: baseParams.encounterTypeUuid,
    });
  });

  it('uses the first active visit UUID when multiple visits exist', async () => {
    const firstVisitUuid = 'visit-uuid-first';
    mockGetActiveVisit.mockResolvedValue({
      results: [{ uuid: firstVisitUuid }, { uuid: 'visit-uuid-second' }],
    });
    mockCreateEncounter.mockResolvedValue('encounter-uuid-1');

    await ensureEncounterForActiveVisit(baseParams);

    expect(mockCreateEncounter).toHaveBeenCalledWith(
      expect.objectContaining({ visitUuid: firstVisitUuid }),
    );
  });

  it('propagates errors from createOrderFulfillmentEncounter', async () => {
    mockGetActiveVisit.mockResolvedValue({
      results: [{ uuid: 'visit-uuid-1' }],
    });
    mockCreateEncounter.mockRejectedValue(new Error('Server error'));

    await expect(ensureEncounterForActiveVisit(baseParams)).rejects.toThrow(
      'Server error',
    );
  });

  it('propagates errors from getActiveVisitByPatient', async () => {
    mockGetActiveVisit.mockRejectedValue(new Error('Network error'));

    await expect(ensureEncounterForActiveVisit(baseParams)).rejects.toThrow(
      'Network error',
    );
    expect(mockCreateEncounter).not.toHaveBeenCalled();
  });
});
