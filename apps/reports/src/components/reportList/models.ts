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
  config: ReportConfig;
}

export type ReportsConfig = Record<string, ReportDefinition>;

export interface ReportsAppConfig {
  supportedFormats?: string[];
}

export type FormatKey =
  | 'PDF'
  | 'CSV'
  | 'HTML'
  | 'EXCEL'
  | 'CUSTOM EXCEL'
  | 'ODS';

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

export interface RunReportInput {
  report: ReportDefinition & { id: string };
  format: FormatKey;
  startDate?: Date;
  endDate?: Date;
}

export interface GroupedReports {
  dateRangeReports: Array<ReportDefinition & { id: string }>;
  noDateRangeReports: Array<ReportDefinition & { id: string }>;
}
