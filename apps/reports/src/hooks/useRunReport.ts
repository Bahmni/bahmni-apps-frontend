import {
  AUDIT_LOG_EVENT_DETAILS,
  buildRunReportUrl,
  dispatchAuditEvent,
  type AuditEventType,
} from '@bahmni/services';
import { useCallback } from 'react';
import type {
  ReportDefinition,
  FormatKey,
} from '../components/ReportList/models';

export const useRunReport = () => {
  const runReport = useCallback(
    (
      report: ReportDefinition & { id: string },
      format: FormatKey,
      startDate?: Date | null,
      endDate?: Date | null,
      defaultPaperSize?: string,
    ): boolean => {
      try {
        const url = buildRunReportUrl(
          report.name,
          format,
          startDate,
          endDate,
          report.config?.paperSize ?? defaultPaperSize,
        );

        // Passing 'noopener'/'noreferrer' in the window features string makes
        // window.open return null even on success (browsers withhold the
        // handle), which breaks pop-up-blocked detection below. Instead,
        // open normally and sever the opener reference manually — same
        // reverse-tabnabbing protection, without losing the return value.
        const reportWindow = window.open(url, '_blank');

        if (!reportWindow) {
          return false;
        }

        reportWindow.opener = null;

        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.RUN_REPORT
            .eventType as AuditEventType,
          messageParams: { reportName: report.name },
          module: AUDIT_LOG_EVENT_DETAILS.RUN_REPORT.module,
        });
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error running report:', error);
        return false;
      }
    },
    [],
  );

  return { runReport };
};
