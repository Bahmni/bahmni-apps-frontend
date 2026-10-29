import i18next from 'i18next';
import { get, post } from '../api';
import { isAuditLogEnabled } from '../applicationConfigService';
import {
  AUDIT_LOG_URL,
  AUDIT_LOG_EVENT_DETAILS,
  MODULE_LABELS,
  AUDIT_LOG_ERROR_MESSAGES,
} from './constants';
import {
  AuditLogEntry,
  AuditLogResponse,
  AuditEventType,
  AuditLogQueryParams,
  RawAuditLogEntry,
} from './models';
import { cleanAuditLogParams } from './utils';

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
      ? `${i18next.t(eventDetail.message)}~${JSON.stringify(messageParams)}`
      : i18next.t(eventDetail.message),
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

/**
 * Fetches audit log entries (read-only browse/filter list) from the backend.
 * Mirrors the legacy `auditLogService.getLogs` GET request, minus the
 * per-entry date/message transforms which callers apply separately
 * (see `parseAuditLogEntry` in `./utils`) so this stays a thin data-fetch.
 * @param params - Query params (username/patientId/startFrom/cursor/etc).
 * @returns Promise resolving to the raw audit log entries.
 */
export const fetchAuditLogs = async (
  params: AuditLogQueryParams,
): Promise<RawAuditLogEntry[]> => {
  return get<RawAuditLogEntry[]>(AUDIT_LOG_URL, {
    params: cleanAuditLogParams(params),
  });
};
