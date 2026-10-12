import {
  AUDIT_LOG_EVENT_DETAILS,
  dispatchAuditEvent,
  type AuditEventType,
} from '@bahmni/services';

type ReportAuditEventDetails = (typeof AUDIT_LOG_EVENT_DETAILS)['RUN_REPORT'];

/** Shared by useRunReport/useQueueReport — both log a RUN_REPORT audit event
 * for the report name, per the ticket's AC (queueing reuses the same event
 * type as running, matching the legacy module's behavior). */
export const dispatchReportAuditEvent = (
  eventDetails: ReportAuditEventDetails,
  reportName: string,
): void => {
  dispatchAuditEvent({
    eventType: eventDetails.eventType as AuditEventType,
    messageParams: { reportName },
    module: eventDetails.module,
  });
};
