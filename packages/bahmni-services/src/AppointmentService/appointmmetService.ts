import { post, get } from '../api';
import { BAHMNI_SQL_URL } from '../constants/app';
import {
  APPOINTMENTS_SEARCH_URL,
  UPCOMING_APPOINTMENTS_SQL_QUERY,
  PAST_APPOINTMENTS_SQL_QUERY,
  getAppointmentByIdUrl,
  getUpcomingAppointmentsUrl,
  getPastAppointmentsUrl,
  updateAppointmentStatusUrl,
} from './constants';
import { Appointment } from './models';

export const searchAppointmentsByAttribute = async (
  searchParam: Record<string, string>,
): Promise<Appointment[]> => {
  const appointments = await post<Appointment[]>(
    APPOINTMENTS_SEARCH_URL,
    searchParam,
  );
  return appointments;
};

const transformSqlAppointmentResponse = (
  sqlResponse: Record<string, unknown>,
): Appointment => {
  const reasonString = sqlResponse.DASHBOARD_APPOINTMENTS_REASON_KEY ?? '';
  const reasons = reasonString
    ? [{ conceptUuid: '', name: reasonString as string }]
    : [];

  return {
    uuid: sqlResponse.uuid as string,
    startDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY as number,
    endDateTime:
      sqlResponse.DASHBOARD_APPOINTMENTS_END_DATE_IN_UTC_KEY as number,
    appointmentNumber:
      (sqlResponse.DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY ??
        '-') as string,
    appointmentSlot: (sqlResponse.DASHBOARD_APPOINTMENTS_SLOT_KEY ??
      '-') as string,
    dateCreated: 0,
    dateAppointmentScheduled: 0,
    appointmentKind: '',
    service: {
      appointmentServiceId: 0,
      name: (sqlResponse.DASHBOARD_APPOINTMENTS_SERVICE_KEY ?? '-') as string,
      description: null,
      speciality: null,
      startTime: '',
      endTime: '',
      location: {
        name: (sqlResponse.DASHBOARD_APPOINTMENTS_LOCATION_KEY ??
          '-') as string,
        uuid: '',
      },
      uuid: '',
      color: '',
      initialAppointmentStatus: null,
    },
    serviceType: {
      id: undefined,
      name: (sqlResponse.DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY ??
        '-') as string,
      description: undefined,
      uuid: '',
    },
    provider: {
      id: undefined,
      name: (sqlResponse.DASHBOARD_APPOINTMENTS_PROVIDER_KEY ?? '-') as string,
      uuid: '',
    },
    location: {
      name: (sqlResponse.DASHBOARD_APPOINTMENTS_LOCATION_KEY ?? '-') as string,
      uuid: '',
    },
    status: (sqlResponse.DASHBOARD_APPOINTMENTS_STATUS_KEY ??
      'Unknown') as string,
    comments: null,
    reasons,
    patient: {
      uuid: '',
      identifier: '',
      name: '',
      gender: '',
      birthDate: 0,
      age: 0,
      PatientIdentifier: '',
      customAttributes: [],
    },
  };
};

export const getUpcomingAppointments = async (
  patientUuid: string,
): Promise<Appointment[]> => {
  const sqlResults = await get<Record<string, unknown>[]>(
    getUpcomingAppointmentsUrl(patientUuid),
  );
  return (sqlResults || []).map(transformSqlAppointmentResponse);
};

export const getPastAppointments = async (
  patientUuid: string,
): Promise<Appointment[]> => {
  const sqlResults = await get<Record<string, unknown>[]>(
    getPastAppointmentsUrl(patientUuid),
  );
  return (sqlResults || []).map(transformSqlAppointmentResponse);
};

export const updateAppointmentStatus = async (
  appointmentUuid: string,
  toStatus: string,
  onDate?: Date,
): Promise<Appointment> => {
  const updatedAppointment = await post<Appointment>(
    updateAppointmentStatusUrl(appointmentUuid),
    { toStatus, onDate },
  );
  return updatedAppointment;
};

export async function getAppointmentById(uuid: string): Promise<Appointment> {
  return await get<Appointment>(getAppointmentByIdUrl(uuid));
}
