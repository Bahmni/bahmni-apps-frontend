import { get } from '../api';
import { PATIENT_PROGRAMS_URL, PROGRAM_URL } from './constants';
import { PatientProgramsResponse, ProgramEnrollment } from './model';

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

/**
 * Fetches program for a given program UUID
 * @param programUUID - The UUID of the program
 * @returns Promise resolving to a program
 */
export const getProgramByUUID = async (
  programUUID: string,
): Promise<ProgramEnrollment> => {
  return await get<ProgramEnrollment>(PROGRAM_URL(programUUID));
};
