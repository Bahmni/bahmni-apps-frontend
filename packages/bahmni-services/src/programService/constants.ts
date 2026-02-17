import { OPENMRS_REST_V1 } from '../constants/app';

const PROGRAM_ENROLLMENT_CUSTOM_REP =
  'custom:(uuid,episodeUuid,patient,program,display,dateEnrolled,dateCompleted,location,voided,outcome,states:(uuid,startDate,endDate,voided,state:(uuid,concept:(uuid,display,name,names))),auditInfo,attributes)';

export const PATIENT_PROGRAMS_URL = (patientUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment?patient=${patientUUID}&v=${PROGRAM_ENROLLMENT_CUSTOM_REP}`;
export const PROGRAM_DETAILS_URL = (programUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment/${programUUID}?v=${PROGRAM_ENROLLMENT_CUSTOM_REP}`;
