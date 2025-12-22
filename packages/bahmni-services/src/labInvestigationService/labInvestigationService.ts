import { Bundle, ServiceRequest } from 'fhir/r4';
import { get } from '../api';
import { formatDate } from '../date';
import {
  PATIENT_LAB_INVESTIGATION_RESOURCE_URL,
  FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL,
} from './constants';
import { FormattedLabTest, LabTestPriority, LabTestsByDate } from './models';

/**
 * Maps a FHIR priority code to LabTestPriority enum
 */
export const mapLabTestPriority = (
  labTest: ServiceRequest,
): LabTestPriority => {
  switch (labTest.priority) {
    case 'routine':
      return LabTestPriority.routine;
    case 'stat':
      return LabTestPriority.stat;
    default:
      return LabTestPriority.routine;
  }
};

function filterLabTestEntries(labTestBundle: Bundle<ServiceRequest>) {
  if (!labTestBundle.entry) return [];

  //Collect all IDs that are being replaced
  const replacedIds = new Set(
    labTestBundle.entry
      .flatMap((entry) => entry.resource?.replaces ?? [])
      .map((ref) => ref.reference?.split('/').pop()) // extract ID from reference like "ServiceRequest/xyz"
      .filter(Boolean), // remove undefined/null
  );

  // Filter out entries that either have a "replaces" field or are being replaced
  return labTestBundle.entry.filter((entry) => {
    const entryId = entry.resource?.id;
    const isReplacer = entry.resource?.replaces;
    const isReplaced = replacedIds.has(entryId);
    return !isReplacer && !isReplaced;
  });
}

/**
 * Fetches lab tests for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirLabTestBundle
 */
export async function getPatientLabTestsBundle(
  patientUUID: string,
): Promise<Bundle<ServiceRequest>> {
  const fhirLabTestBundle = await get<Bundle<ServiceRequest>>(
    `${PATIENT_LAB_INVESTIGATION_RESOURCE_URL(patientUUID)}`,
  );

  const filteredEntries = filterLabTestEntries(fhirLabTestBundle);

  return {
    ...fhirLabTestBundle,
    entry: filteredEntries,
  };
}

/**
 * Fetches lab tests for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirLabTest
 */
export async function getLabTests(
  patientUUID: string,
): Promise<ServiceRequest[]> {
  const fhirLabTestBundle = await getPatientLabTestsBundle(patientUUID);
  return (
    fhirLabTestBundle.entry
      ?.map((entry) => entry.resource)
      .filter((r): r is ServiceRequest => r !== undefined) ?? []
  );
}

/**
 * Determines if a lab test is a panel based on its extension
 * @param labTest - The FHIR lab test to check
 * @returns A string indicating the test type: "Panel", "Single Test", or "X Tests"
 */
export const determineTestType = (labTest: ServiceRequest): string => {
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

/**
 * Formats FHIR lab tests into a more user-friendly format
 * @param labTests - The FHIR lab test array to format
 * @returns An array of formatted lab test objects
 */
export function formatLabTests(
  labTests: ServiceRequest[],
  t: (key: string) => string,
): FormattedLabTest[] {
  return labTests
    .filter(
      (labTest): labTest is ServiceRequest & { id: string } => !!labTest.id,
    )
    .map((labTest) => {
      const priority = mapLabTestPriority(labTest);
      const orderedDate = labTest.occurrencePeriod?.start;
      let formattedDate;
      if (orderedDate) {
        const dateFormatResult = formatDate(orderedDate, t, 'MMMM d, yyyy');
        formattedDate =
          dateFormatResult.formattedResult || orderedDate.split('T')[0];
      }

      const testType = determineTestType(labTest);
      const note = labTest.note?.[0]?.text;

      return {
        id: labTest.id,
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

/**
 * Groups lab tests by date
 * @param labTests - The formatted lab tests to group
 * @returns An array of lab tests grouped by date
 */
export function groupLabTestsByDate(
  labTests: FormattedLabTest[],
): LabTestsByDate[] {
  const dateMap = new Map<string, LabTestsByDate>();

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
 * Fetches and formats lab tests for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of lab tests grouped by date
 */
export async function getPatientLabTestsByDate(
  patientUUID: string,
  t: (key: string) => string,
): Promise<LabTestsByDate[]> {
  const labTests = await getLabTests(patientUUID);
  const formattedLabTests = formatLabTests(labTests, t);
  return groupLabTestsByDate(formattedLabTests);
}

/**
 * Fetches and formats lab investigations for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of lab investigations
 */
export async function getPatientLabInvestigations(
  patientUUID: string,
  t: (key: string) => string,
): Promise<FormattedLabTest[]> {
  const bundle = await getPatientLabTestsBundle(patientUUID);
  const labTests =
    bundle.entry
      ?.map((entry) => entry.resource)
      .filter((r): r is ServiceRequest => r !== undefined) ?? [];
  return formatLabTests(labTests, t);
}
