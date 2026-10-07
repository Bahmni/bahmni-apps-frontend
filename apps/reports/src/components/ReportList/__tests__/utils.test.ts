import { UserPrivilege } from '@bahmni/services';
import {
  differenceInCalendarDays,
  isSameDay,
  startOfQuarter,
  startOfYear,
  subMonths,
} from 'date-fns';
import type { ReportDefinition, ReportsConfig } from '../models';
import {
  filterReportsByPrivilege,
  formatItemToString,
  groupReportsByDateRequirement,
  hasVisiblePrivilege,
  presetToRange,
  requiresDateRange,
  resolveSupportedFormats,
  resolveTemplateLocation,
  validateReportRun,
  reportsConfigToArray,
  type ValidateReportRunInput,
} from '../utils';

describe('Report List Utils', () => {
  describe('hasVisiblePrivilege', () => {
    it('should return true when requiredPrivilege is falsy', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:reports' },
      ];
      expect(hasVisiblePrivilege(userPrivileges, undefined)).toBe(true);
      expect(hasVisiblePrivilege(userPrivileges, '')).toBe(true);
      expect(hasVisiblePrivilege(null, undefined)).toBe(true);
    });

    it('should return true when user has the required privilege', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:reports' },
      ];
      expect(hasVisiblePrivilege(userPrivileges, 'app:reports')).toBe(true);
    });

    it('should return false when user lacks the required privilege', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:registration' },
      ];
      expect(hasVisiblePrivilege(userPrivileges, 'app:reports')).toBe(false);
    });

    it('should return false when userPrivileges is null', () => {
      expect(hasVisiblePrivilege(null, 'app:reports')).toBe(false);
    });
  });

  describe('filterReportsByPrivilege', () => {
    const reports: Array<ReportDefinition & { id: string }> = [
      {
        id: 'report1',
        name: 'Public Report',
        type: 'visits',
        config: {},
      },
      {
        id: 'report2',
        name: 'Restricted Report',
        type: 'visits',
        requiredPrivilege: 'app:reports',
        config: {},
      },
      {
        id: 'report3',
        name: 'Finance Report',
        type: 'visits',
        requiredPrivilege: 'app:finance',
        config: {},
      },
    ];

    it('should show reports without requiredPrivilege to everyone', () => {
      const userPrivileges: UserPrivilege[] = [];
      const filtered = filterReportsByPrivilege(reports, userPrivileges);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('report1');
    });

    it('should show public reports plus only the restricted reports the user has privilege for', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:reports' },
      ];
      const filtered = filterReportsByPrivilege(reports, userPrivileges);
      expect(filtered.map((r) => r.id)).toEqual(['report1', 'report2']);
    });
  });

  describe('requiresDateRange', () => {
    it('should return true by default (when dateRangeRequired is not set)', () => {
      const report: ReportDefinition = {
        name: 'Test',
        type: 'visits',
        config: {},
      };
      expect(requiresDateRange(report)).toBe(true);
    });

    it('should return true when dateRangeRequired is true', () => {
      const report: ReportDefinition = {
        name: 'Test',
        type: 'visits',
        config: { dateRangeRequired: true },
      };
      expect(requiresDateRange(report)).toBe(true);
    });

    it('should return false when dateRangeRequired is false', () => {
      const report: ReportDefinition = {
        name: 'Test',
        type: 'visits',
        config: { dateRangeRequired: false },
      };
      expect(requiresDateRange(report)).toBe(false);
    });
  });

  describe('groupReportsByDateRequirement', () => {
    const reports: Array<ReportDefinition & { id: string }> = [
      {
        id: 'r1',
        name: 'Date Required 1',
        type: 'visits',
        config: { dateRangeRequired: true },
      },
      {
        id: 'r2',
        name: 'No Date Required',
        type: 'visits',
        config: { dateRangeRequired: false },
      },
      {
        id: 'r3',
        name: 'Date Required 2 (default)',
        type: 'visits',
        config: {},
      },
    ];

    it('should group reports into date-required and no-date arrays', () => {
      const grouped = groupReportsByDateRequirement(reports);
      expect(grouped.dateRangeReports).toHaveLength(2);
      expect(grouped.noDateRangeReports).toHaveLength(1);
      expect(grouped.dateRangeReports.map((r) => r.id)).toEqual(['r1', 'r3']);
      expect(grouped.noDateRangeReports.map((r) => r.id)).toEqual(['r2']);
    });
  });

  describe('resolveSupportedFormats', () => {
    it('should return default formats when none configured', () => {
      expect(resolveSupportedFormats()).toEqual([
        'PDF',
        'CSV',
        'HTML',
        'EXCEL',
        'CUSTOM EXCEL',
        'ODS',
      ]);
      expect(resolveSupportedFormats([])).toEqual([
        'PDF',
        'CSV',
        'HTML',
        'EXCEL',
        'CUSTOM EXCEL',
        'ODS',
      ]);
    });

    it('should handle case-insensitive format names', () => {
      const configured = ['pdf', 'csv', 'html'];
      const result = resolveSupportedFormats(configured);
      expect(result).toEqual(['PDF', 'CSV', 'HTML']);
    });

    it('should filter out invalid format names', () => {
      const configured = ['pdf', 'invalid', 'csv'];
      const result = resolveSupportedFormats(configured);
      expect(result).toEqual(['PDF', 'CSV']);
    });
  });

  describe('validateReportRun', () => {
    const mockT = (key: string, options?: { reportName?: string }) => {
      const messages: Record<string, string> = {
        REPORTS_SELECT_FORMAT_ERROR: `Select format for the report: ${options?.reportName ?? ''}`,
        REPORTS_MISSING_BOTH_DATES_ERROR: 'Please select start and end dates',
        REPORTS_MISSING_START_DATE_ERROR: 'Please select start date',
        REPORTS_MISSING_END_DATE_ERROR: 'Please select end date',
        REPORTS_DATE_ORDER_ERROR: 'Start date cannot be later than end date',
        REPORTS_CSV_NOT_SUPPORTED_ERROR:
          'CSV format is not supported for concatenated reports',
        REPORTS_MISSING_TEMPLATE_ERROR: `Workbook template should be selected for generating report: ${options?.reportName ?? ''}`,
      };
      return messages[key] || key;
    };

    it('should fail when no format selected', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: false,
        format: null,
        startDate: null,
        endDate: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error).not.toBeNull();
      expect(error?.field).toBe('format');
    });

    it('should fail when dates missing for date-required report', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: true,
        format: 'PDF',
        startDate: null,
        endDate: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error?.field).toBe('startDate');
    });

    it('should fail when only start date provided', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: true,
        format: 'PDF',
        startDate: new Date('2024-03-01'),
        endDate: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error?.field).toBe('endDate');
    });

    it('should fail when start date is after end date', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: true,
        format: 'PDF',
        startDate: new Date('2024-03-31'),
        endDate: new Date('2024-03-01'),
      };
      const error = validateReportRun(input, mockT);
      expect(error?.field).toBe('endDate');
      expect(error?.message).toContain('later');
    });

    it('should fail when CUSTOM EXCEL selected without an uploaded or pre-configured template', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: false,
        format: 'CUSTOM EXCEL',
        startDate: null,
        endDate: null,
        templateLocation: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error?.message).toBe(
        'Workbook template should be selected for generating report: Test',
      );
    });

    it('should pass CUSTOM EXCEL validation when a template was uploaded', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: false,
        format: 'CUSTOM EXCEL',
        startDate: null,
        endDate: null,
        templateLocation: 'uuid-template.xlsx',
      };
      const error = validateReportRun(input, mockT);
      expect(error).toBeNull();
    });

    it('should pass CUSTOM EXCEL validation when a template is pre-configured', () => {
      const input: ValidateReportRunInput = {
        report: {
          id: 'r1',
          name: 'Test',
          type: 'visits',
          config: { macroTemplatePath: 'preconfigured.xlsx' },
        },
        requiresDateRange: false,
        format: 'CUSTOM EXCEL',
        startDate: null,
        endDate: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error).toBeNull();
    });

    it('should fail when CSV format used for concatenated report', () => {
      const input: ValidateReportRunInput = {
        report: {
          id: 'r1',
          name: 'Test',
          type: 'concatenated',
          config: {},
        },
        requiresDateRange: true,
        format: 'CSV',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
      };
      const error = validateReportRun(input, mockT);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('CSV');
    });

    it('should pass validation when all inputs valid', () => {
      const input: ValidateReportRunInput = {
        report: { id: 'r1', name: 'Test', type: 'visits', config: {} },
        requiresDateRange: true,
        format: 'PDF',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
      };
      const error = validateReportRun(input, mockT);
      expect(error).toBeNull();
    });

    it('should pass validation for no-date report without dates', () => {
      const input: ValidateReportRunInput = {
        report: {
          id: 'r1',
          name: 'Test',
          type: 'visits',
          config: { dateRangeRequired: false },
        },
        requiresDateRange: false,
        format: 'PDF',
        startDate: null,
        endDate: null,
      };
      const error = validateReportRun(input, mockT);
      expect(error).toBeNull();
    });
  });

  describe('presetToRange', () => {
    it('returns the start of the month through today for THIS_MONTH', () => {
      const [start, end] = presetToRange('THIS_MONTH');
      const today = new Date();
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(today.getMonth());
      expect(isSameDay(end, today)).toBe(true);
    });

    it('returns a 7-day-ago range for LAST_7_DAYS', () => {
      const [start, end] = presetToRange('LAST_7_DAYS');
      expect(isSameDay(end, new Date())).toBe(true);
      expect(differenceInCalendarDays(end, start)).toBe(7);
    });

    it('returns a 30-day-ago range for LAST_30_DAYS', () => {
      const [start, end] = presetToRange('LAST_30_DAYS');
      expect(isSameDay(end, new Date())).toBe(true);
      expect(differenceInCalendarDays(end, start)).toBe(30);
    });

    it('returns the start and end of last month for PREVIOUS_MONTH', () => {
      const [start, end] = presetToRange('PREVIOUS_MONTH');
      const previousMonth = subMonths(new Date(), 1);
      expect(start.getDate()).toBe(1);
      expect(start.getMonth()).toBe(previousMonth.getMonth());
      expect(end.getMonth()).toBe(previousMonth.getMonth());
      // end is the last day of that month, so the following day rolls into the next month
      const dayAfterEnd = new Date(end);
      dayAfterEnd.setDate(end.getDate() + 1);
      expect(dayAfterEnd.getMonth()).not.toBe(end.getMonth());
    });

    it('returns the start of the quarter through today for THIS_QUARTER', () => {
      const [start, end] = presetToRange('THIS_QUARTER');
      expect(isSameDay(start, startOfQuarter(new Date()))).toBe(true);
      expect(isSameDay(end, new Date())).toBe(true);
    });

    it('returns the start of the year through today for THIS_YEAR', () => {
      const [start, end] = presetToRange('THIS_YEAR');
      expect(isSameDay(start, startOfYear(new Date()))).toBe(true);
      expect(isSameDay(end, new Date())).toBe(true);
    });

    it('returns today through today for TODAY', () => {
      const [start, end] = presetToRange('TODAY');
      expect(isSameDay(start, new Date())).toBe(true);
      expect(isSameDay(end, new Date())).toBe(true);
    });

    it('returns independent Date instances for TODAY, not the same reference', () => {
      const [start, end] = presetToRange('TODAY');
      expect(start).not.toBe(end);
    });
  });

  describe('resolveTemplateLocation', () => {
    const report: ReportDefinition & { id: string } = {
      id: 'r1',
      name: 'Test',
      type: 'visits',
      config: { macroTemplatePath: 'preconfigured.xlsx' },
    };

    it('prefers the uploaded template location over the pre-configured one', () => {
      expect(resolveTemplateLocation(report, 'uploaded.xlsx')).toBe(
        'uploaded.xlsx',
      );
    });

    it('falls back to the pre-configured macroTemplatePath', () => {
      expect(resolveTemplateLocation(report, null)).toBe('preconfigured.xlsx');
    });

    it('returns null when neither is set', () => {
      const noTemplateReport: ReportDefinition & { id: string } = {
        id: 'r2',
        name: 'Test 2',
        type: 'visits',
        config: {},
      };
      expect(resolveTemplateLocation(noTemplateReport, null)).toBeNull();
    });
  });

  describe('formatItemToString', () => {
    const mockT = (key: string) => key;

    it('returns an empty string for a null format', () => {
      expect(formatItemToString(mockT)(null)).toBe('');
    });

    it('returns the translated i18n key for each format', () => {
      expect(formatItemToString(mockT)('PDF')).toBe('REPORTS_FORMAT_PDF');
      expect(formatItemToString(mockT)('CSV')).toBe('REPORTS_FORMAT_CSV');
    });
  });

  describe('reportsConfigToArray', () => {
    it('should convert config object to array with ids', () => {
      const config: ReportsConfig = {
        report1: {
          name: 'Report 1',
          type: 'visits',
          config: {},
        },
        report2: {
          name: 'Report 2',
          type: 'visits',
          config: {},
        },
      };
      const array = reportsConfigToArray(config);
      expect(array).toHaveLength(2);
      expect(array[0].id).toBe('report1');
      expect(array[1].id).toBe('report2');
    });

    it('should handle empty config', () => {
      const array = reportsConfigToArray({});
      expect(array).toHaveLength(0);
    });
  });
});
