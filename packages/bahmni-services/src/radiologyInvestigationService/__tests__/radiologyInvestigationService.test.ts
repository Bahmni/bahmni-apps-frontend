import { getServiceRequests } from '../../orderRequestService';
import {
  mockPatientUUID,
  mockRadiologyInvestigations,
  mockRadiologyInvestigationBundle,
  mockEmptyRadiologyInvestigationBundle,
  mockMalformedBundle,
} from '../__mocks__/mocks';
import {
  getPatientRadiologyInvestigationBundle,
  getPatientRadiologyInvestigations,
} from '../radiologyInvestigationService';

jest.mock('../../orderRequestService');

describe('radiologyInvestigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getPatientRadiologyInvestigationBundle', () => {
    const mockCategory = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';

    it('should fetch service request bundle for a valid patient UUID', async () => {
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        mockRadiologyInvestigationBundle,
      );

      const result = await getPatientRadiologyInvestigationBundle(
        mockPatientUUID,
        mockCategory,
      );

      expect(getServiceRequests).toHaveBeenCalledWith(
        mockCategory,
        mockPatientUUID,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockRadiologyInvestigationBundle);
    });

    it('should propagate errors from the API', async () => {
      const error = new Error('Network error');
      (getServiceRequests as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        getPatientRadiologyInvestigationBundle(mockPatientUUID, mockCategory),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getPatientRadiologyInvestigations', () => {
    const mockCategory = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';

    it('should fetch conditions for a valid patient UUID', async () => {
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        mockRadiologyInvestigationBundle,
      );

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategory,
      );

      expect(getServiceRequests).toHaveBeenCalledWith(
        mockCategory,
        mockPatientUUID,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockRadiologyInvestigations);
    });

    it('should return empty array when no investigations exist', async () => {
      const patientUUID = 'no-investigations';
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        mockEmptyRadiologyInvestigationBundle,
      );

      const result = await getPatientRadiologyInvestigations(
        patientUUID,
        mockCategory,
      );

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle missing entry array', async () => {
      const malformedResponse = {
        ...mockRadiologyInvestigationBundle,
        entry: undefined,
      };
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        malformedResponse,
      );

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategory,
      );
      expect(result).toEqual([]);
    });

    it('should filter out invalid resource types', async () => {
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        mockMalformedBundle,
      );

      const result = await getPatientRadiologyInvestigations(
        mockPatientUUID,
        mockCategory,
      );
      expect(result).toEqual([]);
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
