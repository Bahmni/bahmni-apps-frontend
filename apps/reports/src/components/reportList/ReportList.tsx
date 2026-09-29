import {
  Accordion,
  AccordionItem,
  CodeSnippetSkeleton,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import React, { useEffect, useMemo, useState } from 'react';
import { useReportsAppConfig } from './hooks/useReportsAppConfig';
import { useReportsConfig } from './hooks/useReportsConfig';
import type { AppliedFilters, FormatKey } from './models';
import ReportsTable from './ReportsTable';
import styles from './styles/ReportList.module.scss';
import TableFilters from './TableFilters';
import {
  filterReportsByPrivilege,
  groupReportsByDateRequirement,
  reportsConfigToArray,
  resolveSupportedFormats,
} from './utils';

const NO_FILTERS: AppliedFilters = {
  startDate: null,
  endDate: null,
  format: null,
  version: 0,
};

export const ReportList: React.FC = () => {
  const { t } = useTranslation();
  const { userPrivileges, isLoading: privilegesLoading } = useUserPrivilege();
  const { addNotification } = useNotification();
  const {
    data: reportsConfig,
    isLoading: configLoading,
    error: configError,
  } = useReportsConfig();
  const { data: appConfig } = useReportsAppConfig();

  useEffect(() => {
    if (configError) {
      addNotification({
        title: t('REPORTS_ERROR_TITLE'),
        message: t('REPORTS_CONFIG_LOAD_ERROR'),
        type: 'error',
      });
    }
  }, [configError, addNotification, t]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [format, setFormat] = useState<FormatKey | null>(null);
  const [appliedFilters, setAppliedFilters] =
    useState<AppliedFilters>(NO_FILTERS);

  const visibleReports = useMemo(() => {
    if (!reportsConfig) return [];
    return filterReportsByPrivilege(
      reportsConfigToArray(reportsConfig),
      userPrivileges,
    );
  }, [reportsConfig, userPrivileges]);

  const supportedFormats = useMemo(
    () => resolveSupportedFormats(appConfig?.config?.supportedFormats),
    [appConfig],
  );
  const defaultPaperSize = appConfig?.config?.paperSize;

  const { dateRangeReports, noDateRangeReports } = useMemo(
    () => groupReportsByDateRequirement(visibleReports),
    [visibleReports],
  );

  const handleApply = () => {
    setAppliedFilters((prev) => ({
      startDate,
      endDate,
      format,
      version: prev.version + 1,
    }));
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setFormat(null);
    setAppliedFilters((prev) => ({ ...NO_FILTERS, version: prev.version + 1 }));
  };

  if (configLoading || privilegesLoading) {
    return (
      <CodeSnippetSkeleton
        id="reports-config-loading"
        data-testid="reports-config-loading"
        className={styles.fullWidth}
        type="multi"
      />
    );
  }

  if (configError) {
    return null;
  }

  if (!reportsConfig || Object.keys(reportsConfig).length === 0) {
    return (
      <p
        id="reports-empty-state"
        data-testid="reports-empty-state"
        className={styles.emptyState}
      >
        {t('REPORTS_EMPTY_STATE_MESSAGE')}
      </p>
    );
  }

  return (
    <div
      id="report-list"
      data-testid="report-list"
      className={styles.reportList}
    >
      <TableFilters
        startDate={startDate}
        endDate={endDate}
        format={format}
        availableFormats={supportedFormats}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFormatChange={setFormat}
        onReset={handleReset}
        onApply={handleApply}
      />
      <Accordion align="start">
        <AccordionItem
          title={t('REPORTS_DATE_RANGE_SECTION_TITLE')}
          testId="reports-date-range-section"
          open
        >
          <ReportsTable
            reports={dateRangeReports}
            appliedFilters={appliedFilters}
            availableFormats={supportedFormats}
            defaultPaperSize={defaultPaperSize}
          />
        </AccordionItem>
        <AccordionItem
          title={t('REPORTS_NO_DATE_RANGE_SECTION_TITLE')}
          testId="reports-no-date-range-section"
          open
        >
          <ReportsTable
            reports={noDateRangeReports}
            appliedFilters={appliedFilters}
            availableFormats={supportedFormats}
            defaultPaperSize={defaultPaperSize}
          />
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ReportList;
