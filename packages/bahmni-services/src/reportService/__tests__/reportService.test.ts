import { get, post } from '../../api';
import {
  buildRunReportUrl,
  formatDateForQuery,
  scheduleReport,
  uploadReportTemplate,
} from '../reportService';

jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('formatDateForQuery', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-03-15');
    const formatted = formatDateForQuery(date);
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return null for null input', () => {
    expect(formatDateForQuery(null)).toBeNull();
  });
});

describe('buildRunReportUrl', () => {
  it('should build URL with basic parameters', () => {
    const url = buildRunReportUrl(
      'Test Report',
      'PDF',
      undefined,
      undefined,
      'A4',
    );
    expect(url).toContain('/bahmnireports/report?');
    expect(url).toMatch(/name=Test[\s+%20]Report/);
    expect(url).toContain('responseType=application%2Fpdf');
    expect(url).toContain('paperSize=A4');
    expect(url).toContain('appName=reports');
  });

  it('should include dates when provided', () => {
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');
    const url = buildRunReportUrl('Test', 'CSV', startDate, endDate);
    expect(url).toContain('startDate=');
    expect(url).toContain('endDate=');
  });

  it('should use default paper size when not provided', () => {
    const url = buildRunReportUrl('Test', 'PDF');
    expect(url).toContain('paperSize=A4');
  });

  it('should handle CUSTOM EXCEL format', () => {
    const url = buildRunReportUrl('Test', 'CUSTOM EXCEL');
    expect(url).toContain('responseType=application%2Fvnd.ms-excel-custom');
  });

  it('should include macroTemplateLocation when provided', () => {
    const url = buildRunReportUrl(
      'Test',
      'CUSTOM EXCEL',
      undefined,
      undefined,
      'A4',
      'reports',
      'abc-template.xlsx',
    );
    expect(url).toContain('macroTemplateLocation=abc-template.xlsx');
  });

  it('should omit macroTemplateLocation when not provided', () => {
    const url = buildRunReportUrl('Test', 'PDF');
    expect(url).not.toContain('macroTemplateLocation');
  });
});

describe('scheduleReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should GET the schedule endpoint with report params and userName', async () => {
    (get as jest.Mock).mockResolvedValue(undefined);

    await scheduleReport(
      'Test Report',
      'PDF',
      'superman',
      new Date('2024-03-01'),
      new Date('2024-03-31'),
      'A4',
    );

    expect(get).toHaveBeenCalledTimes(1);
    const url = (get as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/bahmnireports/schedule?');
    expect(url).toContain('userName=superman');
    expect(url).toContain('startDate=');
    expect(url).toContain('endDate=');
  });

  it('should include macroTemplateLocation when provided', async () => {
    (get as jest.Mock).mockResolvedValue(undefined);

    await scheduleReport(
      'Test Report',
      'CUSTOM EXCEL',
      'superman',
      undefined,
      undefined,
      'A4',
      'reports',
      'abc-template.xlsx',
    );

    const url = (get as jest.Mock).mock.calls[0][0];
    expect(url).toContain('macroTemplateLocation=abc-template.xlsx');
  });
});

describe('uploadReportTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should POST the file as multipart form data and return the template location', async () => {
    (post as jest.Mock).mockResolvedValue('uuid-template.xlsx');
    const file = new File(['content'], 'template.xlsx');

    const result = await uploadReportTemplate(file);

    expect(result).toBe('uuid-template.xlsx');
    expect(post).toHaveBeenCalledTimes(1);
    const [url, formData] = (post as jest.Mock).mock.calls[0];
    expect(url).toBe('/bahmnireports/upload');
    expect(formData.get('file')).toBe(file);
  });
});
