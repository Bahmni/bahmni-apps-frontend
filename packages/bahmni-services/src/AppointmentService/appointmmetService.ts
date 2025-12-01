import { post, get } from '../api';
import { APPOINTMENTS_SEARCH_URL, APPOINTMENTS_URL } from './constatns';
import { Appointment } from './models';

export const searchAppointmentsByAttribute = async (
  searchTerm: Record<string, string>,
): Promise<Appointment[]> => {
  const appointments = await post<Appointment[]>(
    APPOINTMENTS_SEARCH_URL,
    searchTerm,
  );
  return appointments;
};

export const updateAppointmentStatus = async (
  appointmentUuid: string,
  toStatus: string,
  onDate?: Date,
): Promise<Appointment> => {
  const updatedAppointment = await post<Appointment>(
    `${APPOINTMENTS_URL}/${appointmentUuid}/status-change`,
    { toStatus, onDate },
  );
  return updatedAppointment;
};

export async function getAppointmentById(uuid: string): Promise<Appointment> {
  return await get<Appointment>(`${APPOINTMENTS_URL}/${uuid}`);
}
