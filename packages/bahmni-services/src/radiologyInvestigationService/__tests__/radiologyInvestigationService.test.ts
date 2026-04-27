import { ImagingStudy, Observation } from 'fhir/r4';
import { get } from '../../api';
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
import { IMAGING_STUDY_FETCH_QC_URL } from '../constants';
import {
  getPatientRadiologyInvestigationBundle,
  getPatientRadiologyInvestigations,
  getPatientRadiologyInvestigationBundleWithImagingStudy,
  fetchQualityAssessment,
} from '../radiologyInvestigationService';

jest.mock('../../api');
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

  describe('fetchQualityAssessment', () => {
    it('should fetch quality assessment for imaging study', async () => {
      const mockImagingStudy: ImagingStudy = {
        resourceType: 'ImagingStudy',
        id: 'imaging-study-123',
        status: 'available',
        subject: { reference: 'Patient/patient-123' },
        contained: [
          {
            resourceType: 'Observation',
            id: 'qc-obs-1',
            status: 'final',
            code: { coding: [{ code: 'qc-code' }] },
          } as Observation,
        ],
      };

      (get as jest.Mock).mockResolvedValue(mockImagingStudy);

      const result = await fetchQualityAssessment('imaging-study-123');

      expect(get).toHaveBeenCalledWith(
        IMAGING_STUDY_FETCH_QC_URL('imaging-study-123'),
      );
      expect(result).toEqual(mockImagingStudy);
    });

    it('should propagate API errors', async () => {
      (get as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

      await expect(fetchQualityAssessment('imaging-study-123')).rejects.toThrow(
        'Failed to fetch',
      );
    });
  });
});
