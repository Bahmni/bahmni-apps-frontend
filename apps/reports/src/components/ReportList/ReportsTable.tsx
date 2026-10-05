import {
  DataTable,
  DatePicker,
  DatePickerInput,
  Dropdown,
  FileUploader,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
  type DataTableColumn,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useMemo } from 'react';
import { useReportTableState } from '../../hooks/useReportTableState';
import type { AppliedFilters, FormatKey, ReportDefinition } from './models';
import styles from './styles/ReportsTable.module.scss';
import { formatItemToString, requiresDateRange } from './utils';

type ReportRow = ReportDefinition & { id: string };

interface ReportsTableProps {
  reports: ReportRow[];
  appliedFilters: AppliedFilters;
  availableFormats: FormatKey[];
  defaultPaperSize?: string;
  enableReportQueue?: boolean;
}

export const ReportsTable = React.memo<ReportsTableProps>(
  ({
    reports,
    appliedFilters,
    availableFormats,
    defaultPaperSize,
    enableReportQueue,
  }) => {
    const { t } = useTranslation();
    const {
      rowFilters,
      errors,
      isRunning,
      isQueueing,
      updateRow,
      clearRowFieldError,
      handleRunReport,
      handleQueueReport,
      handleTemplateUpload,
    } = useReportTableState(reports, appliedFilters, defaultPaperSize);

    // Grouped homogeneously by ReportList (one table per date-requirement
    // section), so this holds for every row — but derive it from the data
    // rather than assume, so a mixed list still degrades sensibly.
    const showDateColumns = reports.some(requiresDateRange);

    const columns: DataTableColumn<ReportRow>[] = useMemo(() => {
      const cols: DataTableColumn<ReportRow>[] = [
        { key: 'name', header: t('REPORTS_NAME_HEADER') },
      ];
      if (showDateColumns) {
        cols.push(
          { key: 'startDate', header: t('REPORTS_START_DATE_LABEL') },
          { key: 'endDate', header: t('REPORTS_END_DATE_LABEL') },
        );
      }
      cols.push(
        { key: 'format', header: t('REPORTS_FORMAT_LABEL') },
        { key: 'actions', header: t('REPORTS_ACTIONS_HEADER') },
      );
      return cols;
    }, [t, showDateColumns]);

    if (reports.length === 0) {
      return (
        <div className={styles.emptyState} data-testid="reports-table-empty">
          {t('REPORTS_NO_REPORTS_IN_SECTION')}
        </div>
      );
    }

    const renderCell = (report: ReportRow, columnKey: string) => {
      const filters = rowFilters(report.id);
      const rowErrors = errors(report.id);
      const needsDates = requiresDateRange(report);
      const running = isRunning(report.id);
      const queueing = isQueueing(report.id);
      const isCustomExcel = filters.format === 'CUSTOM EXCEL';
      const hasPreconfiguredTemplate = !!report.config?.macroTemplatePath;

      switch (columnKey) {
        case 'name':
          return report.name;

        case 'startDate':
          return (
            needsDates && (
              <DatePicker
                datePickerType="single"
                dateFormat="d/m/Y"
                value={filters.startDate ?? undefined}
                onChange={(dates) => {
                  updateRow(report.id, { startDate: dates[0] ?? null });
                  clearRowFieldError(report.id, 'startDate');
                }}
              >
                <DatePickerInput
                  id={`row-start-date-${report.id}`}
                  labelText={t('REPORTS_START_DATE_LABEL')}
                  hideLabel
                  placeholder={t('REPORTS_DATE_PLACEHOLDER')}
                  invalid={!!rowErrors?.startDate}
                  invalidText={rowErrors?.startDate}
                />
              </DatePicker>
            )
          );

        case 'endDate':
          return (
            needsDates && (
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
                  invalid={!!rowErrors?.endDate}
                  invalidText={rowErrors?.endDate}
                />
              </DatePicker>
            )
          );

        case 'format':
          return (
            <>
              <Dropdown
                id={`row-format-${report.id}`}
                titleText={t('REPORTS_FORMAT_LABEL')}
                hideLabel
                label={t('REPORTS_CHOOSE_FORMAT')}
                items={availableFormats}
                itemToString={formatItemToString(t)}
                selectedItem={filters.format}
                invalid={!!rowErrors?.format}
                invalidText={rowErrors?.format}
                onChange={({ selectedItem }) => {
                  updateRow(report.id, { format: selectedItem });
                  clearRowFieldError(report.id, 'format');
                  clearRowFieldError(report.id, 'template');
                }}
              />
              {isCustomExcel &&
                (hasPreconfiguredTemplate ? (
                  <span
                    className={styles.preconfiguredTemplate}
                    data-testid={`row-preconfigured-template-${report.id}`}
                  >
                    {t('REPORTS_PRECONFIGURED_TEMPLATE_LABEL')}
                  </span>
                ) : (
                  <>
                    <FileUploader
                      testId={`row-template-upload-${report.id}`}
                      accept={['.xls', '.xlsx']}
                      buttonLabel={t('REPORTS_UPLOAD_TEMPLATE_BUTTON_LABEL')}
                      labelTitle={t('REPORTS_UPLOAD_TEMPLATE_LABEL')}
                      filenameStatus={
                        filters.reportTemplateLocation ? 'complete' : 'edit'
                      }
                      onChange={(_event, data) => {
                        const file = data?.addedFiles?.[0]?.file;
                        if (file) {
                          handleTemplateUpload(report, file);
                        }
                      }}
                    />
                    {rowErrors?.template && (
                      <span
                        className={styles.templateError}
                        data-testid={`row-template-error-${report.id}`}
                      >
                        {rowErrors.template}
                      </span>
                    )}
                  </>
                ))}
            </>
          );

        case 'actions':
          return running || queueing ? (
            <InlineLoading
              description={t(
                running
                  ? 'REPORTS_RUNNING_LOADING_LABEL'
                  : 'REPORTS_QUEUEING_LOADING_LABEL',
              )}
            />
          ) : (
            <OverflowMenu flipped aria-label={t('REPORTS_ACTIONS_HEADER')}>
              <OverflowMenuItem
                itemText={t(
                  enableReportQueue
                    ? 'REPORTS_RUN_NOW_BUTTON_LABEL'
                    : 'REPORTS_RUN_BUTTON_LABEL',
                )}
                onClick={() => handleRunReport(report)}
              />
              {enableReportQueue && (
                <OverflowMenuItem
                  itemText={t('REPORTS_QUEUE_BUTTON_LABEL')}
                  onClick={() => handleQueueReport(report)}
                />
              )}
            </OverflowMenu>
          );

        default:
          return null;
      }
    };

    return (
      <DataTable
        columns={columns}
        rows={reports}
        ariaLabel={t('REPORTS_TABLE_ARIA_LABEL')}
        renderCell={renderCell}
        dataTestId="reports-table"
        className={styles.tableContainer}
      />
    );
  },
);

ReportsTable.displayName = 'ReportsTable';

export default ReportsTable;
