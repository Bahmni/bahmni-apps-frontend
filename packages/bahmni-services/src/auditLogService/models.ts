// Core audit log entry sent to API
export interface AuditLogEntry {
  patientUuid?: string;
  eventType: AuditEventType;
  message: string;
  module: string;
}

// Response from audit log operations
export interface AuditLogResponse {
  logged: boolean;
  error?: string;
}

//TODO: Add more event types for each user action as per BN-91
export type AuditEventType =
  | 'VIEWED_CLINICAL_DASHBOARD'
  | 'EDIT_ENCOUNTER'
  | 'VIEWED_REGISTRATION_PATIENT_SEARCH'
  | 'REGISTER_NEW_PATIENT'
  | 'VIEWED_NEW_PATIENT_PAGE'
  | 'OPEN_VISIT'
  | 'EDIT_PATIENT_DETAILS'
  | 'VIEWED_RADIOLOGY_RESULTS'
  | 'CREATE_ENCOUNTER'
  | 'STOP_MEDICATION';
