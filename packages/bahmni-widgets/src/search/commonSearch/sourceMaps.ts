import {
  getUserLoginLocation,
  getAllAppointmentServices,
  getAllPrograms,
  fetchAllProviders,
} from '@bahmni/services';
import { LookupLoader } from './models';

const appointmentServiceSource = async () => {
  const loginLocation = getUserLoginLocation();

  return (await getAllAppointmentServices())
    .filter(
      (s) => s.location === null || s.location.uuid === loginLocation.uuid,
    )
    .map((s) => ({
      uuid: s.uuid,
      label: s.name,
    }));
};

const programNameSource = async () =>
  (await getAllPrograms())
    .filter((p) => !p.retired)
    .map((p) => ({ uuid: p.uuid, label: p.name }));

const providerSource = async () =>
  (await fetchAllProviders())
    .filter((p) => p.person)
    .map((p) => ({
      uuid: p.uuid,
      label:
        (p.person?.preferredName?.display ?? p.person.display) || p.display,
    }));

export const LOOKUP_SOURCES: Record<string, LookupLoader | undefined> = {
  appointmentService: appointmentServiceSource,
  provider: providerSource,
  programName: programNameSource,
};
