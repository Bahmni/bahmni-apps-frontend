import { get } from '../../api';
import {
  getPatientVisits,
  getVisits,
  getActiveVisit,
  getObservationsBundleByEncounterUuid,
} from '../../encounterService';
import {
  mockVisitBundle,
  mockActiveVisit,
  mockFormsEncounter,
} from '../__mocks__/mocks';
import { PATIENT_VISITS_URL } from '../constants';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('encounterService', () => {
  const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientVisits', () => {
    it('should fetch visits from the correct endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      await getPatientVisits(patientUUID);

      expect(mockedGet).toHaveBeenCalledWith(PATIENT_VISITS_URL(patientUUID));
    });

    it('should return the encounter bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const result = await getPatientVisits(patientUUID);

      expect(result).toEqual(mockVisitBundle);
    });
  });

  describe('getEncounters', () => {
    it('should extract encounters from the bundle', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual(
        mockVisitBundle.entry.map((entry) => entry.resource),
      );
    });

    it('should return empty array if no encounters are found', async () => {
      mockedGet.mockResolvedValueOnce({ entry: undefined });

      const encounters = await getVisits(patientUUID);

      expect(encounters).toEqual([]);
    });
  });

  describe('getActiveVisit', () => {
    it('should return the active visit', async () => {
      mockedGet.mockResolvedValueOnce(mockVisitBundle);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toEqual(mockActiveVisit);
    });

    it('should return null if no active visit is found', async () => {
      const bundleWithoutActiveVisit = {
        ...mockVisitBundle,
        entry: mockVisitBundle.entry.map((entry) => ({
          ...entry,
          resource: {
            ...entry.resource,
            period: {
              ...entry.resource.period,
              end: entry.resource.period.end ?? '2025-04-09T10:14:51+00:00',
            },
          },
        })),
      };

      mockedGet.mockResolvedValueOnce(bundleWithoutActiveVisit);

      const activeVisit = await getActiveVisit(patientUUID);

      expect(activeVisit).toBeNull();
    });
  });

  describe('getObservationsBundleByEncounterUuid', () => {
    const encounterUUID = 'e8c5eeb5-86d9-44d4-b37a-9de74a122a6e';

    it('should fetch forms encounter from the FHIR API endpoint', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      await getObservationsBundleByEncounterUuid(encounterUUID);

      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining(`/Observation?encounter=${encounterUUID}`),
      );
    });

    it('should return the forms encounter data', async () => {
      mockedGet.mockResolvedValueOnce(mockFormsEncounter);

      const result = await getObservationsBundleByEncounterUuid(encounterUUID);

      expect(result.resourceType).toBe('Bundle');
      expect(result.entry).toBeDefined();
    });
  });
});
