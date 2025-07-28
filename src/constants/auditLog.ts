// Audit log event details mapping
export const AUDIT_LOG_EVENT_DETAILS = {
  VIEWED_CLINICAL_DASHBOARD: {
    eventType: 'VIEWED_CLINICAL_DASHBOARD',
    message: 'VIEWED_CLINICAL_DASHBOARD_MESSAGE',
  },
  EDIT_ENCOUNTER: {
    eventType: 'EDIT_ENCOUNTER',
    message: 'EDIT_ENCOUNTER_MESSAGE',
  },
};

// Module labels
export const MODULE_LABELS = {
  CLINICAL: 'MODULE_LABEL_CLINICAL_KEY',
} as const;

// Global property key for enabling audit logging
export const AUDIT_LOG_APP_PROPERTY = 'bahmni.enableAuditLog';
