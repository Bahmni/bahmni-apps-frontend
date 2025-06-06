import { PATIENT_DIAGNOSIS_RESOURCE_URL } from "@constants/app";
import { get } from "./api";
import { Coding, Condition as Diagnoses } from "fhir/r4";
import { FormattedDiagnosis } from "@/types/diagnosis";
import { formatDate } from "@/utils/date";
import { CERTAINITY_CONCEPTS } from "@/constants/concepts";



/**
 * Fetches diagnoses for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Diagnoses
 */
export async function getPatientDiagnosisBundle(
  patientUUID: string,
): Promise<Diagnoses> {
  const url = PATIENT_DIAGNOSIS_RESOURCE_URL(patientUUID);
  return await get<Diagnoses>(url);
}

/**
 * Maps a FHIR verification status to DiagnosisCertainty enum
 */
const mapDiagnosisCertainty = (diagnosis: Diagnoses): Coding => {
  const verificationStatus = diagnosis.verificationStatus?.coding?.[0]?.code;

  switch (verificationStatus) {
    case 'confirmed':
      return CERTAINITY_CONCEPTS[0];
    case 'Provisional':
      return CERTAINITY_CONCEPTS[1];
    default:
      return CERTAINITY_CONCEPTS[1]; // Default to Provisional for any other status
  }
};

/**
 * Formats FHIR diagnoses into a more user-friendly format
 * @param diagnoses - The FHIR diagnosis array to format
 * @returns An array of formatted diagnosis objects
 */
export function formatDiagnoses(diagnoses: Diagnoses[]): FormattedDiagnosis[] {
  try {
    return diagnoses.map((diagnosis) => {
        if (!diagnosis.id || !diagnosis.code || !diagnosis.recordedDate) {
            throw new Error("Incomplete diagnosis data");
        }
      const certainty = mapDiagnosisCertainty(diagnosis);

      const recordedDate = diagnosis.recordedDate!;

      const formattedDate = formatDate(recordedDate!);
      if (formattedDate.error) {
        throw new Error("Invalid recorded date format");
      }

      return {
        id: diagnosis.id,
        display: diagnosis.code.text || '',
        certainty,
        recordedDate,
        formattedDate: formattedDate.formattedResult,
        recorder: diagnosis.recorder?.display || '',
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
   throw new Error("Error fetching patient diagnoses");
  }
}