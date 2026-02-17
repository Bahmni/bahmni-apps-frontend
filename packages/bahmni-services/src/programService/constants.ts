import { OPENMRS_REST_V1 } from '../constants/app';

export const PATIENT_PROGRAMS_URL = (patientUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment?patient=${patientUUID}&v=full`;
export const PROGRAMS_URL = (programUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment/${programUUID}`;
export const PROGRAM_DETAILS_URL = (programUUID: string) =>
  `${PROGRAMS_URL(programUUID)}?v=full`;
