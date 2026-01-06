import { getServiceRequests } from '../../orderRequestService';
import {
  mockPatientUUID,
  mockRadiologyInvestigations,
  mockRadiologyInvestigationBundle,
  mockEmptyRadiologyInvestigationBundle,
  mockMalformedBundle,
  mockRadiologyInvestigationBundleWithImagingStudy,
  mockImagingStudies,
} from '../__mocks__/mocks';
import {
  getPatientRadiologyInvestigationBundle,
  getPatientRadiologyInvestigations,
  getPatientRadiologyInvestigationBundleWithImagingStudy,
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

  describe('getPatientRadiologyInvestigationBundleWithImagingStudy', () => {
    const mockCategory = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';

    it('should fetch bundle with both ServiceRequest and ImagingStudy resources', async () => {
      (getServiceRequests as jest.Mock).mockResolvedValueOnce(
        mockRadiologyInvestigationBundleWithImagingStudy,
      );

      const result =
        await getPatientRadiologyInvestigationBundleWithImagingStudy(
          mockPatientUUID,
          mockCategory,
        );

      expect(getServiceRequests).toHaveBeenCalledWith(
        mockCategory,
        mockPatientUUID,
        undefined,
        undefined,
        'ImagingStudy:basedon',
      );
      expect(result).toEqual(mockRadiologyInvestigationBundleWithImagingStudy);
      expect(result.entry).toHaveLength(
        mockRadiologyInvestigations.length + mockImagingStudies.length,
      );
    });

    it('should propagate errors from the API', async () => {
      const error = new Error('Network error');
      (getServiceRequests as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        getPatientRadiologyInvestigationBundleWithImagingStudy(
          mockPatientUUID,
          mockCategory,
        ),
      ).rejects.toThrow('Network error');
    });
  });
});
