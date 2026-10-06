import { buildRunReportUrl, formatDateForQuery } from '../reportService';

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
});
