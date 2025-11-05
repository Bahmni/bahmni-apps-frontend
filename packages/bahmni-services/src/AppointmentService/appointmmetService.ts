import { post } from '../api';
import { APPOINTMENTS_SEARCH_URL } from './constatns';
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
