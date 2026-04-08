import type { Appointment, Bundle } from 'fhir/r4';
import { del, get, post } from '../api';
import {
  ALL_APPOINTMENT_SERVICES_URL,
  APPOINTMENTS_SEARCH_URL,
  getAppointmentByIdUrl,
  getDeleteAppointmentServiceUrl,
  updateAppointmentStatusUrl,
  UPCOMING_APPOINTMENTS_URL,
  PAST_APPOINTMENTS_URL,
} from './constants';
import { AppointmentService } from './models';

/**
 * Search for appointments by specified attributes.
 *
 * @param searchParam - Search parameters for appointments
 * @returns Raw FHIR Bundle containing appointments matching search criteria. Consumer is responsible for transformation to view model
 * @throws Error if the API request fails
 */
export const searchAppointmentsByAttribute = async (
  searchParam: Record<string, string>,
): Promise<Bundle<Appointment>> => {
  return await post<Bundle<Appointment>>(APPOINTMENTS_SEARCH_URL, searchParam);
};

/**
 * Fetch upcoming appointments for a patient.
 *
 * @param patientUuid - Patient UUID to fetch appointments for
 * @returns Raw FHIR Bundle containing upcoming appointments. Consumer is responsible for transformation to view model
 * @throws Error if the API request fails
 */
export async function getUpcomingAppointments(
  patientUuid: string,
): Promise<Bundle<Appointment>> {
  return await get<Bundle<Appointment>>(UPCOMING_APPOINTMENTS_URL(patientUuid));
}

/**
 * Fetch past appointments for a patient.
 *
 * @param patientUuid - Patient UUID to fetch appointments for
 * @param count - Optional limit on number of past appointments to fetch (from config)
 * @returns Raw FHIR Bundle containing past appointments sorted by date (most recent first). Consumer is responsible for transformation to view model
 * @throws Error if the API request fails
 */
export async function getPastAppointments(
  patientUuid: string,
  count?: number,
): Promise<Bundle<Appointment>> {
  return await get<Bundle<Appointment>>(
    PAST_APPOINTMENTS_URL(patientUuid, count),
  );
}

/**
 * Update the status of an appointment.
 *
 * @param appointmentUuid - Appointment UUID to update
 * @param toStatus - New status value
 * @param onDate - Optional date for the status update
 * @returns Raw FHIR Appointment resource with updated status. Consumer is responsible for transformation to view model
 * @throws Error if the API request fails
 */
export const updateAppointmentStatus = async (
  appointmentUuid: string,
  toStatus: string,
  onDate?: Date,
) => {
  return await post(updateAppointmentStatusUrl(appointmentUuid), {
    toStatus,
    onDate,
  });
};

/**
 * Fetch a specific appointment by ID.
 *
 * @param uuid - Appointment UUID
 * @returns Raw FHIR Appointment resource. Consumer is responsible for transformation to view model
 * @throws Error if the API request fails
 */
export async function getAppointmentById(uuid: string) {
  return await get(getAppointmentByIdUrl(uuid));
}

/**
 * Fetches all the appointment service definitions
 * @returns A list of Appointment Service Definitions
 */
export const getAllAppointmentServices = async (): Promise<
  AppointmentService[]
> => {
  return await get<AppointmentService[]>(ALL_APPOINTMENT_SERVICES_URL);
};

/**
 * Deletes an appointment service definition by UUID.
 *
 * @param uuid - UUID of the appointment service to delete
 * @throws Error if the API request fails
 */
export const deleteAppointmentService = async (uuid: string): Promise<void> => {
  await del(getDeleteAppointmentServiceUrl(uuid));
};
