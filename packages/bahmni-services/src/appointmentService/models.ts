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

export interface AppointmentServiceAttributeType {
  uuid: string;
  name: string;
  description: string | null;
  format: string | null;
  datatype: string;
  minOccurs: number | null;
  maxOccurs: number | null;
  retired: boolean;
}

export interface AppointmentLocation {
  uuid: string;
  display: string;
}

export interface AppointmentSpeciality {
  uuid: string;
  name: string;
}

export interface CreateServiceWeeklyAvailability {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxAppointmentsLimit: number | null;
}

export interface CreateAppointmentServiceRequest {
  name: string;
  description?: string;
  specialityUuid?: string;
  locationUuid?: string;
  duration?: string;
  attributes?: { attributeTypeUuid: string; value: string }[];
  weeklyAvailability?: CreateServiceWeeklyAvailability[];
}
