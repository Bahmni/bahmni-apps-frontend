import {
  FormattedLabInvestigations,
  LabInvestigationPriority,
} from '../../labinvestigation/models';
import { updateInvestigationsWithReportInfo } from '../Investigations';

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
