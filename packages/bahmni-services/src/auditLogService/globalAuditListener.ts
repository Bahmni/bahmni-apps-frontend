/**
 * Global audit event listener setup
 * Call this once in your application to handle all audit events
 */

import {
  setupAuditEventListener,
  AuditEventPayload,
} from './auditEventDispatcher';
import { logAuditEvent } from './auditLogService';

/**
 * Initialize global audit event listener
 * Call this once when your app starts
 * @returns Cleanup function to remove the listener
 */
export const initializeAuditListener = (): (() => void) => {
  const handleAuditEvent = async (payload: AuditEventPayload) => {
    await logAuditEvent(
      payload.patientUuid,
      payload.eventType,
      payload.messageParams,
      payload.module,
    );
  };

  return setupAuditEventListener(handleAuditEvent);
};
