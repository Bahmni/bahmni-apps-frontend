export const mockEOCBundle = {
  resourceType: 'Bundle' as const,
  id: 'eoc-bundle-123',
  type: 'searchset' as const,
  total: 2,
  entry: [
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/EpisodeOfCare/eoc-123',
      resource: {
        resourceType: 'EpisodeOfCare' as const,
        id: 'eoc-123',
      },
    },
    {
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-456',
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
      fullUrl: 'http://localhost/openmrs/ws/fhir2/R4/Encounter/encounter-457',
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
