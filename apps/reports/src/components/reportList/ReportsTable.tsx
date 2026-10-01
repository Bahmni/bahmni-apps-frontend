import {
  DatePicker,
  DatePickerInput,
  Dropdown,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import React, { useEffect, useState } from 'react';
import { FORMAT_I18N_KEYS } from './constants';
import { useRunReport } from './hooks/useRunReport';
import type {
  AppliedFilters,
  FormatKey,
  ReportDefinition,
  ReportFilters,
} from './models';
import styles from './styles/ReportsTable.module.scss';
import { requiresDateRange, validateReportRun } from './utils';

interface RowErrors {
  format?: string;
  startDate?: string;
  endDate?: string;
}

interface ReportsTableProps {
  reports: Array<ReportDefinition & { id: string }>;
  appliedFilters: AppliedFilters;
  availableFormats: FormatKey[];
  defaultPaperSize?: string;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reports,
  appliedFilters,
  availableFormats,
  defaultPaperSize,
}) => {
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

    setTimeout(() => setRunningReportId(null), 300);
  };

  if (reports.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="reports-table-empty">
        {t('REPORTS_NO_REPORTS_IN_SECTION')}
      </div>
    );
  }

  // Grouped homogeneously by ReportList (one table per date-requirement
  // section), so this holds for every row — but derive it from the data
  // rather than assume, so a mixed list still degrades sensibly.
  const showDateColumns = reports.some(requiresDateRange);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} data-testid="reports-table">
        <thead>
          <tr>
            <th
              className={
                showDateColumns ? styles.nameColumn : styles.nameColumnWide
              }
            >
              {t('REPORTS_NAME_HEADER')}
            </th>
            {showDateColumns && (
              <>
                <th className={styles.dateColumn}>
                  {t('REPORTS_START_DATE_LABEL')}
                </th>
                <th className={styles.dateColumn}>
                  {t('REPORTS_END_DATE_LABEL')}
                </th>
              </>
            )}
            <th className={styles.formatColumn}>{t('REPORTS_FORMAT_LABEL')}</th>
            <th className={styles.actionsColumn}>
              {t('REPORTS_ACTIONS_HEADER')}
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const filters = rowFilters(report.id);
            const errors = rowErrors[report.id];
            const needsDates = requiresDateRange(report);
            const isRunning = runningReportId === report.id;

            return (
              <tr key={report.id}>
                <td
                  className={
                    showDateColumns ? styles.nameColumn : styles.nameColumnWide
                  }
                >
                  {t(report.name, { defaultValue: report.name })}
                </td>
                {showDateColumns && (
                  <>
                    <td>
                      {needsDates && (
                        <DatePicker
                          datePickerType="single"
                          dateFormat="d/m/Y"
                          value={filters.startDate ?? undefined}
                          onChange={(dates) => {
                            updateRow(report.id, {
                              startDate: dates[0] ?? null,
                            });
                            clearRowFieldError(report.id, 'startDate');
                          }}
                        >
                          <DatePickerInput
                            id={`row-start-date-${report.id}`}
                            labelText={t('REPORTS_START_DATE_LABEL')}
                            hideLabel
                            placeholder={t('REPORTS_DATE_PLACEHOLDER')}
                            invalid={!!errors?.startDate}
                            invalidText={errors?.startDate}
                          />
                        </DatePicker>
                      )}
                    </td>
                    <td>
                      {needsDates && (
                        <DatePicker
                          datePickerType="single"
                          dateFormat="d/m/Y"
                          minDate={filters.startDate ?? undefined}
                          value={filters.endDate ?? undefined}
                          onChange={(dates) => {
                            updateRow(report.id, { endDate: dates[0] ?? null });
                            clearRowFieldError(report.id, 'endDate');
                          }}
                        >
                          <DatePickerInput
                            id={`row-end-date-${report.id}`}
                            labelText={t('REPORTS_END_DATE_LABEL')}
                            hideLabel
                            placeholder={t('REPORTS_DATE_PLACEHOLDER')}
                            invalid={!!errors?.endDate}
                            invalidText={errors?.endDate}
                          />
                        </DatePicker>
                      )}
                    </td>
                  </>
                )}
                <td>
                  <Dropdown
                    id={`row-format-${report.id}`}
                    titleText={t('REPORTS_FORMAT_LABEL')}
                    hideLabel
                    label={t('REPORTS_CHOOSE_FORMAT')}
                    items={availableFormats}
                    itemToString={(fmt) =>
                      fmt ? t(FORMAT_I18N_KEYS[fmt]) : ''
                    }
                    selectedItem={filters.format}
                    invalid={!!errors?.format}
                    invalidText={errors?.format}
                    onChange={({ selectedItem }) => {
                      updateRow(report.id, { format: selectedItem });
                      clearRowFieldError(report.id, 'format');
                    }}
                  />
                </td>
                <td className={styles.actionsColumn}>
                  {isRunning ? (
                    <InlineLoading
                      description={t('REPORTS_RUNNING_LOADING_LABEL')}
                    />
                  ) : (
                    <OverflowMenu
                      flipped
                      aria-label={t('REPORTS_ACTIONS_HEADER')}
                    >
                      <OverflowMenuItem
                        itemText={t('REPORTS_RUN_BUTTON_LABEL')}
                        onClick={() => handleRunReport(report)}
                      />
                    </OverflowMenu>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;
