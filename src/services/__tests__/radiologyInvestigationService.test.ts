import { Bundle, ServiceRequest } from 'fhir/r4';
import { getPatientRadiologyInvestigations } from '../radiologyInvestigationService';
import { get } from '../api';

// Mock the API module
jest.mock('../api');
const mockGet = get as jest.MockedFunction<typeof get>;

describe('radiologyInvestigationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientRadiologyInvestigations', () => {
    const mockPatientUUID = 'test-patient-uuid';

    it('should fetch and format radiology investigations', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: 'order-1',
              status: 'active',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'Chest X-Ray',
              },
              priority: 'urgent',
              requester: {
                display: 'Dr. Smith',
              },
              occurrencePeriod: {
                start: '2023-10-15T10:30:00.000Z',
              },
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(mockPatientUUID);

      expect(mockGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ServiceRequest?category=d3561dc0-5e07-11ef-8f7c-0242ac120002&patient=${mockPatientUUID}&_count=100&_sort=-_lastUpdated&numberOfVisits=5`,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'Chest X-Ray',
        priority: 'urgent',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
      });
    });

    it('should handle empty bundle', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(mockPatientUUID);

      expect(result).toEqual([]);
    });

    it('should handle bundle with no entry property', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        // entry is undefined - this tests the || [] fallback
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(mockPatientUUID);

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockGet.mockRejectedValue(error);

      await expect(
        getPatientRadiologyInvestigations(mockPatientUUID),
      ).rejects.toThrow('API Error');
    });

    it('should format radiology investigations with all required fields', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: 'order-1',
              status: 'active',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'X-Ray',
              },
              priority: 'routine',
              requester: {
                display: 'Dr. Johnson',
              },
              occurrencePeriod: {
                start: '2023-10-15',
              },
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(mockPatientUUID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Johnson',
        orderedDate: '2023-10-15',
      });
    });

    it('should return investigations in order from FHIR bundle', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: 'order-1',
              status: 'active',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'X-Ray',
              },
              priority: 'urgent',
              requester: {
                display: 'Dr. Smith',
              },
              occurrencePeriod: {
                start: '2023-10-15T10:30:00.000Z',
              },
            } as ServiceRequest,
          },
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: 'order-2',
              status: 'active',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'CT Scan',
              },
              priority: 'routine',
              requester: {
                display: 'Dr. Johnson',
              },
              occurrencePeriod: {
                start: '2023-10-14T09:15:00.000Z',
              },
            } as ServiceRequest,
          },
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: 'order-3',
              status: 'active',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'MRI',
              },
              priority: 'stat',
              requester: {
                display: 'Dr. Brown',
              },
              occurrencePeriod: {
                start: '2023-10-13T14:45:00.000Z',
              },
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(mockPatientUUID);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('order-1');
      expect(result[1].id).toBe('order-2');
      expect(result[2].id).toBe('order-3');
      expect(result[0].testName).toBe('X-Ray');
      expect(result[1].testName).toBe('CT Scan');
      expect(result[2].testName).toBe('MRI');
    });
  });
});
