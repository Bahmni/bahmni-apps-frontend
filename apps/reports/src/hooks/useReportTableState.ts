import { uploadReportTemplate, useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useEffect, useState } from 'react';
import type {
  AppliedFilters,
  FormatKey,
  ReportDefinition,
  ReportFilters,
} from '../components/ReportList/models';
import {
  requiresDateRange,
  resolveTemplateLocation,
  validateReportRun,
} from '../components/ReportList/utils';
import { useQueueReport } from './useQueueReport';
import { useRunReport } from './useRunReport';

export interface RowErrors {
  format?: string;
  startDate?: string;
  endDate?: string;
}

export const useReportTableState = (
  reports: Array<ReportDefinition & { id: string }>,
  appliedFilters: AppliedFilters,
  availableFormats: FormatKey[],
  defaultPaperSize?: string,
) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { runReport } = useRunReport();
  const { queueReport } = useQueueReport();
  const [overrides, setOverrides] = useState<Record<string, ReportFilters>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({});
  const [runningReportId, setRunningReportId] = useState<string | null>(null);
  const [queuingReportId, setQueuingReportId] = useState<string | null>(null);
  const [uploadingTemplateId, setUploadingTemplateId] = useState<string | null>(
    null,
  );

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

  const applyValidationErrors = (
    reportId: string,
    filters: ReportFilters,
    validationErr: NonNullable<ReturnType<typeof validateReportRun>>,
  ) => {
    if (validationErr.field === 'format') {
      setRowErrors((prev) => ({
        ...prev,
        [reportId]: { format: validationErr.message },
      }));
    } else if (
      validationErr.field === 'startDate' ||
      validationErr.field === 'endDate'
    ) {
      const isMissingBoth = !filters.startDate && !filters.endDate;
      setRowErrors((prev) => ({
        ...prev,
        [reportId]: {
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
  };

  const validate = (report: ReportDefinition & { id: string }) => {
    const filters = rowFilters(report.id);
    const validationErr = validateReportRun(
      {
        report,
        requiresDateRange: requiresDateRange(report),
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        templateLocation: filters.templateLocation,
      },
      (key: string, options?: { reportName?: string }) =>
        t(key, { defaultValue: key, ...options }),
    );
    return { filters, validationErr };
  };

  // Reset transient per-row state that's tied to the completed action's format
  // (e.g. a CUSTOM EXCEL template is single-use). Row *errors* are cleared as
  // soon as validation passes (see validateOrNotify) rather than here, so a
  // stale message doesn't linger on the row if the run/queue action itself
  // subsequently fails (popup blocked, server error, etc).
  const resetAfterSuccessfulRun = (
    reportId: string,
    filters: ReportFilters,
  ) => {
    if (filters.format === 'CUSTOM EXCEL') {
      updateRow(reportId, {
        format: availableFormats[0] ?? null,
        templateLocation: null,
      });
    }
  };

  // Validates the row, surfacing a notification + field-level error and
  // returning null on failure. On success, clears any stale field errors for
  // this row (regardless of whether the subsequent run/queue action itself
  // succeeds) and returns the filters to act on.
  const validateOrNotify = (
    report: ReportDefinition & { id: string },
  ): ReportFilters | null => {
    const { filters, validationErr } = validate(report);

    if (validationErr) {
      addNotification({
        title: t('REPORTS_VALIDATION_ERROR_TITLE'),
        message: validationErr.message,
        type: 'error',
      });
      applyValidationErrors(report.id, filters, validationErr);
      return null;
    }

    setRowErrors((prev) => {
      if (!(report.id in prev)) return prev;
      const next = { ...prev };
      delete next[report.id];
      return next;
    });

    return filters;
  };

  const handleRunReport = (report: ReportDefinition & { id: string }) => {
    const filters = validateOrNotify(report);
    if (!filters) return;

    setRunningReportId(report.id);
    const opened = runReport(
      report,
      filters.format as FormatKey,
      filters.startDate,
      filters.endDate,
      defaultPaperSize,
      resolveTemplateLocation(report, filters.templateLocation),
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

    resetAfterSuccessfulRun(report.id, filters);
    setTimeout(() => {
      setRunningReportId((current) => (current === report.id ? null : current));
    }, 300);
  };

  const handleQueueReport = async (
    report: ReportDefinition & { id: string },
  ) => {
    const filters = validateOrNotify(report);
    if (!filters) return;

    setQueuingReportId(report.id);
    const queued = await queueReport(
      report,
      filters.format as FormatKey,
      filters.startDate,
      filters.endDate,
      defaultPaperSize,
      resolveTemplateLocation(report, filters.templateLocation),
    );
    setQueuingReportId(null);

    if (!queued) {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_QUEUE_ERROR_MESSAGE'),
        type: 'error',
      });
      return;
    }

    addNotification({
      title: t('REPORTS_QUEUE_SUCCESS_TITLE'),
      message: t('REPORTS_QUEUE_SUCCESS_MESSAGE', { reportName: report.name }),
      type: 'success',
    });
    resetAfterSuccessfulRun(report.id, filters);
  };

  const handleTemplateUpload = async (
    report: ReportDefinition & { id: string },
    file: File,
  ) => {
    setUploadingTemplateId(report.id);
    try {
      const templateLocation = await uploadReportTemplate(file);
      updateRow(report.id, { templateLocation });
      clearRowFieldError(report.id, 'format');
    } catch {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_UPLOAD_ERROR'),
        type: 'error',
      });
    } finally {
      setUploadingTemplateId(null);
    }
  };

  return {
    rowFilters,
    errors: (id: string) => rowErrors[id],
    isRunning: (id: string) => runningReportId === id,
    isQueuing: (id: string) => queuingReportId === id,
    isUploadingTemplate: (id: string) => uploadingTemplateId === id,
    updateRow,
    clearRowFieldError,
    handleRunReport,
    handleQueueReport,
    handleTemplateUpload,
  };
};
