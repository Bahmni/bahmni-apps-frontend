import { FormatKey } from './models';

export const REPORTS_JSON_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/reports.json';
export const REPORTS_APP_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/app.json';

export const FORMAT_I18N_KEYS: Record<FormatKey, string> = {
  PDF: 'REPORTS_FORMAT_PDF',
  CSV: 'REPORTS_FORMAT_CSV',
  HTML: 'REPORTS_FORMAT_HTML',
  EXCEL: 'REPORTS_FORMAT_EXCEL',
  'CUSTOM EXCEL': 'REPORTS_FORMAT_CUSTOM_EXCEL',
  ODS: 'REPORTS_FORMAT_ODS',
};

export type DatePreset = 'TODAY' | 'THIS_MONTH' | 'LAST_7_DAYS';

export const DATE_PRESETS: DatePreset[] = [
  'TODAY',
  'THIS_MONTH',
  'LAST_7_DAYS',
];

export const DATE_PRESET_I18N_KEYS: Record<DatePreset, string> = {
  TODAY: 'REPORTS_PRESET_TODAY',
  THIS_MONTH: 'REPORTS_PRESET_THIS_MONTH',
  LAST_7_DAYS: 'REPORTS_PRESET_LAST_7_DAYS',
};

export const QUERY_KEYS = {
  reportsConfig: ['reportsConfig'],
  reportsAppConfig: ['reportsAppConfig'],
} as const;
