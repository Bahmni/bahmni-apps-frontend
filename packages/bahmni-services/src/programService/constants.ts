import { OPENMRS_REST_V1 } from '../constants/app';

const PROGRAM_ENROLLMENT_CUSTOM_REP =
  'custom:(uuid,episodeUuid,patient,program,display,dateEnrolled,dateCompleted,location,voided,allowedStates,outcome,states:(uuid,startDate,endDate,voided,state:(uuid,concept:(uuid,display,name,names)),auditInfo),auditInfo,attributes)';

export const PATIENT_PROGRAMS_URL = (patientUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment?patient=${patientUUID}&v=${PROGRAM_ENROLLMENT_CUSTOM_REP}`;
export const PATIENT_PROGRAMS_PAGE_URL = (
  patientUUID: string,
  limit: number = 15,
  startIndex: number = 0,
) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment?patient=${patientUUID}&v=${PROGRAM_ENROLLMENT_CUSTOM_REP}&limit=${limit}&startIndex=${startIndex}&totalCount=true`;
export const PROGRAMS_URL = (programUUID: string) =>
  `${OPENMRS_REST_V1}/bahmniprogramenrollment/${programUUID}`;
export const PROGRAM_DETAILS_URL = (programUUID: string) =>
  `${PROGRAMS_URL(programUUID)}?v=${PROGRAM_ENROLLMENT_CUSTOM_REP}`;
