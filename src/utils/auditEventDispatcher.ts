/**
 * Simple audit event dispatcher utility
 * Components use this to announce audit events, a global listener handles the actual logging
 */

import { AuditEventType } from '@types/auditLog';

export interface AuditEventPayload {
  eventType: AuditEventType;
  patientUuid?: string;
  messageParams?: Record<string, unknown>;
  module?: string;
}

/**
 * Dispatch an audit event to window
 * @param payload - Event payload
 */
export const dispatchAuditEvent = (payload: AuditEventPayload): void => {
  const event = new CustomEvent('bahmni-audit-log', { detail: payload });
  window.dispatchEvent(event);
};

/**
 * Set up global audit event listener
 * Call this once in your app to handle all audit events
 * @param handler - Function to handle audit events
 * @returns Cleanup function
 */
export const setupAuditEventListener = (
  handler: (payload: AuditEventPayload) => Promise<void>,
): (() => void) => {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AuditEventPayload>;
    handler(customEvent.detail);
  };

  window.addEventListener('bahmni-audit-log', listener);

  return () => {
    window.removeEventListener('bahmni-audit-log', listener);
  };
};
