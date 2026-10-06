import { format } from 'date-fns';
import { BAHMNI_REPORTS_URL } from '../constants/app';
import { ISO_DATE_FORMAT } from '../date/constants';
import {
  DEFAULT_APP_NAME,
  DEFAULT_PAPER_SIZE,
  FORMAT_MIME_TYPES,
} from './constants';
import type { FormatKey } from './models';

export const formatDateForQuery = (date: Date | null): string | null => {
  if (!date) return null;
  return format(date, ISO_DATE_FORMAT);
};

export const buildRunReportUrl = (
  reportName: string,
  reportFormat: FormatKey,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  appName: string = DEFAULT_APP_NAME,
): string => {
  const mimeType = FORMAT_MIME_TYPES[reportFormat];
  const params = new URLSearchParams({
    name: reportName,
    responseType: mimeType,
    paperSize: paperSize ?? DEFAULT_PAPER_SIZE,
    appName,
  });

  if (startDate) {
    params.append('startDate', formatDateForQuery(startDate) ?? '');
  }
  if (endDate) {
    params.append('endDate', formatDateForQuery(endDate) ?? '');
  }

  return `${BAHMNI_REPORTS_URL}/report?${params.toString()}`;
};
