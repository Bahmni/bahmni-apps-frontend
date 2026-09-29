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
    ) => {
      try {
        const url = buildRunReportUrl(
          report.name,
          format,
          startDate,
          endDate,
          report.config?.paperSize,
        );

        window.open(url);

        dispatchAuditEvent({
          eventType: 'RUN_REPORT',
          messageParams: { reportName: report.name },
          module: 'MODULE_LABEL_REPORTS_KEY',
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error running report:', error);
      }
    },
    [],
  );

  return { runReport };
};
