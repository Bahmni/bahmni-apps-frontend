import { dispatchAuditEvent, scheduleReport } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { renderHook } from '@testing-library/react';
import type { ReportDefinition } from '../../components/ReportList/models';
import { useQueueReport } from '../useQueueReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  dispatchAuditEvent: jest.fn(),
  scheduleReport: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
}));

const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;
const mockScheduleReport = scheduleReport as jest.MockedFunction<
  typeof scheduleReport
>;
const mockUseActivePractitioner = useActivePractitioner as jest.MockedFunction<
  typeof useActivePractitioner
>;

describe('useQueueReport', () => {
  const report: ReportDefinition & { id: string } = {
    id: 'r1',
    name: 'OPD Visit Count',
    type: 'visits',
    config: { paperSize: 'A4' },
  };

  const activeUser = {
    display: 'Super Man',
    username: 'superman',
    uuid: 'user-uuid',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActivePractitioner.mockReturnValue({
      user: activeUser,
      practitioner: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useActivePractitioner>);
    mockScheduleReport.mockResolvedValue(undefined);
  });

  it('schedules the report with the current username, dispatches a RUN_REPORT audit event (same as the run action, per the ticket AC), and reports success', async () => {
    const { result } = renderHook(() => useQueueReport());
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');

    const queued = await result.current.queueReport(
      report,
      'PDF',
      startDate,
      endDate,
    );

    expect(mockScheduleReport).toHaveBeenCalledWith({
      reportName: report.name,
      reportFormat: 'PDF',
      userName: 'superman',
      startDate,
      endDate,
      paperSize: report.config?.paperSize,
      macroTemplateLocation: undefined,
    });
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'RUN_REPORT',
      messageParams: { reportName: report.name },
      module: 'MODULE_LABEL_REPORTS_KEY',
    });
    expect(queued).toBe(true);
  });

  it('fails without scheduling when the current user cannot be resolved', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockUseActivePractitioner.mockReturnValue({
      user: null,
      practitioner: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useActivePractitioner>);
    const { result } = renderHook(() => useQueueReport());

    const queued = await result.current.queueReport(report, 'PDF');

    expect(mockScheduleReport).not.toHaveBeenCalled();
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    expect(queued).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('passes the macroTemplateLocation through to scheduleReport', async () => {
    const { result } = renderHook(() => useQueueReport());

    await result.current.queueReport(
      report,
      'CUSTOM EXCEL',
      undefined,
      undefined,
      undefined,
      'uploaded-template.xlsx',
    );

    expect(mockScheduleReport).toHaveBeenCalledWith({
      reportName: report.name,
      reportFormat: 'CUSTOM EXCEL',
      userName: 'superman',
      startDate: undefined,
      endDate: undefined,
      paperSize: report.config?.paperSize,
      macroTemplateLocation: 'uploaded-template.xlsx',
    });
  });

  it('reports failure and does not dispatch an audit event when scheduling throws', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockScheduleReport.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useQueueReport());

    const queued = await result.current.queueReport(report, 'PDF');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error queueing report:',
      expect.any(Error),
    );
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
    expect(queued).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('returns a stable queueReport reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useQueueReport());
    const firstQueueReport = result.current.queueReport;

    rerender();

    expect(result.current.queueReport).toBe(firstQueueReport);
  });
});
