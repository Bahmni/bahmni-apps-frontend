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
  | 'VIEWED_RADIOLOGY_RESULTS'
  | 'STOP_MEDICATION'
  | 'UPLOAD_PATIENT_DOCUMENT'
  | 'START_VISIT';

// Query params accepted by the audit log list (GET) endpoint.
// Mirrors the legacy `auditLogController`/`auditLogService` request shape.
export interface AuditLogQueryParams {
  username?: string;
  patientId?: string;
  startFrom?: string;
  lastAuditLogId?: number | string;
  prev?: boolean;
  defaultView?: boolean;
}

// Raw shape of a single audit log entry as returned by the backend.
export interface RawAuditLogEntry {
  auditLogId: number;
  dateCreated: string;
  eventType: string;
  userId: string;
  patientId: string;
  message: string;
  module: string;
}

// Parsed/display shape of an audit log entry, ready to be rendered in a table.
export interface AuditLogListEntry {
  id: string;
  auditLogId: number;
  dateCreated: string;
  eventType: string;
  userId: string;
  patientId: string;
  // The message/translation key (already split off from its `~<JSON>` params suffix, if any).
  message: string;
  messageParams?: Record<string, unknown>;
  module: string;
}
