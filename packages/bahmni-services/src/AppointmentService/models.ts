import { PatientSearchResult } from '../patientService/models';

export interface AppointmentSearchResult extends PatientSearchResult {
  appointmentUuid?: string;
  appointmentNumber?: string;
  appointmentDate?: string;
  appointmentReason?: string;
  appointmentStatus?: string;
}

export interface Appointment {
  uuid: string;
  appointmentNumber: string;
  dateCreated: number;
  dateAppointmentScheduled: number;
  patient: Patient;
  service: AppointmentService;
  serviceType: ServiceType | null;
  provider: Provider | null;
  location: Location;
  startDateTime: number;
  endDateTime: number;
  appointmentKind: string;
  status: string;
  comments: string | null;
  reasons: Reason[];
}

export interface Patient {
  identifier: string;
  gender: string;
  name: string;
  uuid: string;
  birthDate: number;
  age: number;
  PatientIdentifier: string;
  customAttributes: [];
}

export interface AppointmentService {
  appointmentServiceId: number;
  name: string;
  description: string | null;
  speciality: null;
  startTime: string;
  endTime: string;
  location: Location;
  uuid: string;
  color: string;
  initialAppointmentStatus: string | null;
}

export interface Location {
  name: string;
  uuid: string;
}

export interface Provider {
  id?: number;
  name?: string;
  uuid?: string;
}

export interface Extensions {
  patientEmailDefined: boolean;
}

export interface Reason {
  conceptUuid: string;
  name: string;
}

export interface ServiceType {
  id?: number;
  name?: string;
  description?: string;
  uuid?: string;
}
