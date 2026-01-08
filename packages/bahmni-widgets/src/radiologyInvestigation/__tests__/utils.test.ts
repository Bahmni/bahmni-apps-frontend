import {
  createMockRadiologyInvestigation,
  mockRadiologyInvestigationsForFiltering,
  mockRadiologyChainReplacement,
  createMockServiceRequestBundle,
  createMockServiceRequest,
  createMockImagingStudy,
  createMockBundleWithServiceRequestAndImagingStudy,
  mockImagingStudies,
  mockImagingStudiesWithoutAvailable,
} from '../__mocks__/mocks';
import {
  PRIORITY_ORDER,
  getRadiologyPriority,
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
  createRadiologyInvestigationViewModels,
  getAvailableImagingStudies,
} from '../utils';

describe('radiologyInvestigation utilities', () => {
  describe('PRIORITY_ORDER', () => {
    it('should define correct priority order', () => {
      expect(PRIORITY_ORDER).toEqual(['stat', 'routine']);
    });
  });

  describe('getRadiologyPriority', () => {
    it('should return correct priority index for known priorities', () => {
      expect(getRadiologyPriority('stat')).toBe(0);
      expect(getRadiologyPriority('routine')).toBe(1);
    });

    it('should return 999 for unknown priority', () => {
      expect(getRadiologyPriority('unknown')).toBe(999);
      expect(getRadiologyPriority('')).toBe(999);
    });

    it('should handle case insensitive matching', () => {
      expect(getRadiologyPriority('STAT')).toBe(0);
      expect(getRadiologyPriority('Routine')).toBe(1);
    });
  });

  describe('sortRadiologyInvestigationsByPriority', () => {
    it('should sort investigations by priority', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine X-Ray', 'routine'),
        createMockRadiologyInvestigation('1', 'Stat CT Scan', 'stat'),
        createMockRadiologyInvestigation('3', 'Unknown MRI', 'unknown'),
      ];

      const sorted = sortRadiologyInvestigationsByPriority(investigations);

      expect(sorted[0].priority).toBe('stat');
      expect(sorted[1].priority).toBe('routine');
      expect(sorted[2].priority).toBe('unknown');
    });

    it('should handle empty array', () => {
      const sorted = sortRadiologyInvestigationsByPriority([]);
      expect(sorted).toEqual([]);
    });

    it('should not mutate original array', () => {
      const investigations = [
        createMockRadiologyInvestigation('2', 'Routine', 'routine'),
        createMockRadiologyInvestigation('1', 'Stat', 'stat'),
      ];
      const originalOrder = [...investigations];

      sortRadiologyInvestigationsByPriority(investigations);

      expect(investigations).toEqual(originalOrder);
    });
  });

  describe('filterRadiologyInvestionsReplacementEntries', () => {
    it('should filter out both replacing and replaced entries', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyInvestigationsForFiltering,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('9c847638-295b-4e3e-933d-47d5cad34faf');
      expect(filtered[0].testName).toBe('X-Ray - Standalone');
    });

    it('should handle investigations without any replacements', () => {
      const investigations = [
        createMockRadiologyInvestigation('1', 'X-Ray', 'routine'),
        createMockRadiologyInvestigation('2', 'CT Scan', 'stat'),
      ];

      const filtered =
        filterRadiologyInvestionsReplacementEntries(investigations);

      expect(filtered).toEqual(investigations);
    });

    it('should handle empty array', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries([]);
      expect(filtered).toEqual([]);
    });

    it('should handle chain of replacements', () => {
      const filtered = filterRadiologyInvestionsReplacementEntries(
        mockRadiologyChainReplacement,
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('standalone');
    });
  });

  describe('createRadiologyInvestigationViewModels', () => {
    it('should transform FHIR ServiceRequest to view model', () => {
      const bundle = createMockServiceRequestBundle(createMockServiceRequest());

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result).toEqual([
        {
          id: 'order-1',
          testName: 'Chest X-Ray',
          priority: 'stat',
          orderedBy: 'Dr. Smith',
          orderedDate: '2023-10-15T10:30:00.000Z',
        },
      ]);
    });

    it('should handle ServiceRequest with replaces field', () => {
      const bundle = createMockServiceRequestBundle(
        createMockServiceRequest({
          id: 'order-new',
          code: {
            text: 'Updated X-Ray',
          },
          replaces: [
            {
              reference: 'ServiceRequest/order-1',
              type: 'ServiceRequest',
            },
          ],
        }),
      );

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result[0].replaces).toEqual(['order-1']);
    });

    it('should handle ServiceRequest with note field', () => {
      const bundle = createMockServiceRequestBundle(
        createMockServiceRequest({
          note: [
            {
              text: 'Patient should be fasting',
            },
          ],
        }),
      );

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result[0].note).toBe('Patient should be fasting');
    });

    it('should handle empty bundle', () => {
      const bundle = createMockServiceRequestBundle(createMockServiceRequest());
      bundle.entry = [];

      const result = createRadiologyInvestigationViewModels(bundle);
      expect(result).toEqual([]);
    });

    it('should match ImagingStudy to ServiceRequest and include in view model', () => {
      const serviceRequest = createMockServiceRequest({
        code: { text: 'CT Scan' },
        priority: 'routine',
      });
      const imagingStudy = createMockImagingStudy();
      const bundle = createMockBundleWithServiceRequestAndImagingStudy(
        serviceRequest,
        [imagingStudy],
      );

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result).toHaveLength(1);
      expect(result[0].imagingStudies).toEqual([
        {
          id: 'imaging-1',
          StudyInstanceUIDs: '1.2.840.113619.2.55.3.1',
          status: 'available',
        },
      ]);
    });

    it('should handle multiple ImagingStudies for a single ServiceRequest', () => {
      const serviceRequest = createMockServiceRequest({
        code: { text: 'MRI' },
        requester: { display: 'Dr. Jones' },
        occurrencePeriod: { start: '2023-10-16T14:00:00.000Z' },
      });
      const imagingStudy1 = createMockImagingStudy();
      const imagingStudy2 = createMockImagingStudy({
        id: 'imaging-2',
        identifier: [
          {
            system: 'urn:dicom:uid',
            value: '1.2.840.113619.2.55.3.2',
          },
        ],
      });
      const bundle = createMockBundleWithServiceRequestAndImagingStudy(
        serviceRequest,
        [imagingStudy1, imagingStudy2],
      );

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result).toHaveLength(1);
      expect(result[0].imagingStudies).toHaveLength(2);
      expect(result[0].imagingStudies?.[0].StudyInstanceUIDs).toBe(
        '1.2.840.113619.2.55.3.1',
      );
      expect(result[0].imagingStudies?.[1].StudyInstanceUIDs).toBe(
        '1.2.840.113619.2.55.3.2',
      );
    });

    it('should not include ImagingStudies without DICOM UID identifier', () => {
      const serviceRequest = createMockServiceRequest({
        code: { text: 'Ultrasound' },
        priority: 'routine',
        requester: { display: 'Dr. Brown' },
        occurrencePeriod: { start: '2023-10-17T09:00:00.000Z' },
      });
      const imagingStudy = createMockImagingStudy({
        identifier: [
          {
            system: 'other-system',
            value: 'some-other-id',
          },
        ],
      });
      const bundle = createMockBundleWithServiceRequestAndImagingStudy(
        serviceRequest,
        [imagingStudy],
      );

      const result = createRadiologyInvestigationViewModels(bundle);

      expect(result).toHaveLength(1);
      expect(result[0].imagingStudies).toEqual([
        {
          id: 'imaging-1',
          StudyInstanceUIDs: '',
          status: 'available',
        },
      ]);
    });
  });

  describe('getAvailableImagingStudies', () => {
    it('should return empty array when no imaging studies provided', () => {
      const result = getAvailableImagingStudies(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when imaging studies array is empty', () => {
      const result = getAvailableImagingStudies([]);
      expect(result).toEqual([]);
    });

    it('should return only studies with status "available"', () => {
      const result = getAvailableImagingStudies(mockImagingStudies);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('study-1');
      expect(result[1].id).toBe('study-3');
    });

    it('should return empty array when no studies have status "available"', () => {
      const result = getAvailableImagingStudies(
        mockImagingStudiesWithoutAvailable,
      );

      expect(result).toEqual([]);
    });
  });
});
