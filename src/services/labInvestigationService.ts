import { get } from './api';
import { PATIENT_LAB_INVESTIGATION_RESOURCE_URL } from '@constants/app';
import {
  FhirLabTest,
  FhirLabTestBundle,
  FormattedLabTest,
  LabTestStatus,
  LabTestPriority,
  LabTestsByDate,
} from '@types/labInvestigation';
import { getFormattedError } from '@utils/common';
import { formatDate } from '@utils/date';
import notificationService from './notificationService';

/**
 * Maps a FHIR status code to LabTestStatus enum
 */
const mapLabTestStatus = (labTest: FhirLabTest): LabTestStatus => {
  switch (labTest.status) {
    case 'Pending':
      return LabTestStatus.Pending;
    case 'Abnormal':
      return LabTestStatus.Abnormal;
    case 'Normal':
      return LabTestStatus.Normal;
    default:
      return LabTestStatus.Normal;
  }
};

/**
 * Maps a FHIR priority code to LabTestPriority enum
 */
const mapLabTestPriority = (labTest: FhirLabTest): LabTestPriority => {
  console.log('Raw priority from API:', labTest.priority);
  
  let mappedPriority;
  switch (labTest.priority) {
    case 'routine':
      mappedPriority = LabTestPriority.routine;
      break;
    case 'stat':
      mappedPriority = LabTestPriority.stat;
      break;
    default:
      mappedPriority = LabTestPriority.routine;
  }
  
  console.log('Mapped priority:', mappedPriority);
  return mappedPriority;
};

/**
 * Fetches lab tests for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirLabTestBundle
 */
export async function getPatientLabTestsBundle(
  patientUUID: string,
): Promise<FhirLabTestBundle> {
  return await get<FhirLabTestBundle>(
    `${PATIENT_LAB_INVESTIGATION_RESOURCE_URL(patientUUID)}`,
  );
}

/**
 * Fetches lab tests for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirLabTest
 */
export async function getLabTests(
  patientUUID: string,
): Promise<FhirLabTest[]> {
  try {
    const fhirLabTestBundle = await getPatientLabTestsBundle(patientUUID);
    return fhirLabTestBundle.entry?.map((entry) => entry.resource) || [];
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Formats FHIR lab tests into a more user-friendly format
 * @param labTests - The FHIR lab test array to format
 * @returns An array of formatted lab test objects
 */
export function formatLabTests(
  labTests: FhirLabTest[],
): FormattedLabTest[] {
  try {
    return labTests.map((labTest) => {
      const status = mapLabTestStatus(labTest);
      const priority = mapLabTestPriority(labTest);
      const orderedDate = labTest.occurrencePeriod.start;
      const dateFormatResult = formatDate(orderedDate);
      const formattedDate = dateFormatResult.formattedResult || orderedDate.split('T')[0];
      
      return {
        id: labTest.id,
        testName: labTest.code.text,
        status,
        priority,
        orderedBy: labTest.requester.display,
        orderedDate,
        formattedDate,
        // Result would typically come from a separate Observation resource
        result: undefined,
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Groups lab tests by date
 * @param labTests - The formatted lab tests to group
 * @returns An array of lab tests grouped by date
 */
export function groupLabTestsByDate(
  labTests: FormattedLabTest[],
): LabTestsByDate[] {
  try {
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
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Fetches and formats lab tests for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of lab tests grouped by date
 */
export async function getPatientLabTestsByDate(
  patientUUID: string,
): Promise<LabTestsByDate[]> {
  try {
    const labTests = await getLabTests(patientUUID);
    const formattedLabTests = formatLabTests(labTests);
    return groupLabTestsByDate(formattedLabTests);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

export default {
  getLabTests,
  formatLabTests,
  groupLabTestsByDate,
  getPatientLabTestsByDate,
};
