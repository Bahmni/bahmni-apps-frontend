import { FormatKey } from './models';

export const REPORTS_JSON_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/reports.json';
export const REPORTS_APP_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/app.json';

export const FORMAT_MIME_TYPES: Record<FormatKey, string> = {
  PDF: 'application/pdf',
  CSV: 'text/csv',
  HTML: 'text/html',
  EXCEL: 'application/vnd.ms-excel',
  'CUSTOM EXCEL': 'application/vnd.ms-excel-custom',
  ODS: 'application/vnd.oasis.opendocument.spreadsheet',
};

export const DEFAULT_SUPPORTED_FORMATS: FormatKey[] = [
  'PDF',
  'CSV',
  'HTML',
  'EXCEL',
  'CUSTOM EXCEL',
  'ODS',
];

export const FORMAT_I18N_KEYS: Record<FormatKey, string> = {
  PDF: 'REPORTS_FORMAT_PDF',
  CSV: 'REPORTS_FORMAT_CSV',
  HTML: 'REPORTS_FORMAT_HTML',
  EXCEL: 'REPORTS_FORMAT_EXCEL',
  'CUSTOM EXCEL': 'REPORTS_FORMAT_CUSTOM_EXCEL',
  ODS: 'REPORTS_FORMAT_ODS',
};

export const DEFAULT_PAPER_SIZE = 'A4';
export const DEFAULT_APP_NAME = 'reports';

export const QUERY_KEYS = {
  reportsConfig: ['reportsConfig'],
  reportsAppConfig: ['reportsAppConfig'],
} as const;
