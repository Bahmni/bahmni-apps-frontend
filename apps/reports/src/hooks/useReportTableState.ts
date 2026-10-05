import { useTranslation } from '@bahmni/services';
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
  validateReportRun,
} from '../components/ReportList/utils';
import { useQueueReport } from './useQueueReport';
import { useRunReport } from './useRunReport';
import { useUploadReportTemplate } from './useUploadReportTemplate';

export interface RowErrors {
  format?: string;
  startDate?: string;
  endDate?: string;
  template?: string;
}

export const useReportTableState = (
  reports: Array<ReportDefinition & { id: string }>,
  appliedFilters: AppliedFilters,
  defaultPaperSize?: string,
) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { runReport } = useRunReport();
  const { mutate: queueReportMutate } = useQueueReport();
  const { mutate: uploadTemplateMutate } = useUploadReportTemplate();
  const [overrides, setOverrides] = useState<Record<string, ReportFilters>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({});
  const [runningReportId, setRunningReportId] = useState<string | null>(null);
  const [queueingReportId, setQueueingReportId] = useState<string | null>(null);

  useEffect(() => {
    setOverrides({});
    setRowErrors({});
  }, [appliedFilters.version]);

  const rowFilters = (id: string): ReportFilters =>
    overrides[id] ?? {
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      format: appliedFilters.format,
      reportTemplateLocation: null,
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

  const translate = (key: string, options?: { reportName?: string }) =>
    t(key, { defaultValue: key, ...options });

  const applyValidationErrors = (
    reportId: string,
    filters: ReportFilters,
    validationErr: NonNullable<ReturnType<typeof validateReportRun>>,
  ) => {
    addNotification({
      title: t('REPORTS_VALIDATION_ERROR_TITLE'),
      message: validationErr.message,
      type: 'error',
    });

    if (validationErr.field === 'format') {
      setRowErrors((prev) => ({
        ...prev,
        [reportId]: { format: validationErr.message },
      }));
    } else if (validationErr.field === 'template') {
      setRowErrors((prev) => ({
        ...prev,
        [reportId]: { template: validationErr.message },
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

  const clearRowErrors = (reportId: string) =>
    setRowErrors((prev) => {
      if (!(reportId in prev)) return prev;
      const next = { ...prev };
      delete next[reportId];
      return next;
    });

  const effectiveTemplateLocation = (
    report: ReportDefinition & { id: string },
    filters: ReportFilters,
  ): string | null =>
    filters.reportTemplateLocation ?? report.config?.macroTemplatePath ?? null;

  // Reads and writes `overrides` atomically via the functional setState form,
  // so it's safe to call from an async mutation callback whose closure was
  // created on a stale render — unlike reading `rowFilters`/`updateRow`
  // separately, this can't clobber an edit the user made while in flight.
  const resetTemplateIfUnchangedSince = (
    reportId: string,
    submittedFormat: FormatKey | null,
    submittedTemplateLocation: string | null,
  ) => {
    if (submittedFormat !== 'CUSTOM EXCEL') return;
    setOverrides((prev) => {
      const current = prev[reportId] ?? {
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        format: appliedFilters.format,
        reportTemplateLocation: null,
      };
      if (
        current.format !== submittedFormat ||
        current.reportTemplateLocation !== submittedTemplateLocation
      ) {
        return prev;
      }
      return {
        ...prev,
        [reportId]: { ...current, format: null, reportTemplateLocation: null },
      };
    });
  };

  const handleRunReport = (report: ReportDefinition & { id: string }) => {
    const filters = rowFilters(report.id);
    const templateLocation = effectiveTemplateLocation(report, filters);
    const validationErr = validateReportRun(
      {
        report,
        requiresDateRange: requiresDateRange(report),
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportTemplateLocation: templateLocation,
      },
      translate,
    );

    if (validationErr) {
      applyValidationErrors(report.id, filters, validationErr);
      return;
    }

    clearRowErrors(report.id);

    setRunningReportId(report.id);
    const opened = runReport(
      report,
      filters.format as FormatKey,
      filters.startDate,
      filters.endDate,
      defaultPaperSize,
      templateLocation,
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

    resetTemplateIfUnchangedSince(
      report.id,
      filters.format,
      filters.reportTemplateLocation,
    );

    setTimeout(() => {
      setRunningReportId((current) => (current === report.id ? null : current));
    }, 300);
  };

  const handleQueueReport = (report: ReportDefinition & { id: string }) => {
    const filters = rowFilters(report.id);
    const templateLocation = effectiveTemplateLocation(report, filters);
    const validationErr = validateReportRun(
      {
        report,
        requiresDateRange: requiresDateRange(report),
        format: filters.format,
        startDate: filters.startDate,
        endDate: filters.endDate,
        reportTemplateLocation: templateLocation,
      },
      translate,
    );

    if (validationErr) {
      applyValidationErrors(report.id, filters, validationErr);
      return;
    }

    clearRowErrors(report.id);

    setQueueingReportId(report.id);
    queueReportMutate(
      {
        report,
        format: filters.format as FormatKey,
        startDate: filters.startDate,
        endDate: filters.endDate,
        defaultPaperSize,
        reportTemplateLocation: templateLocation,
      },
      {
        onSuccess: () =>
          resetTemplateIfUnchangedSince(
            report.id,
            filters.format,
            filters.reportTemplateLocation,
          ),
        onSettled: () =>
          setQueueingReportId((current) =>
            current === report.id ? null : current,
          ),
      },
    );
  };

  const handleTemplateUpload = (
    report: ReportDefinition & { id: string },
    file: File,
  ) => {
    uploadTemplateMutate(file, {
      onSuccess: (reportTemplateLocation) => {
        updateRow(report.id, { reportTemplateLocation });
        clearRowFieldError(report.id, 'template');
      },
      onError: () => {
        addNotification({
          title: t('REPORTS_ERROR_TITLE'),
          message: t('REPORTS_UPLOAD_ERROR'),
          type: 'error',
        });
      },
    });
  };

  return {
    rowFilters,
    errors: (id: string) => rowErrors[id],
    isRunning: (id: string) => runningReportId === id,
    isQueueing: (id: string) => queueingReportId === id,
    updateRow,
    clearRowFieldError,
    handleRunReport,
    handleQueueReport,
    handleTemplateUpload,
  };
};
