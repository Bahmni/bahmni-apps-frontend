import {
  hasPrivilege,
  type UserPrivilege,
  DEFAULT_SUPPORTED_FORMATS,
  FORMAT_MIME_TYPES,
} from '@bahmni/services';
import { startOfMonth, subDays } from 'date-fns';
import { FORMAT_I18N_KEYS, type DatePreset } from './constants';
import type {
  FormatKey,
  GroupedReports,
  ReportDefinition,
  ReportsConfig,
  ReportValidationError,
} from './models';

export const hasVisiblePrivilege = (
  userPrivileges: UserPrivilege[] | null,
  requiredPrivilege?: string,
): boolean => {
  if (!requiredPrivilege) return true;
  return hasPrivilege(userPrivileges, requiredPrivilege);
};

export const filterReportsByPrivilege = (
  reports: Array<ReportDefinition & { id: string }>,
  userPrivileges: UserPrivilege[] | null,
): Array<ReportDefinition & { id: string }> =>
  reports.filter((report) =>
    hasVisiblePrivilege(userPrivileges, report.requiredPrivilege),
  );

export const requiresDateRange = (report: ReportDefinition): boolean =>
  report.config?.dateRangeRequired !== false;

export const groupReportsByDateRequirement = (
  reports: Array<ReportDefinition & { id: string }>,
): GroupedReports => ({
  dateRangeReports: reports.filter(requiresDateRange),
  noDateRangeReports: reports.filter((r) => !requiresDateRange(r)),
});

export const resolveSupportedFormats = (
  configuredFormats?: string[],
): FormatKey[] => {
  if (!configuredFormats || configuredFormats.length === 0) {
    return DEFAULT_SUPPORTED_FORMATS;
  }
  const upperCaseFormats = configuredFormats.map((f) =>
    f.toUpperCase(),
  ) as FormatKey[];
  return upperCaseFormats.filter((f): f is FormatKey => f in FORMAT_MIME_TYPES);
};

export const presetToRange = (preset: DatePreset): [Date, Date] => {
  const today = new Date();
  switch (preset) {
    case 'THIS_MONTH':
      return [startOfMonth(today), today];
    case 'LAST_7_DAYS':
      return [subDays(today, 6), today];
    default:
      return [new Date(today), new Date(today)];
  }
};

export const formatItemToString =
  (t: (key: string) => string) =>
  (fmt: FormatKey | null): string =>
    fmt ? t(FORMAT_I18N_KEYS[fmt]) : '';

export interface ValidateReportRunInput {
  report: ReportDefinition & { id: string };
  requiresDateRange: boolean;
  format: FormatKey | null;
  startDate: Date | null;
  endDate: Date | null;
}

export const validateReportRun = (
  input: ValidateReportRunInput,
  t: (key: string, options?: { reportName?: string }) => string,
): ReportValidationError | null => {
  const { report, requiresDateRange, format, startDate, endDate } = input;

  // Check 1: No format selected
  if (!format) {
    return {
      field: 'format',
      message: t('REPORTS_SELECT_FORMAT_ERROR', {
        reportName: report.name,
      }),
    };
  }

  // Check 2: [Skipped - custom Excel template validation for BAH-5142]

  // Check 3: Missing date(s) for date-required report
  if (requiresDateRange && (!startDate || !endDate)) {
    if (!startDate && !endDate) {
      return {
        field: 'startDate',
        message: t('REPORTS_MISSING_BOTH_DATES_ERROR'),
      };
    }
    if (!startDate) {
      return {
        field: 'startDate',
        message: t('REPORTS_MISSING_START_DATE_ERROR'),
      };
    }
    return {
      field: 'endDate',
      message: t('REPORTS_MISSING_END_DATE_ERROR'),
    };
  }

  // Check 3b: Start date after end date (ticket-mandated fix over legacy's dead code)
  if (startDate && endDate && startDate > endDate) {
    return {
      field: 'endDate',
      message: t('REPORTS_DATE_ORDER_ERROR'),
    };
  }

  // Check 4: CSV not supported for concatenated reports
  if (report.type === 'concatenated' && format === 'CSV') {
    return {
      message: t('REPORTS_CSV_NOT_SUPPORTED_ERROR'),
    };
  }

  return null;
};

export const reportsConfigToArray = (
  config: ReportsConfig,
): Array<ReportDefinition & { id: string }> =>
  Object.entries(config).map(([id, report]) => ({
    id,
    ...report,
  }));
