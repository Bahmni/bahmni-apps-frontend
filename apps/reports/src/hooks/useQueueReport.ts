import {
  AUDIT_LOG_EVENT_DETAILS,
  buildScheduleReportUrl,
  dispatchAuditEvent,
  getCurrentUser,
  scheduleReport,
  useTranslation,
  type AuditEventType,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useMutation } from '@tanstack/react-query';
import type {
  FormatKey,
  ReportDefinition,
} from '../components/ReportList/models';

export interface QueueReportInput {
  report: ReportDefinition & { id: string };
  format: FormatKey;
  startDate?: Date | null;
  endDate?: Date | null;
  defaultPaperSize?: string;
  reportTemplateLocation?: string | null;
}

export const useQueueReport = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const mutation = useMutation({
    mutationFn: async (input: QueueReportInput): Promise<string> => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Unable to resolve the current user');
      }

      const url = buildScheduleReportUrl(
        input.report.name,
        input.format,
        user.username,
        input.startDate,
        input.endDate,
        input.report.config?.paperSize ?? input.defaultPaperSize,
        input.reportTemplateLocation,
      );
      await scheduleReport(url);
      return input.report.name;
    },
    onSuccess: (reportName) => {
      addNotification({
        title: t('REPORTS_QUEUE_SUCCESS_TITLE'),
        message: t('REPORTS_QUEUE_SUCCESS_MESSAGE', { reportName }),
        type: 'success',
      });
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.RUN_REPORT
          .eventType as AuditEventType,
        messageParams: { reportName },
        module: AUDIT_LOG_EVENT_DETAILS.RUN_REPORT.module,
      });
    },
    onError: () => {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_QUEUE_ERROR_MESSAGE'),
        type: 'error',
      });
    },
  });

  return mutation;
};
