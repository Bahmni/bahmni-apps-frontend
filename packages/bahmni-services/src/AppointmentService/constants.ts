import { OPENMRS_REST_V1, BAHMNI_SQL_URL } from '../constants/app';

export const APPOINTMENTS_SEARCH_URL = OPENMRS_REST_V1 + '/appointments/search';
export const APPOINTMENTS_URL = OPENMRS_REST_V1 + '/appointments';

export const UPCOMING_APPOINTMENTS_SQL_QUERY =
  'bahmni.sqlGet.upComingAppointments';
export const PAST_APPOINTMENTS_SQL_QUERY = 'bahmni.sqlGet.pastAppointments';

// URL builders
export const getAppointmentByIdUrl = (uuid: string): string =>
  `${APPOINTMENTS_URL}/${uuid}`;

export const getUpcomingAppointmentsUrl = (patientUuid: string): string =>
  `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${UPCOMING_APPOINTMENTS_SQL_QUERY}&v=full`;

export const getPastAppointmentsUrl = (patientUuid: string): string =>
  `${BAHMNI_SQL_URL}?patientUuid=${patientUuid}&q=${PAST_APPOINTMENTS_SQL_QUERY}&v=full`;

export const updateAppointmentStatusUrl = (appointmentUuid: string): string =>
  `${APPOINTMENTS_URL}/${appointmentUuid}/status-change`;
