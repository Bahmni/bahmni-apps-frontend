import { Report } from '@/types/report';

const currentDate = new Date();

const availableFormats = {
  CSV: 'text/csv',
  HTML: 'text/html',
  EXCEL: 'application/vnd.ms-excel',
  PDF: 'application/pdf',
  'CUSTOM EXCEL': 'application/vnd.ms-excel-custom',
  ODS: 'application/vnd.oasis.opendocument.spreadsheet',
};

const availableDateRange = {
  Today: currentDate,
  'This Month': new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
  'Previous Month': new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1,
  ),
  'This Quarter': new Date(
    currentDate.getFullYear(),
    Math.floor(currentDate.getMonth() / 3) * 3,
    1,
  ),
  'This Year': new Date(currentDate.getFullYear(), 0, 1),
  'Last 7 days': new Date(new Date().setDate(currentDate.getDate() - 7)),
  'Last 30 days': new Date(new Date().setDate(currentDate.getDate() - 30)),
};

export const getReports: () => Record<string, Report> = () => ({
  '1': {
    id: '1',
    name: 'Visit Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '2': {
    id: '2',
    name: 'Form builder form Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '3': {
    id: '3',
    name: 'Diagnosis Count Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '4': {
    id: '4',
    name: 'Diabetes',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '5': {
    id: '5',
    name: 'OPD/IPD Visit Count',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '6': {
    id: '6',
    name: 'Radiology(X-Ray) Count',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '7': {
    id: '7',
    name: 'IPD Patients Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '8': {
    id: '8',
    name: 'Order Fulfillment Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '9': {
    id: '9',
    name: 'Generic program sample report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '10': {
    id: '10',
    name: 'Aggregation report for visits',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '11': {
    id: '11',
    name: 'HIV Program Pivot Report',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '12': {
    id: '12',
    name: 'OpenELIS Test Count',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '13': {
    id: '13',
    name: 'Odoo Invoicing Summary',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
  '14': {
    id: '14',
    name: 'Count of Immunizations',
    startDate: new Date(),
    endDate: new Date(),
    format: { text: 'HTML', value: 'text/html' },
    action: '',
  },
});

export const getAvailableDateRange = () =>
  Object.entries(availableDateRange).map(([text, value]) => ({
    text,
    value,
  }));

export const getAvailableFormats = () =>
  Object.entries(availableFormats).map(([text, value]) => ({
    text,
    value,
  }));
