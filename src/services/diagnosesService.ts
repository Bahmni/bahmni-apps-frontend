import { Coding, Condition as Diagnoses, Bundle } from 'fhir/r4';
import { PATIENT_DIAGNOSIS_RESOURCE_URL } from '@constants/app';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { Diagnosis } from '@types/diagnosis';
import { get } from './api';

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
function formatDiagnoses(bundle: Bundle): Diagnosis[] {
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
 * Fetches and formats diagnoses for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of diagnoses
 */
export async function getPatientDiagnoses(
  patientUUID: string,
): Promise<Diagnosis[]> {
  const bundle = await getPatientDiagnosesBundle(patientUUID);
  return formatDiagnoses(bundle);
}
