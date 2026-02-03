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
} from './models';

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

export function getProcessedTestIds(
  diagnosticReports: DiagnosticReport[] | undefined,
): string[] {
  if (!diagnosticReports || diagnosticReports.length === 0) return [];

  const testIds = new Set<string>();

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
      // Extract test IDs from basedOn references
      report?.basedOn?.forEach((ref) => {
        const testId = ref.reference?.split('/').pop();
        if (testId) {
          testIds.add(testId);
        }
      });
    });

  return Array.from(testIds);
}

/**
 * Creates a mapping from test IDs to report IDs for processed diagnostic reports
 */
export function getTestIdToReportIdMap(
  diagnosticReports: DiagnosticReport[] | undefined,
): Map<string, string> {
  const testIdToReportId = new Map<string, string>();

  if (!diagnosticReports || diagnosticReports.length === 0)
    return testIdToReportId;

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

      // Map test IDs from basedOn references to this report ID
      report?.basedOn?.forEach((ref) => {
        const testId = ref.reference?.split('/').pop();
        if (testId) {
          testIdToReportId.set(testId, reportId);
        }
      });
    });

  return testIdToReportId;
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

export function formatObservationsAsLabTestResults(
  observations: Observation[],
  t: (key: string) => string,
): LabTestResult[] {
  return observations.map((obs) => {
    const testName = obs.code?.text ?? obs.code?.coding?.[0]?.display ?? '';

    // Determine result value with unit
    // FHIR Observation.value[x] handled types: valueQuantity, valueCodeableConcept,valueString, valueBoolean, valueInteger
    let result = '';
    if (obs.valueQuantity?.value !== undefined) {
      // Quantitative result with optional unit (e.g., "5.8 mmol/L")
      const value = obs.valueQuantity.value.toString();
      const unit = obs.valueQuantity.unit ?? '';
      result = unit ? `${value} ${unit}` : value;
    } else if (obs.valueBoolean !== undefined) {
      result = obs.valueBoolean ? 'Positive' : 'Negative';
    } else if (obs.valueInteger !== undefined) {
      result = obs.valueInteger.toString();
    } else if (obs.valueString) {
      result = obs.valueString;
    } else if (obs.valueCodeableConcept?.text) {
      result = obs.valueCodeableConcept.text;
    } else if (obs.valueCodeableConcept?.coding?.[0]?.display) {
      result = obs.valueCodeableConcept.coding[0].display;
    }

    //TODO: test when api returns referenceRange.
    const referenceRange =
      obs.referenceRange
        ?.map((range) => {
          const low = range.low?.value;
          const high = range.high?.value;
          const rangeUnit = range.low?.unit ?? range.high?.unit ?? '';
          if (low !== undefined && high !== undefined) {
            return `${low} - ${high} ${rangeUnit}`.trim();
          } else if (low !== undefined) {
            return `> ${low} ${rangeUnit}`.trim();
          } else if (high !== undefined) {
            return `< ${high} ${rangeUnit}`.trim();
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
      Result: result,
      referenceRange,
      reportedOn,
      actions: '', // Actions are typically not part of the observation resource
      interpretation,
    };
  });
}

export function mapDiagnosticReportBundlesToTestResults(
  bundles: (Bundle | undefined)[],
  t: (key: string) => string,
): Map<string, LabTestResult[]> {
  const resultsMap = new Map<string, LabTestResult[]>();

  bundles.forEach((bundle) => {
    if (!bundle?.entry) return;

    // Find the DiagnosticReport resource in the bundle
    const diagnosticReportEntry = bundle.entry.find(
      (entry) => entry.resource?.resourceType === 'DiagnosticReport',
    );
    const diagnosticReport = diagnosticReportEntry?.resource as
      | DiagnosticReport
      | undefined;

    if (!diagnosticReport?.basedOn) return;

    // Extract the test/ServiceRequest ID from the basedOn reference
    diagnosticReport.basedOn.forEach((ref) => {
      const testId = ref.reference?.split('/').pop();
      if (!testId) return;

      const observations = extractObservationsFromBundle(bundle);
      const results = formatObservationsAsLabTestResults(observations, t);
      if (results.length > 0) {
        resultsMap.set(testId, results);
      }
    });
  });

  return resultsMap;
}

/**
 * Maps a single diagnostic report bundle to test results
 * @param bundle - DiagnosticReport bundle with observations
 * @param t - Translation function
 * @returns Array of LabTestResult or undefined if no valid results
 */
export function mapSingleDiagnosticReportBundleToTestResults(
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
