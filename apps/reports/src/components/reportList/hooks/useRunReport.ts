import { dispatchAuditEvent } from '@bahmni/services';
import { useCallback } from 'react';
import type { ReportDefinition, FormatKey } from '../models';
import { buildRunReportUrl } from '../utils';

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

        const reportWindow = window.open(url);

        if (!reportWindow) {
          return false;
        }

        dispatchAuditEvent({
          eventType: 'RUN_REPORT',
          messageParams: { reportName: report.name },
          module: 'MODULE_LABEL_REPORTS_KEY',
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
