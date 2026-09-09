import { AppointmentSearchField, PatientSearchField } from '@bahmni/services';

export interface SearchPatientConfig {
  patientDetailUrl?: string;
  customAttributes: PatientSearchField[];
  appointment: AppointmentSearchField[];
}
