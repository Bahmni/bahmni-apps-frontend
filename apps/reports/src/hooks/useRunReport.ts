import { AUDIT_LOG_EVENT_DETAILS, buildRunReportUrl } from '@bahmni/services';
import { useCallback } from 'react';
import type {
  ReportDefinition,
  FormatKey,
} from '../components/ReportList/models';
import { dispatchReportAuditEvent } from './reportAuditEvent';

export const useRunReport = () => {
  const runReport = useCallback(
    (
      report: ReportDefinition & { id: string },
      format: FormatKey,
      startDate?: Date | null,
      endDate?: Date | null,
      defaultPaperSize?: string,
      macroTemplateLocation?: string | null,
    ): boolean => {
      try {
        const url = buildRunReportUrl(
          report.name,
          format,
          startDate,
          endDate,
          report.config?.paperSize ?? defaultPaperSize,
          undefined,
          macroTemplateLocation,
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

        dispatchReportAuditEvent(
          AUDIT_LOG_EVENT_DETAILS.RUN_REPORT,
          report.name,
        );
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
