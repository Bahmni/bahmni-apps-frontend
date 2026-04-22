import type { Appointment, Bundle } from 'fhir/r4';

export interface AppointmentPage {
  bundle: Bundle<Appointment>;
  total: number;
}

interface Speciality {
  uuid: string;
  name: string;
}

interface Location {
  name: string;
  uuid: string;
}

interface AppointmentAttribute {
  uuid: string;
  attributeType: string;
  attributeTypeUuid: string;
  value: string;
}

export interface AppointmentService {
  appointmentServiceId: number;
  uuid: string;
  name: string;
  description: string | null;
  speciality: Speciality | null;
  attributes: AppointmentAttribute[] | null;
  startTime: string;
  endTime: string;
  location: Location | null;
  durationMins?: number | null;
  color: string;
  initialAppointmentStatus: string | null;
}
