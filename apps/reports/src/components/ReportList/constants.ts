import { FormatKey } from './models';

export const FORMAT_I18N_KEYS: Record<FormatKey, string> = {
  PDF: 'REPORTS_FORMAT_PDF',
  CSV: 'REPORTS_FORMAT_CSV',
  HTML: 'REPORTS_FORMAT_HTML',
  EXCEL: 'REPORTS_FORMAT_EXCEL',
  'CUSTOM EXCEL': 'REPORTS_FORMAT_CUSTOM_EXCEL',
  ODS: 'REPORTS_FORMAT_ODS',
};

export type DatePreset =
  | 'TODAY'
  | 'THIS_MONTH'
  | 'PREVIOUS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS';

export const DATE_PRESETS: DatePreset[] = [
  'TODAY',
  'THIS_MONTH',
  'PREVIOUS_MONTH',
  'THIS_QUARTER',
  'THIS_YEAR',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
];

export const DATE_PRESET_I18N_KEYS: Record<DatePreset, string> = {
  TODAY: 'REPORTS_PRESET_TODAY',
  THIS_MONTH: 'REPORTS_PRESET_THIS_MONTH',
  PREVIOUS_MONTH: 'REPORTS_PRESET_PREVIOUS_MONTH',
  THIS_QUARTER: 'REPORTS_PRESET_THIS_QUARTER',
  THIS_YEAR: 'REPORTS_PRESET_THIS_YEAR',
  LAST_7_DAYS: 'REPORTS_PRESET_LAST_7_DAYS',
  LAST_30_DAYS: 'REPORTS_PRESET_LAST_30_DAYS',
};

export const QUERY_KEYS = {
  reportsConfig: ['reportsConfig'],
  reportsAppConfig: ['reportsAppConfig'],
} as const;

export const CUSTOM_EXCEL_TEMPLATE_ACCEPT = ['.xls', '.xlsx'];
