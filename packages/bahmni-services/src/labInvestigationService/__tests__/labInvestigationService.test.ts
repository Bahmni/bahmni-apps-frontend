import { ServiceRequest, Bundle } from 'fhir/r4';

import { get } from '../../api';
import { getLabInvestigationsBundle } from '../labInvestigationService';

jest.mock('../../api');

describe('labInvestigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
  const categoryUuid = 'category-uuid-123';

  const createMockServiceRequest = (
    overrides: Partial<ServiceRequest> = {},
  ): ServiceRequest => ({
    resourceType: 'ServiceRequest',
    id: 'test-id',
    status: 'completed',
    intent: 'order',
    code: {
      text: 'Test Name',
    },
    subject: {
      reference: 'Patient/test-patient',
    },
    priority: 'routine',
    occurrencePeriod: {
      start: '2025-05-08T12:44:24+00:00',
    },
    requester: {
      display: 'Test Doctor',
    },
    ...overrides,
  });

  const createMockBundle = (
    serviceRequests: ServiceRequest[] = [],
  ): Bundle<ServiceRequest> => ({
    resourceType: 'Bundle',
    id: 'bundle-id',
    type: 'searchset',
    total: serviceRequests.length,
    entry: serviceRequests.map((resource) => ({
      resource,
      fullUrl: `http://example.com/ServiceRequest/${resource.id}`,
    })),
  });

  describe('getLabInvestigationsBundle', () => {
    const setupMockAndCall = async (
      encounterUuids?: string[],
      numberOfVisits?: number,
    ) => {
      const mockBundle = createMockBundle([]);
      (get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getLabInvestigationsBundle(
        patientUUID,
        categoryUuid,
        encounterUuids,
        numberOfVisits,
      );

      return { result, mockBundle };
    };

    it('should fetch and return lab test bundle', async () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({
          id: 'test-1',
          code: { coding: [{ code: 'concept-1' }], text: 'Test Name 1' },
        }),
        createMockServiceRequest({
          id: 'test-2',
          code: { coding: [{ code: 'concept-2' }], text: 'Test Name 2' },
        }),
      ]);

      (get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getLabInvestigationsBundle(
        patientUUID,
        categoryUuid,
      );

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=category-uuid-123&patient=58493859-63f7-48b6-bd0b-698d5a119a21',
      );
      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
    });

    it('should handle empty bundle', async () => {
      const { result } = await setupMockAndCall();

      expect(result.entry).toHaveLength(0);
    });

    it('should pass encounterUuids parameter when provided', async () => {
      const encounterUuids = ['encounter-1', 'encounter-2'];

      await setupMockAndCall(encounterUuids);

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=category-uuid-123&patient=58493859-63f7-48b6-bd0b-698d5a119a21&encounter=encounter-1,encounter-2',
      );
    });

    it('should pass numberOfVisits parameter when provided', async () => {
      const numberOfVisits = 5;

      await setupMockAndCall(undefined, numberOfVisits);

      expect(get).toHaveBeenCalledWith(
        '/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=category-uuid-123&patient=58493859-63f7-48b6-bd0b-698d5a119a21&numberOfVisits=5',
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (get as jest.Mock).mockRejectedValue(error);

      await expect(
        getLabInvestigationsBundle(patientUUID, categoryUuid),
      ).rejects.toThrow('API Error');
    });
  });
});
