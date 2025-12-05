import { get } from '../../api';
import {
  getPatientVisits,
  getVisits,
  getActiveVisit,
  getEncountersForEOC,
} from '../../encounterService';
import { mockVisitBundle, mockActiveVisit } from '../__mocks__/mocks';
import { PATIENT_VISITS_URL, EOC_ENCOUNTERS_URL } from '../constants';

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

  describe('getEncountersForEOC', () => {
    const mockEOCBundle = {
      resourceType: 'Bundle' as const,
      id: 'eoc-bundle-123',
      type: 'searchset' as const,
      entry: [
        {
          fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/EpisodeOfCare/eoc-123',
          resource: {
            resourceType: 'EpisodeOfCare' as const,
            id: 'eoc-123',
          },
        },
        {
          fullUrl:
            'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-456',
          resource: {
            resourceType: 'Encounter' as const,
            id: 'encounter-456',
            episodeOfCare: [
              {
                reference: 'EpisodeOfCare/eoc-123',
              },
            ],
          },
        },
      ],
    };

    it('should fetch encounters for a single EOC ID', async () => {
      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce(mockEOCBundle);

      await getEncountersForEOC(eocId);

      expect(mockedGet).toHaveBeenCalledWith(EOC_ENCOUNTERS_URL(eocId));
    });

    it('should fetch encounters for multiple EOC IDs', async () => {
      const eocIds = ['eoc-123', 'eoc-456'];
      const expectedJoinedIds = 'eoc-123,eoc-456';
      mockedGet.mockResolvedValueOnce(mockEOCBundle);

      await getEncountersForEOC(eocIds);

      expect(mockedGet).toHaveBeenCalledWith(
        EOC_ENCOUNTERS_URL(expectedJoinedIds),
      );
    });

    it('should return visit IDs and encounter IDs', async () => {
      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce(mockEOCBundle);

      const result = await getEncountersForEOC(eocId);

      expect(result).toEqual({
        visitIds: [],
        encounterIds: ['encounter-456'],
      });
    });

    it('should handle empty array input', async () => {
      const eocIds: string[] = [];
      const expectedJoinedIds = '';
      mockedGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      });

      const result = await getEncountersForEOC(eocIds);

      expect(mockedGet).toHaveBeenCalledWith(
        EOC_ENCOUNTERS_URL(expectedJoinedIds),
      );
      expect(result).toEqual({ visitIds: [], encounterIds: [] });
    });
  });
});
