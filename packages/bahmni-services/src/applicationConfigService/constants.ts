import { OPENMRS_REST_V1 } from '../constants/app';

// Global property key for enabling audit logging
export const AUDIT_LOG_APP_PROPERTY = 'bahmni.enableAuditLog';
export const APP_PROPERTY_URL = (property: string) =>
  `${OPENMRS_REST_V1}/bahmnicore/sql/globalproperty?property=${property}`;
