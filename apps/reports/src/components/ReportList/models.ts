import type { FormatKey } from '@bahmni/services';

export type { FormatKey };

export interface ReportConfig {
  dateRangeRequired?: boolean;
  paperSize?: string;
  macroTemplatePath?: string;
  [key: string]: unknown;
}

export interface ReportDefinition {
  name: string;
  type: string;
  requiredPrivilege?: string;
  config?: ReportConfig;
}

export type ReportsConfig = Record<string, ReportDefinition>;

export interface ReportsAppConfig {
  config?: {
    supportedFormats?: string[];
    paperSize?: string;
  };
}

export interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  format: FormatKey | null;
}

/** `version` bumps on every Apply/Reset so rows re-sync even when values are unchanged. */
export interface AppliedFilters extends ReportFilters {
  version: number;
}

export interface ReportValidationError {
  field?: 'format' | 'startDate' | 'endDate';
  message: string;
}

export interface GroupedReports {
  dateRangeReports: Array<ReportDefinition & { id: string }>;
  noDateRangeReports: Array<ReportDefinition & { id: string }>;
}
