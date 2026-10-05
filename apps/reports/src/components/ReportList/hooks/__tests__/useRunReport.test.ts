import { buildRunReportUrl, dispatchAuditEvent } from '@bahmni/services';
import { renderHook } from '@testing-library/react';
import type { ReportDefinition } from '../../models';
import { useRunReport } from '../useRunReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
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
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => window);
    mockBuildRunReportUrl.mockReturnValue(
      'https://example.com/bahmnireports/report?name=OPD+Visit+Count',
    );
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('builds the report URL, opens it in a new window, dispatches an audit event, and reports success', () => {
    const { result } = renderHook(() => useRunReport());
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');

    const opened = result.current.runReport(report, 'PDF', startDate, endDate);

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      report.name,
      'PDF',
      startDate,
      endDate,
      report.config?.paperSize,
    );
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/bahmnireports/report?name=OPD+Visit+Count',
      '_blank',
    );
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'RUN_REPORT',
      messageParams: { reportName: report.name },
      module: 'MODULE_LABEL_REPORTS_KEY',
    });
    expect(opened).toBe(true);
  });

  it('severs the opener reference on the opened window to prevent reverse tabnabbing', () => {
    const fakeWindow = { opener: {} } as Window;
    windowOpenSpy.mockImplementation(() => fakeWindow);
    const { result } = renderHook(() => useRunReport());

    result.current.runReport(report, 'PDF');

    expect(fakeWindow.opener).toBeNull();
  });

  it('works without dates for reports that do not require a date range', () => {
    const { result } = renderHook(() => useRunReport());

    const opened = result.current.runReport(report, 'CSV');

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      report.name,
      'CSV',
      undefined,
      undefined,
      report.config?.paperSize,
    );
    expect(windowOpenSpy).toHaveBeenCalled();
    expect(opened).toBe(true);
  });

  it('falls back to the app-level default paper size when the report has none configured', () => {
    const reportWithoutPaperSize: ReportDefinition & { id: string } = {
      id: 'r2',
      name: 'Registered Patient Report',
      type: 'visits',
      config: {},
    };
    const { result } = renderHook(() => useRunReport());

    result.current.runReport(
      reportWithoutPaperSize,
      'PDF',
      undefined,
      undefined,
      'A3',
    );

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      reportWithoutPaperSize.name,
      'PDF',
      undefined,
      undefined,
      'A3',
    );
  });

  it('prefers the report-level paper size over the app-level default', () => {
    const { result } = renderHook(() => useRunReport());

    result.current.runReport(report, 'PDF', undefined, undefined, 'A3');

    expect(mockBuildRunReportUrl).toHaveBeenCalledWith(
      report.name,
      'PDF',
      undefined,
      undefined,
      report.config?.paperSize,
    );
  });

  it('reports failure without dispatching an audit event when the pop-up is blocked', () => {
    windowOpenSpy.mockImplementation(() => null);
    const { result } = renderHook(() => useRunReport());

    const opened = result.current.runReport(report, 'PDF');

    expect(windowOpenSpy).toHaveBeenCalled();
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    expect(opened).toBe(false);
  });

  it('logs the error and does not throw or dispatch an audit event when building the URL fails', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockBuildRunReportUrl.mockImplementation(() => {
      throw new Error('boom');
    });

    const { result } = renderHook(() => useRunReport());

    let opened: boolean | undefined;
    expect(() => {
      opened = result.current.runReport(report, 'PDF');
    }).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error running report:',
      expect.any(Error),
    );
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    expect(opened).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('returns a stable runReport reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useRunReport());
    const firstRunReport = result.current.runReport;

    rerender();

    expect(result.current.runReport).toBe(firstRunReport);
  });
});
