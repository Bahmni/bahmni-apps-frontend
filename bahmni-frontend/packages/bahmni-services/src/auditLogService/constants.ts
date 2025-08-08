import { OPENMRS_REST_V1 } from '../constants/app';

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




export const AUDIT_LOG_URL = OPENMRS_REST_V1 + '/auditlog';
export const AUDIT_LOG_ERROR_MESSAGES = {
  UNKNOWN_EVENT_TYPE: 'AUDIT_LOG_ERROR_UNKNOWN_EVENT_TYPE',
};