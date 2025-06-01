import { get } from './api';
import { PATIENT_DIAGNOSIS_RESOURCE_URL } from '@constants/app';
import {
  FhirDiagnosis,
  FhirDiagnosisBundle,
  FormattedDiagnosis,
  DiagnosisCertainty,
  DiagnosesByDate,
} from '@/types/diagnosis';
import { getFormattedError } from '@utils/common';
import { formatDate } from '@utils/date';
import notificationService from './notificationService';

/**
 * Maps a FHIR verification status to DiagnosisCertainty enum
 */
export const mapDiagnosisCertainty = (diagnosis: FhirDiagnosis): DiagnosisCertainty => {
  const verificationStatus = diagnosis.verificationStatus?.coding?.[0]?.code;

  switch (verificationStatus) {
    case 'confirmed':
      return DiagnosisCertainty.Confirmed;
    case 'Provisional':
      return DiagnosisCertainty.Provisional;
    default:
      return DiagnosisCertainty.Provisional; // Default to Provisional for any other status
  }
};

/**
 * Fetches diagnoses for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirDiagnosisBundle
 */
export async function getPatientDiagnosisBundle(
  patientUUID: string,
): Promise<FhirDiagnosisBundle> {
  const url = PATIENT_DIAGNOSIS_RESOURCE_URL(patientUUID);
  console.log('Diagnosis API URL:', url);
  return await get<FhirDiagnosisBundle>(url);
}

/**
 * Fetches diagnoses for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirDiagnosis
 */
export async function getDiagnoses(patientUUID: string): Promise<FhirDiagnosis[]> {
  try {

    const fhirDiagnosisBundle = await getPatientDiagnosisBundle(patientUUID);

    let diagnoses = fhirDiagnosisBundle.entry?.map((entry) => entry.resource) || [];

    return diagnoses;
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Formats FHIR diagnoses into a more user-friendly format
 * @param diagnoses - The FHIR diagnosis array to format
 * @returns An array of formatted diagnosis objects
 */
export function formatDiagnoses(diagnoses: FhirDiagnosis[]): FormattedDiagnosis[] {
  try {
    return diagnoses.map((diagnosis) => {
      const certainty = mapDiagnosisCertainty(diagnosis);

      const recordedDate = diagnosis.recordedDate;
      const dateFormatResult = formatDate(recordedDate,'MMMM d, yyyy');
      const formattedDate =
        dateFormatResult.formattedResult || recordedDate.split('T')[0];

      return {
        id: diagnosis.id,
        display: diagnosis.code.text || diagnosis.code.display || '',
        certainty,
        recordedDate,
        formattedDate,
        recorder: diagnosis.recorder?.display || '',
      };
    });
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Groups diagnoses by date only (no recorder grouping)
 * @param diagnoses - The formatted diagnoses to group
 * @returns An array of diagnoses grouped by date
 */
export function groupDiagnosesByDateAndRecorder(
  diagnoses: FormattedDiagnosis[],
): DiagnosesByDate[] {
  try {
    const dateMap = new Map<string, DiagnosesByDate>();

    diagnoses.forEach((diagnosis) => {
      const dateKey = diagnosis.recordedDate.split('T')[0]; // Get YYYY-MM-DD part

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: diagnosis.formattedDate,
          rawDate: diagnosis.recordedDate,
          diagnoses: [], // Direct list of diagnoses, no recorder grouping
        });
      }

      const dateGroup = dateMap.get(dateKey)!;
      dateGroup.diagnoses.push(diagnosis);
    });

    // Sort by date (newest first)
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

/**
 * Fetches and formats diagnoses for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of diagnoses grouped by date and recorder
 */
export async function getPatientDiagnosesByDateAndRecorder(
  patientUUID: string,
): Promise<DiagnosesByDate[]> {
  try {
    const diagnoses = await getDiagnoses(patientUUID);
    const formattedDiagnoses = formatDiagnoses(diagnoses);
    return groupDiagnosesByDateAndRecorder(formattedDiagnoses);
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return [];
  }
}

export default {
  getDiagnoses,
  formatDiagnoses,
  groupDiagnosesByDateAndRecorder,
  getPatientDiagnosesByDateAndRecorder,
};
