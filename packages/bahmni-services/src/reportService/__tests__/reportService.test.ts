import { get, post } from '../../api';
import {
  buildRunReportUrl,
  buildScheduleReportUrl,
  formatDateForQuery,
  scheduleReport,
  uploadReportTemplate,
} from '../reportService';

jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;

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

  it('should include macroTemplateLocation for CUSTOM EXCEL with a template location', () => {
    const url = buildRunReportUrl(
      'Test',
      'CUSTOM EXCEL',
      undefined,
      undefined,
      undefined,
      'uuid-template.xlsx',
    );
    expect(url).toContain('macroTemplateLocation=uuid-template.xlsx');
  });

  it('should omit macroTemplateLocation for non-CUSTOM-EXCEL formats even when provided', () => {
    const url = buildRunReportUrl(
      'Test',
      'PDF',
      undefined,
      undefined,
      undefined,
      'uuid-template.xlsx',
    );
    expect(url).not.toContain('macroTemplateLocation');
  });
});

describe('buildScheduleReportUrl', () => {
  it('should build the schedule URL with userName and basic parameters', () => {
    const url = buildScheduleReportUrl('Test Report', 'PDF', 'superman');
    expect(url).toContain('/bahmnireports/schedule?');
    expect(url).toContain('userName=superman');
    expect(url).toContain('responseType=application%2Fpdf');
    expect(url).toContain('paperSize=A4');
    expect(url).toContain('appName=reports');
  });

  it('should include dates when provided', () => {
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');
    const url = buildScheduleReportUrl(
      'Test',
      'CSV',
      'superman',
      startDate,
      endDate,
    );
    expect(url).toContain('startDate=');
    expect(url).toContain('endDate=');
  });

  it('should include macroTemplateLocation for CUSTOM EXCEL with a template location', () => {
    const url = buildScheduleReportUrl(
      'Test',
      'CUSTOM EXCEL',
      'superman',
      undefined,
      undefined,
      undefined,
      'uuid-template.xlsx',
    );
    expect(url).toContain('macroTemplateLocation=uuid-template.xlsx');
  });
});

describe('scheduleReport', () => {
  it('should GET the given schedule URL', async () => {
    mockGet.mockResolvedValue(undefined);
    const url = '/bahmnireports/schedule?name=Test';

    await scheduleReport(url);

    expect(mockGet).toHaveBeenCalledWith(url);
  });
});

describe('uploadReportTemplate', () => {
  it('should POST the file as multipart form data and return the stored filename', async () => {
    mockPost.mockResolvedValue('uuid-template.xlsx');
    const file = new File(['contents'], 'template.xlsx');

    const result = await uploadReportTemplate(file);

    expect(mockPost).toHaveBeenCalledWith(
      '/bahmnireports/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': undefined } },
    );
    const formData = mockPost.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(result).toBe('uuid-template.xlsx');
  });
});
