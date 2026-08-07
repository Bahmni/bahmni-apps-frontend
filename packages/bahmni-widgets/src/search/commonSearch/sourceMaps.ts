import {
  getUserLoginLocation,
  getAllAppointmentServices,
} from '@bahmni/services';
import { LookupLoader } from './models';

const appointmentServiceSource = async () => {
  const loginLocation = getUserLoginLocation();

  return (await getAllAppointmentServices())
    .filter((s) => s.location?.uuid === loginLocation.uuid)
    .map((s) => ({
      uuid: s.uuid,
      label: s.name,
    }));
};

export const LOOKUP_SOURCES: Record<string, LookupLoader | undefined> = {
  appointmentService: appointmentServiceSource,
};
