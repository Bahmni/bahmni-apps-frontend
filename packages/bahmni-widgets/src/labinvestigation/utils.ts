import {
  FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL,
  formatDate,
  PROCESSED_REPORT_STATUSES,
} from '@bahmni/services';
import { Bundle, ServiceRequest, DiagnosticReport, Observation } from 'fhir/r4';
import {
  FormattedLabInvestigations,
  LabInvestigationPriority,
  LabInvestigationsByDate,
  LabTestResult,
  Attachment,
} from './models';

export enum REFERENCE_RANGE_CODE {
  NORMAL = 'normal',
}

export function filterLabInvestigationEntries(
  labInvestigationBundle: Bundle<ServiceRequest>,
): ServiceRequest[] {
  if (!labInvestigationBundle.entry) return [];

  const replacedIds = new Set(
    labInvestigationBundle.entry
      .flatMap((entry) => entry.resource?.replaces ?? [])
      .map((ref) => ref.reference?.split('/').pop()) // extract ID from reference like "ServiceRequest/xyz"
      .filter(Boolean), // remove undefined/null
  );

  // Filter out entries that either have a "replaces" field or are being replaced
  const filteredEntries = labInvestigationBundle.entry.filter((entry) => {
    const entryId = entry.resource?.id;
    const isReplacer = entry.resource?.replaces;
    const isReplaced = replacedIds.has(entryId);
    return !isReplacer && !isReplaced;
  });

  const filteredBundle: Bundle<ServiceRequest> = {
    ...labInvestigationBundle,
    entry: filteredEntries,
  };

  const labInvestigations =
    filteredBundle.entry
      ?.map((entry) => entry.resource)
      .filter((r): r is ServiceRequest => r !== undefined) ?? [];

  return labInvestigations;
}

/**
 * Maps a FHIR priority code to LabInvestigationPriority enum
 **/
export const mapLabInvestigationPriority = (
  labTest: ServiceRequest,
): LabInvestigationPriority => {
  switch (labTest.priority) {
    case 'routine':
      return LabInvestigationPriority.routine;
    case 'stat':
      return LabInvestigationPriority.stat;
    default:
      return LabInvestigationPriority.routine;
  }
};

export const determineInvestigationType = (labTest: ServiceRequest): string => {
  // Check if the test has an extension that indicates it's a panel
  const panelExtension = labTest.extension?.find(
    (ext) =>
      ext.url === FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL &&
      ext.valueString === 'Panel',
  );

  if (panelExtension) {
    return 'Panel';
  }

  // If it's not a panel, it's a single test
  return 'Single Test';
};

export function formatLabInvestigations(
  labInvestigations: ServiceRequest[],
  t: (key: string) => string,
): FormattedLabInvestigations[] {
  return labInvestigations.map((labTest) => {
    const priority = mapLabInvestigationPriority(labTest);
    const orderedDate = labTest.occurrencePeriod?.start;
    let formattedDate;
    if (orderedDate) {
      const dateFormatResult = formatDate(orderedDate, t, 'MMMM d, yyyy');
      formattedDate =
        dateFormatResult.formattedResult || orderedDate.split('T')[0];
    }

    const testType = determineInvestigationType(labTest);
    const note = labTest.note?.[0]?.text;

    return {
      id: labTest.id!,
      testName: labTest.code?.text ?? '',
      priority,
      orderedBy: labTest.requester?.display ?? '',
      orderedDate: orderedDate ?? '',
      formattedDate: formattedDate ?? '',
      // Result would typically come from a separate Observation resource
      result: undefined,
      testType,
      note,
    };
  });
}

export function groupLabInvestigationsByDate(
  labTests: FormattedLabInvestigations[],
): LabInvestigationsByDate[] {
  const dateMap = new Map<string, LabInvestigationsByDate>();

  labTests.forEach((labTest) => {
    const dateKey = labTest.orderedDate.split('T')[0]; // Get YYYY-MM-DD part

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: labTest.formattedDate,
        rawDate: labTest.orderedDate,
        tests: [],
      });
    }

    dateMap.get(dateKey)?.tests.push(labTest);
  });

  // Sort by date (newest first)
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
  );
}

/**
 * Sorts tests within each date group to show urgent tests first
 */
export function sortLabInvestigationsByPriority(
  labTestsByDate: LabInvestigationsByDate[],
): LabInvestigationsByDate[] {
  return labTestsByDate.map((group) => ({
    ...group,
    tests: [...group.tests].sort((a, b) => {
      // Urgent tests first, then routine
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
      if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
      return 0;
    }),
  }));
}

/**
 * Enriches lab investigation tests with diagnostic report information (reportId and attachments)
 * @param tests - Array of formatted lab tests
 * @param diagnosticReports - Array of diagnostic reports
 * @returns Enriched array of tests with reportId and attachments populated
 */
export function updateInvestigationsWithReportInfo(
  tests: FormattedLabInvestigations[],
  diagnosticReports: DiagnosticReport[] | undefined,
): FormattedLabInvestigations[] {
  if (!diagnosticReports || diagnosticReports.length === 0) {
    return tests;
  }

  // Build a map of test IDs to report info in a single pass
  const testIdToReportInfo = new Map<
    string,
    { reportId: string; attachments?: Attachment[] }
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

      // Extract test IDs from basedOn references and map to report info
      report?.basedOn?.forEach((ref) => {
        const testId = ref.reference?.split('/').pop();
        if (testId) {
          testIdToReportInfo.set(testId, {
            reportId,
            attachments,
          });
        }
      });
    });

  // Enrich tests with report info
  return tests.map((test) => {
    const reportInfo = testIdToReportInfo.get(test.id);
    if (reportInfo) {
      return {
        ...test,
        reportId: reportInfo.reportId,
        attachments: reportInfo.attachments,
      };
    }
    return test;
  });
}

export function extractDiagnosticReportsFromBundle(
  bundle: Bundle<DiagnosticReport> | undefined,
): DiagnosticReport[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .filter((entry) => entry.resource?.resourceType === 'DiagnosticReport')
    .map((entry) => entry.resource as DiagnosticReport)
    .filter((report): report is DiagnosticReport => !!report);
}

export function extractObservationsFromBundle(
  bundle: Bundle | undefined,
): Observation[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .filter((entry) => entry.resource?.resourceType === 'Observation')
    .map((entry) => entry.resource as Observation)
    .filter((obs): obs is Observation => !!obs);
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

export function formatObservationsAsLabTestResults(
  observations: Observation[],
  t: (key: string) => string,
): LabTestResult[] {
  return observations.map((obs) => {
    const testName = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? '';

    // Determine result value with unit
    // FHIR Observation.value[x] handled types: valueQuantity, valueCodeableConcept,valueString, valueBoolean, valueInteger
    let value = '';
    let unit = '';
    if (obs.valueQuantity?.value !== undefined) {
      // Quantitative result with optional unit (e.g., "5.8 mmol/L")
      value = obs.valueQuantity.value.toString();
      unit = obs.valueQuantity.unit ?? '';
    } else if (obs.valueBoolean !== undefined) {
      value = obs.valueBoolean ? 'Positive' : 'Negative';
    } else if (obs.valueInteger !== undefined) {
      value = obs.valueInteger.toString();
    } else if (obs.valueString) {
      value = obs.valueString;
    } else if (obs.valueCodeableConcept?.text) {
      value = obs.valueCodeableConcept.text;
    } else if (obs.valueCodeableConcept?.coding?.[0]?.display) {
      value = obs.valueCodeableConcept.coding[0].display;
    }

    const referenceRange =
      obs.referenceRange
        ?.filter((range) => {
          // Only include reference ranges with code "normal"
          return range.type?.coding?.some(
            (coding) => coding.code === REFERENCE_RANGE_CODE.NORMAL,
          );
        })
        .map((range) => {
          const low = range.low?.value;
          const high = range.high?.value;
          if (low !== undefined && high !== undefined) {
            return `${low} - ${high}`;
          } else if (low !== undefined) {
            return `> ${low}`;
          } else if (high !== undefined) {
            return `< ${high}`;
          }
          return range.text ?? '';
        })
        .join(', ') ?? '';

    const reportedOn = obs.issued
      ? formatDate(obs.issued, t, 'MMMM d, yyyy').formattedResult || obs.issued
      : '';

    // Extract interpretation code (e.g., "A" for abnormal, "N" for normal, "H" for high, "L" for low)
    // FHIR interpretation is an array of CodeableConcept
    const interpretation = obs.interpretation?.[0]?.coding?.[0]?.code;

    return {
      status: obs.status || '',
      TestName: testName,
      value,
      unit,
      referenceRange,
      reportedOn,
      actions: '', // Actions are typically not part of the observation resource
      interpretation,
    };
  });
}

/**
 * Maps a single diagnostic report bundle to test results
 * @param bundle - DiagnosticReport bundle with observations
 * @param t - Translation function
 * @returns Array of LabTestResult or undefined if no valid results
 */
export function mapDiagnosticReportBundleToTestResults(
  bundle: Bundle | undefined,
  t: (key: string) => string,
): LabTestResult[] | undefined {
  if (!bundle?.entry) return undefined;

  // Find the DiagnosticReport resource in the bundle
  const diagnosticReportEntry = bundle.entry.find(
    (entry) => entry.resource?.resourceType === 'DiagnosticReport',
  );
  const diagnosticReport = diagnosticReportEntry?.resource as
    | DiagnosticReport
    | undefined;

  if (!diagnosticReport) return undefined;

  const observations = extractObservationsFromBundle(bundle);
  const results = formatObservationsAsLabTestResults(observations, t);

  // Extract attachments from the diagnostic report
  const attachments = extractAttachmentsFromDiagnosticReport(diagnosticReport);

  // For single test results, add the first attachment (if available)
  // This assumes a single test will have at most one attachment
  if (attachments && attachments.length > 0 && results.length > 0) {
    return results.map((result) => ({
      ...result,
      attachment: attachments[0],
    }));
  }

  return results.length > 0 ? results : undefined;
}

/**
 * Updates tests with results from diagnostic report bundles
 * @param tests - Array of formatted lab tests
 * @param resultsMap - Map of test ID to LabTestResult arrays
 * @returns Updated array of tests with results
 */
export function updateTestsWithResults(
  tests: FormattedLabInvestigations[],
  resultsMap: Map<string, LabTestResult[]>,
): FormattedLabInvestigations[] {
  return tests.map((test) => {
    const results = resultsMap.get(test.id);
    if (results) {
      return {
        ...test,
        result: results,
      };
    }
    return test;
  });
}
