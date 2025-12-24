import { ServiceRequest, Bundle } from 'fhir/r4';
import { get } from '../../api';
import { formatDate } from '../../date';
import { useTranslation } from '../../i18n';
import {
  getLabTests,
  formatLabTests,
  groupLabTestsByDate,
  mapLabTestPriority,
  determineTestType,
  filterLabTestEntries,
} from '../labInvestigationService';
import { LabTestPriority, FormattedLabTest } from '../models';

jest.mock('../../api');
jest.mock('../../date');
jest.mock('../../i18n', () => ({
  useTranslation: jest.fn(),
}));

// Mock useTranslation
const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('labInvestigationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (formatDate as jest.Mock).mockImplementation((date, format) => ({
      formattedResult: date.includes('2025-05-08')
        ? 'May 8, 2025'
        : 'April 9, 2025',
    }));
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    });
  });

  const patientUUID = '58493859-63f7-48b6-bd0b-698d5a119a21';
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

  describe('mapLabTestPriority', () => {
    it('should map routine priority correctly', () => {
      const labTest = createMockServiceRequest({ priority: 'routine' });
      const result = mapLabTestPriority(labTest);
      expect(result).toBe(LabTestPriority.routine);
    });

    it('should map stat priority correctly', () => {
      const labTest = createMockServiceRequest({ priority: 'stat' });
      const result = mapLabTestPriority(labTest);
      expect(result).toBe(LabTestPriority.stat);
    });

    it('should default to routine for undefined priority', () => {
      const labTest = createMockServiceRequest({ priority: undefined });
      const result = mapLabTestPriority(labTest);
      expect(result).toBe(LabTestPriority.routine);
    });

    it('should default to routine for unknown priority', () => {
      const labTest = createMockServiceRequest({ priority: 'urgent' });
      const result = mapLabTestPriority(labTest);
      expect(result).toBe(LabTestPriority.routine);
    });
  });

  describe('determineTestType', () => {
    it('should identify Panel test type', () => {
      const labTest = createMockServiceRequest({
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
            valueString: 'Panel',
          },
        ],
      });
      const result = determineTestType(labTest);
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
      const result = determineTestType(labTest);
      expect(result).toBe('Single Test');
    });

    it('should default to Single Test when no extension', () => {
      const labTest = createMockServiceRequest({ extension: undefined });
      const result = determineTestType(labTest);
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
      const result = determineTestType(labTest);
      expect(result).toBe('Single Test');
    });
  });

  describe('filterLabTestEntries', () => {
    it('should return empty array when bundle has no entries', () => {
      const emptyBundle = createMockBundle([]);
      const result = filterLabTestEntries(emptyBundle);
      expect(result).toEqual([]);
    });

    it('should return all entries when none have replaces field', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({ id: 'test-2' }),
        createMockServiceRequest({ id: 'test-3' }),
      ]);

      const result = filterLabTestEntries(mockBundle);

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

      const result = filterLabTestEntries(mockBundle);

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

      const result = filterLabTestEntries(mockBundle);

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

      const result = filterLabTestEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-3');
    });

    it('should handle chain of replacements', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({
          id: 'test-2',
          replaces: [{ reference: 'ServiceRequest/test-1' }],
        }),
        createMockServiceRequest({
          id: 'test-3',
          replaces: [{ reference: 'ServiceRequest/test-2' }],
        }),
        createMockServiceRequest({ id: 'test-4' }),
      ]);

      const result = filterLabTestEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-4');
    });

    it('should handle replaces with invalid reference format', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({
          id: 'test-2',
          replaces: [{ reference: 'invalid-reference' }],
        }),
      ]);

      const result = filterLabTestEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('should handle replaces with empty reference', () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
        createMockServiceRequest({
          id: 'test-2',
          replaces: [{ reference: '' }],
        }),
      ]);

      const result = filterLabTestEntries(mockBundle);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });
  });

  describe('getLabTests', () => {
    it('should return array of service requests', async () => {
      const mockBundle = createMockBundle([
        createMockServiceRequest({ id: 'test-1' }),
      ]);

      (get as jest.Mock).mockResolvedValue(mockBundle);

      const result = await getLabTests(patientUUID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('should handle empty results', async () => {
      const emptyBundle = createMockBundle([]);
      (get as jest.Mock).mockResolvedValue(emptyBundle);

      const result = await getLabTests(patientUUID);

      expect(result).toEqual([]);
    });
  });

  describe('formatLabTests', () => {
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

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'test-1',
        testName: 'Blood Test',
        priority: LabTestPriority.routine,
        orderedBy: 'Dr. Smith',
        orderedDate: '2025-05-08T12:44:24+00:00',
        formattedDate: 'May 8, 2025',
        result: undefined,
        testType: 'Single Test',
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

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result[0].testName).toBe('');
      expect(result[0].orderedBy).toBe('');
      expect(result[0].orderedDate).toBe('');
      expect(result[0].formattedDate).toBe('');
    });

    it('should filter out tests without id', () => {
      const mockTests = [
        createMockServiceRequest({ id: undefined }),
        createMockServiceRequest({ id: 'test-1' }),
      ];

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('should handle date formatting fallback', () => {
      (formatDate as jest.Mock).mockReturnValue({ formattedResult: null });

      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          occurrencePeriod: { start: '2025-05-08T12:44:24+00:00' },
        }),
      ];

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result[0].formattedDate).toBe('2025-05-08');
    });

    it('should extract note when present', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          note: [{ text: 'Patient should be fasting' }],
        }),
      ];

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result[0].note).toBe('Patient should be fasting');
    });

    it('should handle missing note', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          note: undefined,
        }),
      ];

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result[0].note).toBeUndefined();
    });

    it('should handle empty note array', () => {
      const mockTests = [
        createMockServiceRequest({
          id: 'test-1',
          note: [],
        }),
      ];

      const result = formatLabTests(mockTests, mockUseTranslation().t);

      expect(result[0].note).toBeUndefined();
    });
  });

  describe('groupLabTestsByDate', () => {
    it('should group tests by date', () => {
      const mockFormattedTests: FormattedLabTest[] = [
        {
          id: 'test-1',
          testName: 'Test 1',
          priority: LabTestPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T12:44:24+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
        {
          id: 'test-2',
          testName: 'Test 2',
          priority: LabTestPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-05-08T14:30:00+00:00',
          formattedDate: 'May 8, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const result = groupLabTestsByDate(mockFormattedTests);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('May 8, 2025');
      expect(result[0].tests).toHaveLength(2);
    });

    it('should sort dates newest first', () => {
      const mockFormattedTests: FormattedLabTest[] = [
        {
          id: 'test-1',
          testName: 'Old Test',
          priority: LabTestPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-01-01T00:00:00+00:00',
          formattedDate: 'Jan 1, 2025',
          result: undefined,
          testType: 'Single Test',
        },
        {
          id: 'test-2',
          testName: 'New Test',
          priority: LabTestPriority.routine,
          orderedBy: 'Dr. Smith',
          orderedDate: '2025-12-31T00:00:00+00:00',
          formattedDate: 'Dec 31, 2025',
          result: undefined,
          testType: 'Single Test',
        },
      ];

      const result = groupLabTestsByDate(mockFormattedTests);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('Dec 31, 2025');
      expect(result[1].date).toBe('Jan 1, 2025');
    });

    it('should handle empty array', () => {
      const result = groupLabTestsByDate([]);
      expect(result).toEqual([]);
    });
  });
});
