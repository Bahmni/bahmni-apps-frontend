import { Bundle, DiagnosticReport } from 'fhir/r4';
import { get } from '../../api';
import {
  DIAGNOSTIC_REPORTS_URL,
  DIAGNOSTIC_REPORT_BUNDLE_URL,
} from '../constants';
import {
  getDiagnosticReports,
  getDiagnosticReportBundle,
} from '../diagnosticReportService';

jest.mock('../../api');

describe('diagnosticReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('getDiagnosticReports', () => {
    const patientUuid = '02f47490-d657-48ee-98e7-4c9133ea168b';

    const createMockDiagnosticReport = (
      overrides: Partial<DiagnosticReport> = {},
    ): DiagnosticReport => ({
      resourceType: 'DiagnosticReport',
      id: 'report-1',
      status: 'final',
      code: {
        text: 'Blood Test',
        coding: [
          {
            system: 'http://loinc.org',
            code: '58410-2',
            display: 'Complete blood count',
          },
        ],
      },
      subject: {
        reference: 'Patient/test-patient',
        display: 'Test Patient',
      },
      effectiveDateTime: '2025-03-25T06:48:32+00:00',
      ...overrides,
    });

    const createMockBundle = (
      diagnosticReports: DiagnosticReport[] = [],
    ): Bundle<DiagnosticReport> => ({
      resourceType: 'Bundle',
      id: 'bundle-id',
      type: 'searchset',
      total: diagnosticReports.length,
      entry: diagnosticReports.map((report) => ({
        resource: report,
        fullUrl: `http://example.com/DiagnosticReport/${report.id}`,
      })),
    });

    it('should return diagnostic reports bundle for valid inputs', async () => {
      const mockReports = [
        createMockDiagnosticReport({
          id: 'report-1',
          code: { text: 'Blood Test' },
        }),
        createMockDiagnosticReport({
          id: 'report-2',
          code: { text: 'Urine Test' },
        }),
      ];
      const mockBundle = createMockBundle(mockReports);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const serviceRequestIds = ['service-1', 'service-2'];
      const result = await getDiagnosticReports(patientUuid, serviceRequestIds);

      expect(result).toEqual(mockBundle);
      expect(result.entry).toHaveLength(2);
      expect(result.entry?.[0].resource?.id).toBe('report-1');
      expect(result.entry?.[1].resource?.id).toBe('report-2');
    });

    it('should format single service request ID correctly', async () => {
      const mockBundle = createMockBundle([createMockDiagnosticReport()]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const serviceRequestIds = ['service-123'];
      await getDiagnosticReports(patientUuid, serviceRequestIds);

      const expectedUrl = DIAGNOSTIC_REPORTS_URL(patientUuid, 'service-123');
      expect(get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should format multiple service request IDs correctly (comma-separated)', async () => {
      const mockBundle = createMockBundle([createMockDiagnosticReport()]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const serviceRequestIds = ['service-1', 'service-2', 'service-3'];
      await getDiagnosticReports(patientUuid, serviceRequestIds);

      const expectedUrl = DIAGNOSTIC_REPORTS_URL(
        patientUuid,
        'service-1,service-2,service-3',
      );
      expect(get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should call API with correct URL parameters', async () => {
      const mockBundle = createMockBundle([createMockDiagnosticReport()]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const testPatientUuid = 'patient-uuid-123';
      const serviceRequestIds = ['order-1', 'order-2'];

      await getDiagnosticReports(testPatientUuid, serviceRequestIds);

      expect(get).toHaveBeenCalledTimes(1);
      const expectedUrl = DIAGNOSTIC_REPORTS_URL(
        testPatientUuid,
        'order-1,order-2',
      );
      expect(get).toHaveBeenCalledWith(expectedUrl);
    });

    it('should handle bundle with entries', async () => {
      const mockReports = [
        createMockDiagnosticReport({ id: 'report-1' }),
        createMockDiagnosticReport({ id: 'report-2' }),
        createMockDiagnosticReport({ id: 'report-3' }),
      ];
      const mockBundle = createMockBundle(mockReports);

      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const result = await getDiagnosticReports(patientUuid, ['service-1']);

      expect(result.entry).toBeDefined();
      expect(result.entry).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should handle bundle without entry field', async () => {
      const bundleWithoutEntries: Bundle<DiagnosticReport> = {
        resourceType: 'Bundle',
        id: 'bundle-id',
        type: 'searchset',
        total: 0,
      };

      (get as jest.Mock).mockResolvedValueOnce(bundleWithoutEntries);

      const result = await getDiagnosticReports(patientUuid, ['service-1']);

      expect(result.entry).toBeUndefined();
      expect(result.total).toBe(0);
    });

    it('should fetch all diagnostic reports when called without serviceRequestIds', async () => {
      const mockBundle = createMockBundle([createMockDiagnosticReport()]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      await getDiagnosticReports(patientUuid);

      const expectedUrl = DIAGNOSTIC_REPORTS_URL(patientUuid);
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(expectedUrl).not.toContain('based-on');
    });

    it('should fetch all diagnostic reports when called with empty array', async () => {
      const mockBundle = createMockBundle([createMockDiagnosticReport()]);
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      await getDiagnosticReports(patientUuid, []);

      const expectedUrl = DIAGNOSTIC_REPORTS_URL(patientUuid);
      expect(get).toHaveBeenCalledWith(expectedUrl);
      expect(expectedUrl).not.toContain('based-on');
    });
  });

  describe('getDiagnosticReportBundle', () => {
    const createMockBundle = (): Bundle => ({
      resourceType: 'Bundle',
      id: 'bundle-id',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-1',
            status: 'final',
            code: { text: 'Blood Test' },
          },
        },
      ],
    });

    it('should return diagnostic report bundle for valid ID', async () => {
      const mockBundle = createMockBundle();
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const diagnosticReportId = 'report-123';
      const result = await getDiagnosticReportBundle(diagnosticReportId);

      expect(result).toEqual(mockBundle);
      expect(result.resourceType).toBe('Bundle');
      expect(result.entry).toBeDefined();
      expect(result.entry).toHaveLength(1);
    });

    it('should call API with correct URL', async () => {
      const mockBundle = createMockBundle();
      (get as jest.Mock).mockResolvedValueOnce(mockBundle);

      const diagnosticReportId = 'report-456';
      await getDiagnosticReportBundle(diagnosticReportId);

      const expectedUrl = DIAGNOSTIC_REPORT_BUNDLE_URL(diagnosticReportId);
      expect(get).toHaveBeenCalledTimes(1);
      expect(get).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
