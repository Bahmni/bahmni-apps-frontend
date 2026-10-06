import {
  DatePicker,
  DatePickerInput,
  Dropdown,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { useReportTableState } from '../../hooks/useReportTableState';
import type { AppliedFilters, FormatKey, ReportDefinition } from './models';
import styles from './styles/ReportsTable.module.scss';
import { formatItemToString, requiresDateRange } from './utils';

interface ReportsTableProps {
  reports: Array<ReportDefinition & { id: string }>;
  appliedFilters: AppliedFilters;
  availableFormats: FormatKey[];
  defaultPaperSize?: string;
}

export const ReportsTable = React.memo<ReportsTableProps>(
  ({ reports, appliedFilters, availableFormats, defaultPaperSize }) => {
    const { t } = useTranslation();
    const {
      rowFilters,
      errors,
      isRunning,
      updateRow,
      clearRowFieldError,
      handleRunReport,
    } = useReportTableState(reports, appliedFilters, defaultPaperSize);

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
              <th className={styles.formatColumn}>
                {t('REPORTS_FORMAT_LABEL')}
              </th>
              <th className={styles.actionsColumn}>
                {t('REPORTS_ACTIONS_HEADER')}
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const filters = rowFilters(report.id);
              const rowErrors = errors(report.id);
              const needsDates = requiresDateRange(report);
              const running = isRunning(report.id);

              return (
                <tr key={report.id}>
                  <td
                    className={
                      showDateColumns
                        ? styles.nameColumn
                        : styles.nameColumnWide
                    }
                  >
                    {report.name}
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
                              invalid={!!rowErrors?.startDate}
                              invalidText={rowErrors?.startDate}
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
                            onChange={(dates) => {
                              updateRow(report.id, {
                                endDate: dates[0] ?? null,
                              });
                              clearRowFieldError(report.id, 'endDate');
                            }}
                            value={filters.endDate ?? undefined}
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
                      itemToString={formatItemToString(t)}
                      selectedItem={filters.format}
                      invalid={!!rowErrors?.format}
                      invalidText={rowErrors?.format}
                      onChange={({ selectedItem }) => {
                        updateRow(report.id, { format: selectedItem });
                        clearRowFieldError(report.id, 'format');
                      }}
                    />
                  </td>
                  <td className={styles.actionsColumn}>
                    {running ? (
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
  },
);

ReportsTable.displayName = 'ReportsTable';

export default ReportsTable;
