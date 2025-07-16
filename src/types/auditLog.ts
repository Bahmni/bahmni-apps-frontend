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

// Only the two events required for BN-91
export type AuditEventType = 'VIEWED_CLINICAL_DASHBOARD' | 'EDIT_ENCOUNTER';
