import { get } from '../../api';
import { EOC_ENCOUNTERS_URL } from '../constants';
import { getEncountersForEOC } from '../episodeOfCareService';

jest.mock('../../api');
const mockedGet = get as jest.MockedFunction<typeof get>;

describe('episodeOfCareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
            partOf: {
              reference: 'Visit/visit-789',
            },
            episodeOfCare: [
              {
                reference: 'EpisodeOfCare/eoc-123',
              },
            ],
          },
        },
        {
          fullUrl:
            'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-457',
          resource: {
            resourceType: 'Encounter' as const,
            id: 'encounter-457',
            partOf: {
              reference: 'Visit/visit-789', // Same visit as above
            },
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

    it('should return unique visit UUIDs and encounter UUIDs', async () => {
      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce(mockEOCBundle);

      const result = await getEncountersForEOC(eocId);

      expect(result).toEqual({
        visitUuids: ['visit-789'], // Should be deduplicated - both encounters have same visit
        encounterUuids: ['encounter-456', 'encounter-457'],
      });
    });

    it('should handle encounters without partOf reference', async () => {
      const bundleWithoutPartOf = {
        ...mockEOCBundle,
        entry: [
          ...mockEOCBundle.entry.slice(0, 1), // Keep the EpisodeOfCare entry
          {
            fullUrl:
              'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-456',
            resource: {
              resourceType: 'Encounter' as const,
              id: 'encounter-456',
              // No partOf reference
              episodeOfCare: [
                {
                  reference: 'EpisodeOfCare/eoc-123',
                },
              ],
            },
          },
        ],
      };

      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce(bundleWithoutPartOf);

      const result = await getEncountersForEOC(eocId);

      expect(result).toEqual({
        visitUuids: [], // No visit UUIDs because no partOf reference
        encounterUuids: ['encounter-456'],
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
      expect(result).toEqual({ visitUuids: [], encounterUuids: [] });
    });

    it('should handle bundle with no entries', async () => {
      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: undefined,
      });

      const result = await getEncountersForEOC(eocId);

      expect(result).toEqual({ visitUuids: [], encounterUuids: [] });
    });

    it('should filter out non-Encounter resources', async () => {
      const bundleWithMixedResources = {
        resourceType: 'Bundle' as const,
        id: 'mixed-bundle',
        type: 'searchset' as const,
        entry: [
          {
            fullUrl:
              'http://localhost/openmrs/ws/fhir2/R4/EpisodeOfCare/eoc-123',
            resource: {
              resourceType: 'EpisodeOfCare' as const,
              id: 'eoc-123',
            },
          },
          {
            fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Patient/patient-123',
            resource: {
              resourceType: 'Patient' as const,
              id: 'patient-123',
            },
          },
          {
            fullUrl:
              'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-456',
            resource: {
              resourceType: 'Encounter' as const,
              id: 'encounter-456',
              partOf: {
                reference: 'Visit/visit-789',
              },
            },
          },
        ],
      };

      const eocId = 'eoc-123';
      mockedGet.mockResolvedValueOnce(bundleWithMixedResources);

      const result = await getEncountersForEOC(eocId);

      expect(result).toEqual({
        visitUuids: ['visit-789'],
        encounterUuids: ['encounter-456'],
      });
    });
  });
});
