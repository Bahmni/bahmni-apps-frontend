import { PATIENT_DIAGNOSIS_RESOURCE_URL } from '@constants/app';
import { get } from './api';
import { Coding, Condition as Diagnoses, Bundle } from 'fhir/r4';
import { DiagnosesByDate, FormattedDiagnosis } from '@/types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@/constants/concepts';

// Constants for better maintainability
const CONFIRMED_STATUS = 'confirmed';
const PROVISIONAL_STATUS = 'provisional';

/**
 * Fetches diagnoses for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing diagnoses
 */
async function getPatientDiagnosesBundle(patientUUID: string): Promise<Bundle> {
  const url = PATIENT_DIAGNOSIS_RESOURCE_URL(patientUUID);
  return await get<Bundle>(url);
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
 * Formats FHIR diagnoses into a more user-friendly format
 * @param diagnoses - The FHIR diagnosis array to format
 * @returns An array of formatted diagnosis objects
 */
function formatDiagnoses(bundle: Bundle): FormattedDiagnosis[] {
  // Extract conditions from bundle entries
  const diagnoses =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Diagnoses) || [];

  return diagnoses.map((diagnosis) => {
    if (!isValidDiagnosis(diagnosis)) {
      throw new Error('Incomplete diagnosis data');
    }

    const certainty = mapDiagnosisCertainty(diagnosis);
    const recordedDate = diagnosis.recordedDate as string;

    return {
      id: diagnosis.id as string,
      display: diagnosis.code?.text || '',
      certainty,
      recordedDate,
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
    const dateKey = diagnosis.recordedDate.substring(0, 10);

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,

        diagnoses: [], // Direct list of diagnoses, no recorder grouping
      });
    }

    const dateGroup = dateMap.get(dateKey) as DiagnosesByDate;
    dateGroup.diagnoses.push(diagnosis);
  });

  // Sort by date (newest first)
  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
  const diagnoses = await getPatientDiagnosesBundle(patientUUID);
  const formattedDiagnoses = formatDiagnoses(diagnoses);
  return groupDiagnosesByDate(formattedDiagnoses);
}
