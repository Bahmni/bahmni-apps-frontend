import { formatDate } from '@bahmni/services';
import { ServiceRequest, Bundle } from 'fhir/r4';

import {
  LabInvestigationPriority,
  FormattedLabInvestigations,
} from '../models';
import {
  filterLabInvestigationEntries,
  mapLabInvestigationPriority,
  determineInvestigationType,
  formatLabInvestigations,
  groupLabInvestigationsByDate,
  updateInvestigationsWithReportInfo,
  extractObservationsFromBundle,
  formatObservationsAsLabTestResults,
  mapDiagnosticReportBundleToTestResults,
  updateTestsWithResults,
  REFERENCE_RANGE_CODE,
} from '../utils';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDate: jest.fn(),
}));

describe('Lab Investigation Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatDate as jest.Mock).mockImplementation((date) => ({
      formattedResult: date.includes('2025-05-08')
        ? 'May 8, 2025'
        : 'April 9, 2025',
    }));
  });

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

  const mockTranslate = (key: string) => key;

  describe('mapLabInvestigationPriority', () => {
    it('should map routine priority correctly', () => {
      const labTest = createMockServiceRequest({ priority: 'routine' });
      const result = mapLabInvestigationPriority(labTest);
      expect(result).toBe(LabInvestigationPriority.routine);
    });

    it('should map stat priority correctly', () => {
      const labTest = createMockServiceRequest({ priority: 'stat' });
      const result = mapLabInvestigationPriority(labTest);
      expect(result).toBe(LabInvestigationPriority.stat);
    });

    it('should default to routine for undefined priority', () => {
      const labTest = createMockServiceRequest({ priority: undefined });
      const result = mapLabInvestigationPriority(labTest);
      expect(result).toBe(LabInvestigationPriority.routine);
    });

    it('should default to routine for unknown priority', () => {
      const labTest = createMockServiceRequest({ priority: 'urgent' });
      const result = mapLabInvestigationPriority(labTest);
      expect(result).toBe(LabInvestigationPriority.routine);
    });
  });

  describe('determineInvestigationType', () => {
    it('should identify Panel test type', () => {
      const labTest = createMockServiceRequest({
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
            valueString: 'Panel',
          },
        ],
      });
      const result = determineInvestigationType(labTest);
      expect(result).toBe('Panel');
    });

    it('should identify Single Test type', () => {
      const labTest = createMockServiceRequest({
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
            valueString: 'Test',
          },
        ],
      });
      const result = determineInvestigationType(labTest);
      expect(result).toBe('Single Test');
    });

    it('should default to Single Test when no extension', () => {
      const labTest = createMockServiceRequest({ extension: undefined });
      const result = determineInvestigationType(labTest);
      expect(result).toBe('Single Test');
    });

    it('should default to Single Test when no matching extension', () => {
      const labTest = createMockServiceRequest({
        extension: [
          {
            url: 'http://other.url',
            valueString: 'Other',
          },
        ],
      });
      const result = determineInvestigationType(labTest);
      expect(result).toBe('Single Test');
    });
  });

  describe('filterLabInvestigationEntries', () => {
    it('should return empty array when bundle has no entries', () => {
      const emptyBundle = createMockBundle([]);
      const result = filterLabInvestigationEntries(emptyBundle);
      expect(result).toEqual([]);
    });

    it('should return all entries when none have replaces field', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({ id: 'test-2' }),
        createMockServiceRequest({ id: 'test-3' }),
      ]);

      const result = filterLabInvestigationEntries(mockBundle);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.id)).toEqual(['test-1', 'test-2', 'test-3']);
    });

    it('should filter out entries that have replaces field', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({
          id: 'test-2',
          replaces: [{ reference: 'ServiceRequest/test-1' }],
        }),
        createMockServiceRequest({ id: 'test-3' }),
      ]);

      const result = filterLabInvestigationEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-3');
    });

    it('should filter out entries that are being replaced', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({ id: 'test-2' }),
        createMockServiceRequest({
          id: 'test-3',
          replaces: [{ reference: 'ServiceRequest/test-1' }],
        }),
      ]);

      const result = filterLabInvestigationEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-2');
    });

    it('should handle multiple replaces references', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({ id: 'test-2' }),
        createMockServiceRequest({ id: 'test-3' }),
        createMockServiceRequest({
          id: 'test-4',
          replaces: [
            { reference: 'ServiceRequest/test-1' },
            { reference: 'ServiceRequest/test-2' },
          ],
        }),
      ]);

      const result = filterLabInvestigationEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-3');
    });
  });

  describe('formatLabInvestigations', () => {
    it('should format lab tests correctly', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          code: { text: 'Blood Test' },
          priority: 'routine',
          requester: { display: 'Dr. Smith' },
          occurrencePeriod: { start: '2025-05-08T12:44:24+00:00' },
          extension: [
            {
              url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
              valueString: 'Test',
            },
          ],
        }),
      ];

      const result = formatLabInvestigations(mockTests, mockTranslate);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-1',
        testName: 'Blood Test',
        priority: LabInvestigationPriority.routine,
        orderedBy: 'Dr. Smith',
        orderedDate: '2025-05-08T12:44:24+00:00',
        formattedDate: 'May 8, 2025',
        result: undefined,
        testType: 'Single Test',
        note: undefined,
      });
    });

    it('should handle missing optional fields', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          code: undefined,
          requester: undefined,
          occurrencePeriod: undefined,
        }),
      ];

      const result = formatLabInvestigations(mockTests, mockTranslate);

      expect(result[0].testName).toBe('');
      expect(result[0].orderedBy).toBe('');
      expect(result[0].orderedDate).toBe('');
      expect(result[0].formattedDate).toBe('');
    });

    it('should extract note when present', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          note: [{ text: 'Patient should be fasting' }],
        }),
      ];

      const result = formatLabInvestigations(mockTests, mockTranslate);

      expect(result[0].note).toBe('Patient should be fasting');
    });
  });

  describe('groupLabInvestigationsByDate', () => {
    it('should group tests by date', () => {
      const mockFormattedTests: FormattedLabInvestigations[] = [
        {
          id: 'test-1',
          testName: 'Test 1',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
        {
          id: 'test-2',
          testName: 'Test 2',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T14:30:00+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const result = groupLabInvestigationsByDate(mockFormattedTests);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('May 8, 2025');
      expect(result[0].tests).toHaveLength(2);
    });

    it('should sort dates newest first', () => {
      const mockFormattedTests: FormattedLabInvestigations[] = [
        {
          id: 'test-1',
          testName: 'Old Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-01-01T00:00:00+00:00',
          formattedDate: 'Jan 1, 2025',
          result: undefined,
          testType: 'Single Test',
        },
        {
          id: 'test-2',
          testName: 'New Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-12-31T00:00:00+00:00',
          formattedDate: 'Dec 31, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const result = groupLabInvestigationsByDate(mockFormattedTests);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('Dec 31, 2025');
      expect(result[1].date).toBe('Jan 1, 2025');
    });

    it('should handle empty array', () => {
      const result = groupLabInvestigationsByDate([]);
      expect(result).toEqual([]);
    });
  });

  describe('updateInvestigationsWithReportInfo', () => {
    it('should enrich tests with reportId and attachments', () => {
      const mockTests = [
        {
          id: 'test-1',
          testName: 'Blood Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2024-01-01',
          formattedDate: 'January 1, 2024',
          testType: 'Single Test',
        },
        {
          id: 'test-2',
          testName: 'Urine Test',
          priority: LabInvestigationPriority.stat,
          orderedBy: 'Dr. Jones',
          orderedDate: '2024-01-02',
          formattedDate: 'January 2, 2024',
          testType: 'Panel',
        },
      ] as FormattedLabInvestigations[];

      const mockReports = [
        {
          resourceType: 'DiagnosticReport' as const,
          id: 'report-1',
          status: 'final' as const,
          code: { text: 'Test' },
          basedOn: [{ reference: 'ServiceRequest/test-1' }],
        },
        {
          resourceType: 'DiagnosticReport' as const,
          id: 'report-2',
          status: 'amended' as const,
          code: { text: 'Test' },
          basedOn: [{ reference: 'ServiceRequest/test-2' }],
          presentedForm: [
            {
              id: 'attachment-1',
              url: 'https://example.com/report.pdf',
              contentType: 'application/pdf',
            },
          ],
        },
      ];

      const result = updateInvestigationsWithReportInfo(mockTests, mockReports);

      expect(result).toHaveLength(2);
      expect(result[0].reportId).toBe('report-1');
      expect(result[0].attachments).toBeUndefined();
      expect(result[1].reportId).toBe('report-2');
      expect(result[1].attachments).toBeDefined();
      expect(result[1].attachments).toHaveLength(1);
      expect(result[1].attachments?.[0].url).toBe(
        'https://example.com/report.pdf',
      );
    });

    it('should return tests unchanged when no diagnostic reports', () => {
      const mockTests = [
        {
          id: 'test-1',
          testName: 'Blood Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2024-01-01',
          formattedDate: 'January 1, 2024',
          testType: 'Single Test',
        },
      ] as FormattedLabInvestigations[];

      const result = updateInvestigationsWithReportInfo(mockTests, undefined);

      expect(result).toEqual(mockTests);
    });

    it('should filter out non-processed statuses', () => {
      const mockTests = [
        {
          id: 'test-1',
          testName: 'Blood Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2024-01-01',
          formattedDate: 'January 1, 2024',
          testType: 'Single Test',
        },
      ] as FormattedLabInvestigations[];

      const mockReports = [
        {
          resourceType: 'DiagnosticReport' as const,
          id: 'report-1',
          status: 'registered' as const,
          code: { text: 'Test' },
          basedOn: [{ reference: 'ServiceRequest/test-1' }],
        },
      ];

      const result = updateInvestigationsWithReportInfo(mockTests, mockReports);

      expect(result[0].reportId).toBeUndefined();
    });
  });

  describe('mapDiagnosticReportBundleToTestResults', () => {
    it('should map single bundle to test results', () => {
      const mockBundle = {
        resourceType: 'Bundle' as const,
        type: 'collection' as const,
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport' as const,
              id: 'report-1',
              status: 'final' as const,
              code: { text: 'CBC' },
            },
          },
          {
            resource: {
              resourceType: 'Observation' as const,
              id: 'obs-1',
              status: 'final' as const,
              code: { text: 'Hemoglobin' },
              valueQuantity: { value: 14.5, unit: 'g/dL' },
            },
          },
        ],
      };

      const result = mapDiagnosticReportBundleToTestResults(
        mockBundle,
        mockTranslate,
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result![0].TestName).toBe('Hemoglobin');
    });

    it('should return undefined for bundle without diagnostic report', () => {
      const mockBundle = {
        resourceType: 'Bundle' as const,
        type: 'collection' as const,
        entry: [
          {
            resource: {
              resourceType: 'Observation' as const,
              id: 'obs-1',
              status: 'final' as const,
              code: { text: 'Hemoglobin' },
            },
          },
        ],
      };

      const result = mapDiagnosticReportBundleToTestResults(
        mockBundle,
        mockTranslate,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined bundle', () => {
      const result = mapDiagnosticReportBundleToTestResults(
        undefined,
        mockTranslate,
      );

      expect(result).toBeUndefined();
    });
  });

  describe('extractObservationsFromBundle', () => {
    it('should extract observation resources from bundle', () => {
      const mockBundle = {
        resourceType: 'Bundle' as const,
        type: 'collection' as const,
        entry: [
          {
            resource: {
              resourceType: 'Observation' as const,
              id: 'obs-1',
              status: 'final' as const,
              code: { text: 'Hemoglobin' },
            },
          },
          {
            resource: {
              resourceType: 'DiagnosticReport' as const,
              id: 'report-1',
              status: 'final' as const,
              code: { text: 'Test' },
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('obs-1');
    });

    it('should return empty array for undefined bundle', () => {
      const result = extractObservationsFromBundle(undefined);
      expect(result).toEqual([]);
    });
  });

  describe('formatObservationsAsLabTestResults', () => {
    it('should format observations with quantity values', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'Hemoglobin' },
          valueQuantity: {
            value: 14.5,
            unit: 'g/dL',
          },
          referenceRange: [
            {
              type: {
                coding: [
                  {
                    code: REFERENCE_RANGE_CODE.NORMAL,
                  },
                ],
              },
              low: { value: 12, unit: 'g/dL' },
              high: { value: 16, unit: 'g/dL' },
            },
          ],
          issued: '2025-05-08T12:44:24+00:00',
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result).toHaveLength(1);
      expect(result[0].TestName).toBe('Hemoglobin');
      expect(result[0].value).toBe('14.5');
      expect(result[0].unit).toBe('g/dL');
      expect(result[0].referenceRange).toBe('12 - 16');
    });

    it('should handle string values', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'Blood Type' },
          valueString: 'O+',
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result[0].value).toBe('O+');
      expect(result[0].unit).toBe('');
    });

    it('should handle boolean values - true as Positive', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'COVID-19 Test' },
          valueBoolean: true,
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result[0].value).toBe('Positive');
      expect(result[0].unit).toBe('');
    });

    it('should handle boolean values - false as Negative', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'COVID-19 Test' },
          valueBoolean: false,
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result[0].value).toBe('Negative');
      expect(result[0].unit).toBe('');
    });

    it('should handle integer values', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'White Blood Cell Count' },
          valueInteger: 8500,
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result[0].value).toBe('8500');
      expect(result[0].unit).toBe('');
    });

    it('should handle CodeableConcept text values', () => {
      const mockObservations = [
        {
          resourceType: 'Observation' as const,
          id: 'obs-1',
          status: 'final' as const,
          code: { text: 'Test Result' },
          valueCodeableConcept: {
            text: 'Abnormal',
          },
        },
      ];

      const result = formatObservationsAsLabTestResults(
        mockObservations,
        mockTranslate,
      );

      expect(result[0].value).toBe('Abnormal');
      expect(result[0].unit).toBe('');
    });
  });

  describe('updateTestsWithResults', () => {
    it('should update tests with results from map', () => {
      const tests: FormattedLabInvestigations[] = [
        {
          id: 'test-1',
          testName: 'Blood Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const resultsMap = new Map();
      resultsMap.set('test-1', [
        {
          status: 'final',
          TestName: 'Hemoglobin',
          Result: '14.5 g/dL',
          referenceRange: '12-16 g/dL',
          reportedOn: 'May 8, 2025',
          actions: '',
        },
      ]);

      const result = updateTestsWithResults(tests, resultsMap);

      expect(result[0].result).toBeDefined();
      expect(Array.isArray(result[0].result)).toBe(true);
    });

    it('should not modify tests without results', () => {
      const tests: FormattedLabInvestigations[] = [
        {
          id: 'test-1',
          testName: 'Blood Test',
          priority: LabInvestigationPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const resultsMap = new Map();

      const result = updateTestsWithResults(tests, resultsMap);

      expect(result[0].result).toBeUndefined();
    });
  });
});
