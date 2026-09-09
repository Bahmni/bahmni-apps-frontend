import { PROCESSED_REPORT_STATUSES } from '@bahmni/services';
import { Bundle, DiagnosticReport } from 'fhir/r4';
import {
  FormattedLabInvestigations,
  Attachment,
} from '../labinvestigation/models';
import { RadiologyInvestigationViewModel } from '../radiologyInvestigation/models';

export function extractDiagnosticReportsFromBundle(
  bundle: Bundle<DiagnosticReport> | undefined,
): DiagnosticReport[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .filter((entry) => entry.resource?.resourceType === 'DiagnosticReport')
    .map((entry) => entry.resource as DiagnosticReport)
    .filter((report): report is DiagnosticReport => !!report);
}

/**
 * Enriches lab investigation tests with diagnostic report information (reportId and attachments)
 * @param tests - Array of formatted lab tests
 * @param diagnosticReports - Array of diagnostic reports
 * @returns Enriched array of tests with reportId and attachments populated
 */

export function updateInvestigationsWithReportInfo(
  tests: FormattedLabInvestigations[] | RadiologyInvestigationViewModel[],
  diagnosticReports: DiagnosticReport[] | undefined,
): FormattedLabInvestigations[] | RadiologyInvestigationViewModel[] {
  if (!diagnosticReports || diagnosticReports.length === 0) {
    return tests;
  }

  // Build a map of test IDs to report info in a single pass
  // Now stores arrays of report info to support multiple reports per test
  const testIdToReportInfo = new Map<
    string,
    {
      reportId: string;
      attachments?: Attachment[];
      reportedBy?: string;
      reportedDate?: string;
    }[]
  >();

  diagnosticReports
    .filter((report) => {
      return (
        report?.status &&
        PROCESSED_REPORT_STATUSES.includes(
          report.status as (typeof PROCESSED_REPORT_STATUSES)[number],
        )
      );
    })
    .forEach((report) => {
      const reportId = report?.id;
      if (!reportId) return;

      const attachments = extractAttachmentsFromDiagnosticReport(report);
      const { issued: reportedDate } = report;
      const reportedBy = report.performer?.[0].display ?? '-';

      // Extract test IDs from basedOn references and map to report info
      report?.basedOn?.forEach((ref) => {
        const testId = ref.reference?.split('/').pop();
        if (testId) {
          const reportInfo = {
            reportId,
            attachments,
            reportedDate,
            reportedBy,
          };

          // Add to array of reports for this test
          const existingReports = testIdToReportInfo.get(testId) ?? [];
          testIdToReportInfo.set(testId, [...existingReports, reportInfo]);
        }
      });
    });

  // return tests with report info
  return tests.map((test) => {
    const reportInfoArray = testIdToReportInfo.get(test.id);
    if (reportInfoArray && reportInfoArray.length > 0) {
      // Collect all reportIds
      const reportIds = reportInfoArray.map((info) => info.reportId);

      // Merge all attachments from all reports
      const allAttachments = reportInfoArray.flatMap(
        (info) => info.attachments ?? [],
      );

      // Use the most recent report's metadata (last in array)
      const latestReport = reportInfoArray.at(-1)!;

      return {
        ...test,
        reportIds,
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
        reportedDate: latestReport.reportedDate,
        reportedBy: latestReport.reportedBy,
      };
    }
    return test;
  });
}

/**
 * Extracts attachments from DiagnosticReport's presentedForm array
 * @param diagnosticReport - The diagnostic report resource
 * @returns Array of attachments or undefined if none exist
 */

export function extractAttachmentsFromDiagnosticReport(
  diagnosticReport: DiagnosticReport | undefined,
): Attachment[] | undefined {
  if (
    !diagnosticReport?.presentedForm ||
    diagnosticReport.presentedForm.length === 0
  ) {
    return undefined;
  }

  const attachments = diagnosticReport.presentedForm
    .filter((form) => form.url) // Only include forms that have a URL
    .map((form) => ({
      url: form.url!,
      id: form.id!,
      contentType: form.contentType,
    }));

  return attachments.length > 0 ? attachments : undefined;
}
