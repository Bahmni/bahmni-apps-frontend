import { get } from '../api';
import { PATIENT_PROGRAMS_URL } from '../constants/app';
import { ProgramEnrollment, ProgramServiceResponse } from './model';

interface ProgramEnrollmentApiResponse {
  results: ProgramEnrollment[];
}

export const getPatientProgramEnrollments = async (
  patientUUID: string,
): Promise<ProgramEnrollment[]> => {
  if (!patientUUID || patientUUID.trim() === '') {
    throw new Error('Invalid patient UUID: UUID cannot be empty');
  }

  const response = await get<ProgramEnrollmentApiResponse>(
    PATIENT_PROGRAMS_URL(patientUUID),
  );

  return response.results || [];
};

export const categorizePrograms = (
  enrollments: ProgramEnrollment[],
): ProgramServiceResponse => {
  const activePrograms: ProgramEnrollment[] = [];
  const endedPrograms: ProgramEnrollment[] = [];

  enrollments.forEach((enrollment) => {
    if (enrollment.dateCompleted || enrollment.dateEnded) {
      endedPrograms.push(enrollment);
    } else {
      activePrograms.push(enrollment);
    }
  });

  return {
    activePrograms,
    endedPrograms,
  };
};

export const getPatientPrograms = async (
  patientUUID: string,
): Promise<ProgramServiceResponse> => {
  const enrollments = await getPatientProgramEnrollments(patientUUID);
  return categorizePrograms(enrollments);
};

export const getCurrentProgramState = (
  enrollment: ProgramEnrollment,
): ProgramEnrollment['states'][number] | null => {
  if (!enrollment.states || enrollment.states.length === 0) {
    return null;
  }
  return enrollment.states[enrollment.states.length - 1];
};

export const getProgramName = (enrollment: ProgramEnrollment): string => {
  return enrollment.program?.name || enrollment.display || '';
};

export const getProgramUUID = (enrollment: ProgramEnrollment): string => {
  return enrollment.program?.uuid || enrollment.uuid || '';
};

export const getEnrollmentDate = (
  enrollment: ProgramEnrollment,
): string | null => {
  return enrollment.dateEnrolled || null;
};

export const getEndDate = (enrollment: ProgramEnrollment): string | null => {
  return enrollment.dateCompleted ?? enrollment.dateEnded ?? null;
};

export const getProgramOutcome = (
  enrollment: ProgramEnrollment,
): ProgramEnrollment['outcome'] => {
  return enrollment.outcome ?? null;
};

export const getProgramAttributes = (enrollment: ProgramEnrollment) => {
  return enrollment.attributes || [];
};

export const getProgramStates = (enrollment: ProgramEnrollment) => {
  return enrollment.states || [];
};

export const formatProgramEnrollment = (enrollment: ProgramEnrollment) => {
  return {
    uuid: enrollment.uuid,
    programName: getProgramName(enrollment),
    programUUID: getProgramUUID(enrollment),
    dateEnrolled: getEnrollmentDate(enrollment),
    dateEnded: getEndDate(enrollment),
    outcome: getProgramOutcome(enrollment),
    attributes: getProgramAttributes(enrollment),
    states: getProgramStates(enrollment),
    currentState: getCurrentProgramState(enrollment),
    isActive: !getEndDate(enrollment),
  };
};

export const sortProgramsByDate = (
  programs: ProgramEnrollment[],
): ProgramEnrollment[] => {
  return [...programs].sort(
    (a, b) =>
      new Date(b.dateEnrolled).getTime() - new Date(a.dateEnrolled).getTime(),
  );
};
