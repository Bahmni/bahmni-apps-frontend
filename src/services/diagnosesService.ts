import { PATIENT_DIAGNOSIS_RESOURCE_URL } from "@constants/app";
import { get } from "./api";
import { Condition } from "fhir/r4";

/**
 * Fetches diagnoses for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Condition
 */
export async function getPatientDiagnosisBundle(
  patientUUID: string,
): Promise<Condition> {
  const url = PATIENT_DIAGNOSIS_RESOURCE_URL(patientUUID);
  return await get<Condition>(url);
}