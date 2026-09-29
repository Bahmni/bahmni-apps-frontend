import { dispatchAuditEvent } from '@bahmni/services';
import { renderHook } from '@testing-library/react';
import type { ReportDefinition } from '../../models';
import { buildRunReportUrl } from '../../utils';
import { useRunReport } from '../useRunReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  buildRunReportUrl: jest.fn(),
}));

const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;
const mockBuildRunReportUrl = buildRunReportUrl as jest.MockedFunction<
  typeof buildRunReportUrl
>;

describe('useRunReport', () => {
  const report: ReportDefinition & { id: string } = {
    id: 'r1',
    name: 'OPD Visit Count',
    type: 'visits',
    config: { paperSize: 'A4' },
  };

  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    mockBuildRunReportUrl.mockReturnValue(
      'https://example.com/bahmnireports/report?name=OPD+Visit+Count',
    );
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('builds the report URL, opens it in a new window, and dispatches an audit event', () => {
    const { result } = renderHook(() => useRunReport());
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');

    result.current.runReport(report, 'PDF', startDate, endDate);

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      report.name,
      'PDF',
      startDate,
      endDate,
      report.config?.paperSize,
    );
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/bahmnireports/report?name=OPD+Visit+Count',
    );
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'RUN_REPORT',
      messageParams: { reportName: report.name },
      module: 'MODULE_LABEL_REPORTS_KEY',
    });
  });

  it('works without dates for reports that do not require a date range', () => {
    const { result } = renderHook(() => useRunReport());

    result.current.runReport(report, 'CSV');

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      report.name,
      'CSV',
      undefined,
      undefined,
      report.config?.paperSize,
    );
    expect(windowOpenSpy).toHaveBeenCalled();
  });

  it('logs the error and does not throw or dispatch an audit event when building the URL fails', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockBuildRunReportUrl.mockImplementation(() => {
      throw new Error('boom');
    });

    const { result } = renderHook(() => useRunReport());

    expect(() => result.current.runReport(report, 'PDF')).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error running report:',
      expect.any(Error),
    );
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('returns a stable runReport reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useRunReport());
    const firstRunReport = result.current.runReport;

    rerender();

    expect(result.current.runReport).toBe(firstRunReport);
  });
});
