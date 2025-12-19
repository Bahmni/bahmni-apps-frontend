import { get } from '../api';
import { PATIENT_PROGRAMS_URL } from '../constants/app';
import { PatientProgramsResponse } from './model';

// TODO: Add Optional parameters for pagination and filtering
/**
 * Fetches programs for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a list containing programs
 */
export const getPatientPrograms = async (
  patientUUID: string,
): Promise<PatientProgramsResponse> => {
  return await get<PatientProgramsResponse>(PATIENT_PROGRAMS_URL(patientUUID));
};
