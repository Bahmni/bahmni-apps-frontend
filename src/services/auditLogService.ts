import client from './api';
import { isAuditLogEnabled } from './globalPropertyService';
import { AUDIT_LOG_URL } from '@constants/app';
import { AUDIT_LOG_EVENT_DETAILS, MODULE_LABELS } from '@constants/auditLog';
import { AUDIT_LOG_ERROR_MESSAGES } from '@constants/errors';
import i18next from 'i18next';
import {
  AuditLogEntry,
  AuditLogResponse,
  AuditEventType
} from '../types/auditLog';

/**
 * Log an audit event
 * @param patientUuid - Patient UUID (optional for some events)
 * @param eventType - Type of audit event
 * @param messageParams - Additional parameters for the message (optional)
 * @param module - Module identifier
 * @returns Promise<AuditLogResponse>
 */
export const logAuditEvent = async (
  patientUuid: string | undefined,
  eventType: AuditEventType,
  messageParams?: Record<string, unknown>,
  module: string = MODULE_LABELS.CLINICAL
): Promise<AuditLogResponse> => {
  try {
    // Check if audit logging is enabled - matching openmrs-bahmni-apps implementation
    const isEnabled = await isAuditLogEnabled();
    
    if (!isEnabled) {
      // Audit logging is disabled, return without logging
      return { logged: false };
    }

    // Get event details from mapping
    const eventDetail = AUDIT_LOG_EVENT_DETAILS[eventType];
    if (!eventDetail) {
      // eslint-disable-next-line no-console
      console.warn(i18next.t(AUDIT_LOG_ERROR_MESSAGES.UNKNOWN_EVENT_TYPE, { eventType }));
      return { logged: false, error: i18next.t(AUDIT_LOG_ERROR_MESSAGES.UNKNOWN_EVENT_TYPE, { eventType }) };
    }

    // Prepare audit log entry
    const auditEntry: AuditLogEntry = {
      patientUuid,
      eventType: eventDetail.eventType,
      message: messageParams
        ? `${eventDetail.message}~${JSON.stringify(messageParams)}`
        : eventDetail.message,
      module
    };
    // Send audit log using direct axios call to match legacy exactly
    await client.post(AUDIT_LOG_URL, auditEntry, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return { logged: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(i18next.t(AUDIT_LOG_ERROR_MESSAGES.LOG_FAILED), error);
    return {
      logged: false,
      error: error instanceof Error ? error.message : i18next.t(AUDIT_LOG_ERROR_MESSAGES.UNKNOWN_ERROR)
    };
  }
};

/**
 * Log dashboard view event
 * @param patientUuid - Patient UUID
 * @returns Promise<AuditLogResponse>
 */
export const logDashboardView = async (patientUuid: string): Promise<AuditLogResponse> => {
  return logAuditEvent(patientUuid, 'VIEWED_CLINICAL_DASHBOARD');
};

/**
 * Log encounter edit event
 * @param patientUuid - Patient UUID
 * @param encounterUuid - Encounter UUID
 * @param encounterType - Encounter type
 * @returns Promise<AuditLogResponse>
 */
export const logEncounterEdit = async (
  patientUuid: string,
  encounterUuid: string,
  encounterType: string
): Promise<AuditLogResponse> => {
  const messageParams = {
    encounterUuid,
    encounterType
  };
  
  return logAuditEvent(patientUuid, 'EDIT_ENCOUNTER', messageParams);
};