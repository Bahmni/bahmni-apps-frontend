import { PATIENT_DIAGNOSIS_RESOURCE_URL } from '@constants/app';
import { get } from './api';
import { Coding, Condition as Diagnoses } from 'fhir/r4';
import { DiagnosesByDate, FormattedDiagnosis } from '@/types/diagnosis';
import { formatDate } from '@/utils/date';
import { CERTAINITY_CONCEPTS } from '@/constants/concepts';
import { parseISO, startOfDay, isValid, compareDesc } from 'date-fns';

// Constants for better maintainability
const CONFIRMED_STATUS = 'confirmed';
const PROVISIONAL_STATUS = 'provisional';

/**
 * Fetches diagnoses for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of Diagnoses (Condition resources)
 */
async function getPatientDiagnoses(patientUUID: string): Promise<Diagnoses[]> {
  const url = PATIENT_DIAGNOSIS_RESOURCE_URL(patientUUID);
  return await get<Diagnoses[]>(url);
}

/**
 * Maps a FHIR verification status to DiagnosisCertainty enum
 * @param diagnosis - The FHIR Condition resource
 * @returns The corresponding Coding for certainty
 */
const mapDiagnosisCertainty = (diagnosis: Diagnoses): Coding => {
  const verificationStatus = diagnosis.verificationStatus?.coding?.[0]?.code;

  switch (verificationStatus) {
    case CONFIRMED_STATUS:
      return CERTAINITY_CONCEPTS[0];
    case PROVISIONAL_STATUS:
      return CERTAINITY_CONCEPTS[1];
    default:
      return CERTAINITY_CONCEPTS[1]; // Default to Provisional for any other status
  }
};

/**
 * Validates that a diagnosis has all required fields
 * @param diagnosis - The FHIR Condition resource to validate
 * @returns true if valid, false otherwise
 */
const isValidDiagnosis = (diagnosis: Diagnoses): boolean => {
  return !!(diagnosis.id && diagnosis.code && diagnosis.recordedDate);
};

/**
 * Extracts the date part (YYYY-MM-DD) from an ISO datetime string
 * @param dateTimeString - ISO datetime string
 * @returns Date part as string
 */
const extractDatePart = (dateTimeString: string): string => {
  return dateTimeString.split('T')[0];
};

/**
 * Formats FHIR diagnoses into a more user-friendly format
 * @param diagnoses - The FHIR diagnosis array to format
 * @returns An array of formatted diagnosis objects
 */
function formatDiagnoses(diagnoses: Diagnoses[]): FormattedDiagnosis[] {
  return diagnoses.map((diagnosis) => {
    if (!isValidDiagnosis(diagnosis)) {
      throw new Error('Incomplete diagnosis data');
    }

    const certainty = mapDiagnosisCertainty(diagnosis);
    const recordedDate = diagnosis.recordedDate as string;
    const formattedDate = formatDate(recordedDate);

    if (formattedDate.error) {
      throw new Error('Invalid recorded date format');
    }

    return {
      id: diagnosis.id as string,
      display: diagnosis.code?.text || '',
      certainty,
      recordedDate,
      formattedDate: formattedDate.formattedResult,
      recorder: diagnosis.recorder?.display || '',
    };
  });
}

/**
 * Groups diagnoses by date only (no recorder grouping)
 * @param diagnoses - The formatted diagnoses to group
 * @returns An array of diagnoses grouped by date
 */
function groupDiagnosesByDate(
  diagnoses: FormattedDiagnosis[],
): DiagnosesByDate[] {
  const dateMap = new Map<string, DiagnosesByDate>();

  diagnoses.forEach((diagnosis) => {
    const dateKey = extractDatePart(diagnosis.recordedDate);

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: diagnosis.formattedDate,
        rawDate: diagnosis.recordedDate,
        diagnoses: [], // Direct list of diagnoses, no recorder grouping
      });
    }

    const dateGroup = dateMap.get(dateKey) as DiagnosesByDate;
    dateGroup.diagnoses.push(diagnosis);
  });

  // Sort by date (newest first)
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
  );
}

/**
 * Fetches and formats diagnoses for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of diagnoses grouped by date and recorder
 */
export async function getPatientDiagnosesByDate(
  patientUUID: string,
): Promise<DiagnosesByDate[]> {
  try {
    const diagnoses = await getPatientDiagnoses(patientUUID);
    const formattedDiagnoses = formatDiagnoses(diagnoses);
    return groupDiagnosesByDate(formattedDiagnoses);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw new Error('Error fetching patient diagnoses');
  }
}
