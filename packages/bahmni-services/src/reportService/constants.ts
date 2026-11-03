import type { FormatKey } from './models';

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

export const DEFAULT_PAPER_SIZE = 'A4';
export const DEFAULT_APP_NAME = 'reports';
