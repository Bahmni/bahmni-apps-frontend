// Core audit log entry sent to API
export interface AuditLogEntry {
  patientUuid?: string;
  eventType: string;
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
  | 'VIEWED_RADIOLOGY_RESULTS';
