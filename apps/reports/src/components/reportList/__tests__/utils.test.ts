import { UserPrivilege } from '@bahmni/services';
import type { ReportDefinition, ReportsConfig } from '../models';
import {
  buildRunReportUrl,
  filterReportsByPrivilege,
  formatDateForQuery,
  groupReportsByDateRequirement,
  hasVisiblePrivilege,
  requiresDateRange,
  resolveSupportedFormats,
  validateReportRun,
  reportsConfigToArray,
  type ValidateReportRunInput,
} from '../utils';

describe('Report List Utils', () => {
  describe('hasVisiblePrivilege', () => {
    it('should return false when requiredPrivilege is falsy', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:reports' },
      ];
      expect(hasVisiblePrivilege(userPrivileges, undefined)).toBe(false);
      expect(hasVisiblePrivilege(userPrivileges, '')).toBe(false);
      expect(hasVisiblePrivilege(null, undefined)).toBe(false);
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
    ];

    it('should hide reports without requiredPrivilege', () => {
      const userPrivileges: UserPrivilege[] = [];
      const filtered = filterReportsByPrivilege(reports, userPrivileges);
      expect(filtered).toHaveLength(0);
    });

    it('should show only reports user has privilege for', () => {
      const userPrivileges: UserPrivilege[] = [
        { uuid: 'priv1', name: 'app:reports' },
      ];
      const filtered = filterReportsByPrivilege(reports, userPrivileges);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('report2');
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

  describe('formatDateForQuery', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      const formatted = formatDateForQuery(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return null for null input', () => {
      expect(formatDateForQuery(null)).toBeNull();
    });
  });

  describe('buildRunReportUrl', () => {
    it('should build URL with basic parameters', () => {
      const url = buildRunReportUrl(
        'Test Report',
        'PDF',
        undefined,
        undefined,
        'A4',
      );
      expect(url).toContain('/bahmnireports/report?');
      expect(url).toMatch(/name=Test[\s+%20]Report/);
      expect(url).toContain('responseType=application%2Fpdf');
      expect(url).toContain('paperSize=A4');
      expect(url).toContain('appName=reports');
    });

    it('should include dates when provided', () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');
      const url = buildRunReportUrl('Test', 'CSV', startDate, endDate);
      expect(url).toContain('startDate=');
      expect(url).toContain('endDate=');
    });

    it('should use default paper size when not provided', () => {
      const url = buildRunReportUrl('Test', 'PDF');
      expect(url).toContain('paperSize=A4');
    });

    it('should handle CUSTOM EXCEL format', () => {
      const url = buildRunReportUrl('Test', 'CUSTOM EXCEL');
      expect(url).toContain('responseType=application%2Fvnd.ms-excel-custom');
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
