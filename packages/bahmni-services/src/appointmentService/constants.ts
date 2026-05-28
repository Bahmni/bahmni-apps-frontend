import { subMinutes } from 'date-fns';
import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const APPOINTMENT_STATUSES = {
  PROPOSED: 'proposed',
  PENDING: 'pending',
  BOOKED: 'booked',
  ARRIVED: 'arrived',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  NOSHOW: 'noshow',
  CHECKED_IN: 'checked-in',
  WAITLIST: 'waitlist',
  ENTERED_IN_ERROR: 'entered-in-error',
} as const;

export const APPOINTMENTS_SEARCH_URL = OPENMRS_REST_V1 + '/appointments/search';
export const APPOINTMENTS_URL = OPENMRS_REST_V1 + '/appointments';

// FHIR Appointment identifier system
export const APPOINTMENT_IDENTIFIER_SYSTEM =
  'http://fhir.bahmni.org/code-system/appointments'; // NOSONAR

export const getAppointmentByIdUrl = (uuid: string): string =>
  `${APPOINTMENTS_URL}/${uuid}`;

export const getAppointmentsUrl = (
  patientUUID: string,
  type: 'upcoming' | 'past',
  count?: number,
  offset?: number,
): string => {
  const isUpcoming = type === 'upcoming';
  const dateOperator = isUpcoming ? 'ge' : 'le';
  const sortOrder = isUpcoming ? 'date' : '-date';

  const timestamp = isUpcoming
    ? new Date().toISOString()
    : subMinutes(new Date(), 1).toISOString();

  let url = `${OPENMRS_FHIR_R4}/Appointment?patient=${patientUUID}&date=${dateOperator}${timestamp}&_sort=${sortOrder}`;

  if (count !== undefined && count > 0) {
    url += `&_count=${count}`;
  }

  if (offset !== undefined && offset > 0) {
    url += `&_getpagesoffset=${offset}`;
  }

  return url;
};

export const UPCOMING_APPOINTMENTS_URL = (patientUUID: string) => {
  return getAppointmentsUrl(patientUUID, 'upcoming');
};

export const PAST_APPOINTMENTS_URL = (patientUUID: string, count?: number) => {
  return getAppointmentsUrl(patientUUID, 'past', count);
};

export const updateAppointmentStatusUrl = (appointmentUuid: string): string =>
  `${APPOINTMENTS_URL}/${appointmentUuid}/status-change`;

export const ALL_APPOINTMENT_SERVICES_URL =
  OPENMRS_REST_V1 + '/appointmentService/all/full';

export const CREATE_APPOINTMENT_SERVICE_URL =
  OPENMRS_REST_V1 + '/appointmentService';

export const getDeleteAppointmentServiceUrl = (uuid: string): string =>
  `${OPENMRS_REST_V1}/appointmentService?uuid=${uuid}`;

export const APPOINTMENT_SERVICE_ATTRIBUTE_TYPES_URL =
  OPENMRS_REST_V1 + '/appointment-service-attribute-types';

export const APPOINTMENT_LOCATIONS_URL = `${OPENMRS_REST_V1}/location?operator=ALL&s=byTags&tags=Appointment+Location&v=default`;

export const APPOINTMENT_SPECIALITIES_URL = OPENMRS_REST_V1 + '/speciality/all';

export const getUpcomingAppointmentsPageUrl = (
  patientUUID: string,
  count: number = 10,
  offset: number = 0,
): string => getAppointmentsUrl(patientUUID, 'upcoming', count, offset);

export const getPastAppointmentsPageUrl = (
  patientUUID: string,
  count: number = 10,
  offset: number = 0,
): string => getAppointmentsUrl(patientUUID, 'past', count, offset);
