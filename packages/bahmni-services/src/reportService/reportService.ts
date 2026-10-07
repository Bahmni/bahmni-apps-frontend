import { format } from 'date-fns';
import { get, post } from '../api';
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

const buildReportParams = (
  reportName: string,
  reportFormat: FormatKey,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  appName: string = DEFAULT_APP_NAME,
  macroTemplateLocation?: string | null,
): URLSearchParams => {
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
  if (macroTemplateLocation) {
    params.append('macroTemplateLocation', macroTemplateLocation);
  }

  return params;
};

export const buildRunReportUrl = (
  reportName: string,
  reportFormat: FormatKey,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  appName: string = DEFAULT_APP_NAME,
  macroTemplateLocation?: string | null,
): string => {
  const params = buildReportParams(
    reportName,
    reportFormat,
    startDate,
    endDate,
    paperSize,
    appName,
    macroTemplateLocation,
  );

  return `${BAHMNI_REPORTS_URL}/report?${params.toString()}`;
};

export const scheduleReport = (
  reportName: string,
  reportFormat: FormatKey,
  userName: string,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  appName: string = DEFAULT_APP_NAME,
  macroTemplateLocation?: string | null,
): Promise<void> => {
  const params = buildReportParams(
    reportName,
    reportFormat,
    startDate,
    endDate,
    paperSize,
    appName,
    macroTemplateLocation,
  );
  params.append('userName', userName);

  return get<void>(`${BAHMNI_REPORTS_URL}/schedule?${params.toString()}`);
};

export const uploadReportTemplate = (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  return post<string, FormData>(`${BAHMNI_REPORTS_URL}/upload`, formData);
};
