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

const appendDateAndTemplateParams = (
  params: URLSearchParams,
  reportFormat: FormatKey,
  startDate?: Date | null,
  endDate?: Date | null,
  reportTemplateLocation?: string | null,
): void => {
  if (startDate) {
    params.append('startDate', formatDateForQuery(startDate) ?? '');
  }
  if (endDate) {
    params.append('endDate', formatDateForQuery(endDate) ?? '');
  }
  if (reportTemplateLocation && reportFormat === 'CUSTOM EXCEL') {
    params.append('macroTemplateLocation', reportTemplateLocation);
  }
};

export const buildRunReportUrl = (
  reportName: string,
  reportFormat: FormatKey,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  reportTemplateLocation?: string | null,
  appName: string = DEFAULT_APP_NAME,
): string => {
  const mimeType = FORMAT_MIME_TYPES[reportFormat];
  const params = new URLSearchParams({
    name: reportName,
    responseType: mimeType,
    paperSize: paperSize ?? DEFAULT_PAPER_SIZE,
    appName,
  });
  appendDateAndTemplateParams(
    params,
    reportFormat,
    startDate,
    endDate,
    reportTemplateLocation,
  );

  return `${BAHMNI_REPORTS_URL}/report?${params.toString()}`;
};

export const buildScheduleReportUrl = (
  reportName: string,
  reportFormat: FormatKey,
  userName: string,
  startDate?: Date | null,
  endDate?: Date | null,
  paperSize?: string,
  reportTemplateLocation?: string | null,
  appName: string = DEFAULT_APP_NAME,
): string => {
  const mimeType = FORMAT_MIME_TYPES[reportFormat];
  const params = new URLSearchParams({
    name: reportName,
    responseType: mimeType,
    paperSize: paperSize ?? DEFAULT_PAPER_SIZE,
    appName,
    userName,
  });
  appendDateAndTemplateParams(
    params,
    reportFormat,
    startDate,
    endDate,
    reportTemplateLocation,
  );

  return `${BAHMNI_REPORTS_URL}/schedule?${params.toString()}`;
};

export const scheduleReport = (url: string): Promise<void> => get<void>(url);

export const uploadReportTemplate = (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  return post<string, FormData>(`${BAHMNI_REPORTS_URL}/upload`, formData, {
    headers: { 'Content-Type': undefined },
  });
};
