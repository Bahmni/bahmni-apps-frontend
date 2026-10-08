import { AUDIT_LOG_EVENT_DETAILS, scheduleReport } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { useCallback } from 'react';
import type {
  ReportDefinition,
  FormatKey,
} from '../components/ReportList/models';
import { dispatchReportAuditEvent } from './reportAuditEvent';

export const useQueueReport = () => {
  const { user } = useActivePractitioner();

  const queueReport = useCallback(
    async (
      report: ReportDefinition & { id: string },
      format: FormatKey,
      startDate?: Date | null,
      endDate?: Date | null,
      defaultPaperSize?: string,
      macroTemplateLocation?: string | null,
    ): Promise<boolean> => {
      // Without a resolved username we can't attribute the scheduled report
      // to anyone server-side — fail instead of silently scheduling it under
      // an empty username (e.g. session cookie missing/expired).
      if (!user?.username) {
        // eslint-disable-next-line no-console
        console.error('Error queueing report: no current user');
        return false;
      }

      try {
        await scheduleReport({
          reportName: report.name,
          reportFormat: format,
          userName: user.username,
          startDate,
          endDate,
          paperSize: report.config?.paperSize ?? defaultPaperSize,
          macroTemplateLocation,
        });

        dispatchReportAuditEvent(
          AUDIT_LOG_EVENT_DETAILS.RUN_REPORT,
          report.name,
        );
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error queueing report:', error);
        return false;
      }
    },
    [user?.username],
  );

  return { queueReport };
};
