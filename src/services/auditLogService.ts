import i18next from 'i18next';
import { AUDIT_LOG_URL } from '@constants/app';
import { AUDIT_LOG_EVENT_DETAILS, MODULE_LABELS } from '@constants/auditLog';
import { AUDIT_LOG_ERROR_MESSAGES } from '@constants/errors';
import {
  AuditLogEntry,
  AuditLogResponse,
  AuditEventType,
} from '@types/auditLog';
import { post } from './api';
import { isAuditLogEnabled } from './ApplicationConfigService';

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
  module: string = MODULE_LABELS.CLINICAL,
): Promise<AuditLogResponse> => {
  // try {
  // Check if audit logging is enabled - matching openmrs-bahmni-apps implementation
  const isEnabled = await isAuditLogEnabled();

  if (!isEnabled) {
    // Audit logging is disabled, return without logging
    return { logged: false };
  }

  // Get event details from mapping
  const eventDetail = AUDIT_LOG_EVENT_DETAILS[eventType];
  if (!eventDetail) {
    return {
      logged: false,
      error: i18next.t(AUDIT_LOG_ERROR_MESSAGES.UNKNOWN_EVENT_TYPE, {
        eventType,
      }),
    };
  }

  // Prepare audit log entry
  const auditEntry: AuditLogEntry = {
    patientUuid,
    eventType: eventDetail.eventType,
    message: messageParams
      ? `${eventDetail.message}~${JSON.stringify(messageParams)}`
      : eventDetail.message,
    module,
  };

  await post(AUDIT_LOG_URL, auditEntry);
  return { logged: true };
  // TODO: handle specific error cases when audit log fails
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(i18next.t(AUDIT_LOG_ERROR_MESSAGES.LOG_FAILED), error);
  //   return {
  //     logged: false,
  //     error:
  //       error instanceof Error
  //         ? error.message
  //         : i18next.t(AUDIT_LOG_ERROR_MESSAGES.UNKNOWN_ERROR),
  //   };
  // }
};
