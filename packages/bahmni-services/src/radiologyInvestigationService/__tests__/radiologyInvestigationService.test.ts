import { Bundle, ServiceRequest } from 'fhir/r4';
import { get } from '../../api';
import {
  mockRadiologyTestBasic,
  mockRadiologyTestWithMultipleReplaces,
  mockRadiologyTestWithEmptyReplaces,
} from '../__mocks__/mocks';
import { getPatientRadiologyInvestigations } from '../radiologyInvestigationService';

// Mock the API module
jest.mock('../../api');
const mockGet = get as jest.MockedFunction<typeof get>;

describe('radiologyInvestigationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPatientRadiologyInvestigations', () => {
    const mockPatientUUID = 'test-patient-uuid';
    const mockCategoryUUID = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';

    it('should fetch and format radiology investigations', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockRadiologyTestBasic,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        undefined,
        5,
      );

      expect(mockGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${mockCategoryUUID}&patient=${mockPatientUUID}&numberOfVisits=5`,
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

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toEqual([]);
    });

    it('should handle bundle with no entry property', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        // entry is undefined - this tests the || [] fallback
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockGet.mockRejectedValue(error);

      await expect(
        getPatientRadiologyInvestigations(mockPatientUUID, mockCategoryUUID),
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

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

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

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('order-1');
      expect(result[1].id).toBe('order-2');
      expect(result[2].id).toBe('order-3');
      expect(result[0].testName).toBe('X-Ray');
      expect(result[1].testName).toBe('CT Scan');
      expect(result[2].testName).toBe('MRI');
    });

    it('should handle ServiceRequest with replaces field', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'ServiceRequest',
              id: '207172a2-27e3-4fef-bea2-85fb826575e4',
              status: 'unknown',
              intent: 'order',
              subject: { reference: 'Patient/test-patient-uuid' },
              code: {
                text: 'Magnetic resonance imaging of thoracolumbar spine',
              },
              priority: 'routine',
              requester: {
                display: 'Super Man',
              },
              occurrencePeriod: {
                start: '2025-06-13T08:48:15+00:00',
              },
              replaces: [
                {
                  reference:
                    'ServiceRequest/271f2b4f-a239-418b-ba9e-f23014093df3',
                  type: 'ServiceRequest',
                  identifier: {
                    use: 'usual',
                    type: {
                      coding: [
                        {
                          system:
                            'http://terminology.hl7.org/CodeSystem/v2-0203',
                          code: 'PLAC',
                          display: 'Placer Identifier',
                        },
                      ],
                    },
                    value: 'ORD-30',
                  },
                },
              ],
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '207172a2-27e3-4fef-bea2-85fb826575e4',
        testName: 'Magnetic resonance imaging of thoracolumbar spine',
        priority: 'routine',
        orderedBy: 'Super Man',
        orderedDate: '2025-06-13T08:48:15+00:00',
        replaces: ['271f2b4f-a239-418b-ba9e-f23014093df3'],
      });
    });

    it('should handle ServiceRequest with multiple replaces', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockRadiologyTestWithMultipleReplaces,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-new',
        testName: 'Updated X-Ray',
        priority: 'urgent',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
        replaces: ['order-1', 'order-2'],
      });
    });

    it('should handle ServiceRequest with empty replaces reference', async () => {
      const mockBundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockRadiologyTestWithEmptyReplaces,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'urgent',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
        // replaces field should not be present when filtered empty references
      });
    });

    it('should handle ServiceRequest without replaces field', async () => {
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
              // No replaces field
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'urgent',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
        // replaces field should not be present
      });
    });

    it('should extract note when present', async () => {
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
                display: 'Dr. Smith',
              },
              occurrencePeriod: {
                start: '2023-10-15T10:30:00.000Z',
              },
              note: [
                {
                  text: 'Patient should be fasting',
                },
              ],
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
        note: 'Patient should be fasting',
      });
    });

    it('should handle ServiceRequest without note field', async () => {
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

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
      });
    });

    it('should handle ServiceRequest with empty note array', async () => {
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
                display: 'Dr. Smith',
              },
              occurrencePeriod: {
                start: '2023-10-15T10:30:00.000Z',
              },
              note: [],
            } as ServiceRequest,
          },
        ],
      };

      mockGet.mockResolvedValue(mockBundle);

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'order-1',
        testName: 'X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Smith',
        orderedDate: '2023-10-15T10:30:00.000Z',
      });
    });
  });

  describe('encounterUuids parameter handling', () => {
    const mockPatientUUID = 'test-patient-uuid';
    const mockCategoryUUID = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';
    const mockBundle: Bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        {
          resource: mockRadiologyTestBasic,
        },
      ],
    };

    beforeEach(() => {
      mockGet.mockResolvedValue(mockBundle);
    });

    it('should pass multiple encounterUuids to the API call', async () => {
      const encounterUuids = ['encounter-1', 'encounter-2', 'encounter-3'];

      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        encounterUuids,
      );

      expect(mockGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${mockCategoryUUID}&patient=${mockPatientUUID}&encounter=encounter-1,encounter-2,encounter-3`,
      );
    });

    it('should pass single encounterUuid to the API call', async () => {
      const encounterUuids = ['encounter-123'];

      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        encounterUuids,
      );

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('encounter=encounter-123'),
      );
    });

    it('should include only numberOfVisits when encounterUuids is undefined', async () => {
      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        undefined,
        3,
      );

      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).not.toContain('encounter=');

      expect(mockGet).toHaveBeenCalledWith(
        `/openmrs/ws/fhir2/R4/ServiceRequest?_sort=-_lastUpdated&category=${mockCategoryUUID}&patient=${mockPatientUUID}&numberOfVisits=3`,
      );
    });

    it('should not include encounter parameter when encounterUuids is null', async () => {
      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        null as any,
      );

      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).not.toContain('encounter=');
    });

    it('should not include encounter parameter when encounterUuids is empty array', async () => {
      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        [],
      );

      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).not.toContain('encounter=');
    });

    it('should prioritize encounterUuids over numberOfVisits when both are provided', async () => {
      const encounterUuids = ['encounter-1', 'encounter-2'];

      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        encounterUuids,
        5,
      );

      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).toContain('encounter=encounter-1,encounter-2');
      expect(calledUrl).not.toContain('numberOfVisits=');
    });

    it('should include numberOfVisits when encounterUuids is empty array', async () => {
      await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategoryUUID,
        [],
        10,
      );

      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).toContain('numberOfVisits=10');
      expect(calledUrl).not.toContain('encounter=');
    });
  });
});
