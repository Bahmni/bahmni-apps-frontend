import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useEffect, useState } from 'react';
import type {
  AppliedFilters,
  FormatKey,
  ReportDefinition,
  ReportFilters,
} from '../models';
import { requiresDateRange, validateReportRun } from '../utils';
import { useRunReport } from './useRunReport';

export interface RowErrors {
  format?: string;
  startDate?: string;
  endDate?: string;
}

export const useReportTableState = (
  reports: Array<ReportDefinition & { id: string }>,
  appliedFilters: AppliedFilters,
  defaultPaperSize?: string,
) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { runReport } = useRunReport();
  const [overrides, setOverrides] = useState<Record<string, ReportFilters>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({});
  const [runningReportId, setRunningReportId] = useState<string | null>(null);

  useEffect(() => {
    setOverrides({});
    setRowErrors({});
  }, [appliedFilters.version]);

  const rowFilters = (id: string): ReportFilters =>
    overrides[id] ?? {
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      format: appliedFilters.format,
    };

  const updateRow = (id: string, patch: Partial<ReportFilters>) =>
    setOverrides((prev) => ({
      ...prev,
      [id]: { ...rowFilters(id), ...patch },
    }));

  const clearRowFieldError = (id: string, field: keyof RowErrors) =>
    setRowErrors((prev) => {
      if (!prev[id]?.[field]) return prev;
      const next = { ...prev[id], [field]: undefined };
      return { ...prev, [id]: next };
    });

  const handleRunReport = (report: ReportDefinition & { id: string }) => {
    const filters = rowFilters(report.id);
    const validationErr = validateReportRun(
      {
        report,
        requiresDateRange: requiresDateRange(report),
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      (key: string, options?: { reportName?: string }) =>
        t(key, { defaultValue: key, ...options }),
    );

    if (validationErr) {
      addNotification({
        title: t('REPORTS_VALIDATION_ERROR_TITLE'),
        message: validationErr.message,
        type: 'error',
      });

      if (validationErr.field === 'format') {
        setRowErrors((prev) => ({
          ...prev,
          [report.id]: { format: validationErr.message },
        }));
      } else if (
        validationErr.field === 'startDate' ||
        validationErr.field === 'endDate'
      ) {
        const isMissingBoth = !filters.startDate && !filters.endDate;
        setRowErrors((prev) => ({
          ...prev,
          [report.id]: {
            startDate:
              validationErr.field === 'startDate' || isMissingBoth
                ? validationErr.message
                : undefined,
            endDate:
              validationErr.field === 'endDate' || isMissingBoth
                ? validationErr.message
                : undefined,
          },
        }));
      }
      return;
    }

    setRowErrors((prev) => {
      if (!(report.id in prev)) return prev;
      const next = { ...prev };
      delete next[report.id];
      return next;
    });

    setRunningReportId(report.id);
    const opened = runReport(
      report,
      filters.format as FormatKey,
      filters.startDate,
      filters.endDate,
      defaultPaperSize,
    );

    if (!opened) {
      setRunningReportId(null);
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_POPUP_BLOCKED_ERROR'),
        type: 'error',
      });
      return;
    }

    setTimeout(() => {
      setRunningReportId((current) => (current === report.id ? null : current));
    }, 300);
  };

  return {
    rowFilters,
    errors: (id: string) => rowErrors[id],
    isRunning: (id: string) => runningReportId === id,
    updateRow,
    clearRowFieldError,
    handleRunReport,
  };
};
