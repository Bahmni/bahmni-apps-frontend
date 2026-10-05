import {
  buildScheduleReportUrl,
  dispatchAuditEvent,
  getCurrentUser,
  scheduleReport,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import type { ReportDefinition } from '../../components/ReportList/models';
import { useQueueReport } from '../useQueueReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCurrentUser: jest.fn(),
  buildScheduleReportUrl: jest.fn(),
  scheduleReport: jest.fn(),
  dispatchAuditEvent: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockBuildScheduleReportUrl =
  buildScheduleReportUrl as jest.MockedFunction<typeof buildScheduleReportUrl>;
const mockScheduleReport = scheduleReport as jest.MockedFunction<
  typeof scheduleReport
>;
const mockDispatchAuditEvent = dispatchAuditEvent as jest.MockedFunction<
  typeof dispatchAuditEvent
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockAddNotification = jest.fn();

const report: ReportDefinition & { id: string } = {
  id: 'r1',
  name: 'OPD Visit Count',
  type: 'visits',
  config: { paperSize: 'A4' },
};

describe('useQueueReport', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient();
    wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );

    mockGetCurrentUser.mockResolvedValue({
      username: 'superman',
      display: 'Superman',
      uuid: 'user-uuid',
    });
    mockBuildScheduleReportUrl.mockReturnValue(
      'https://example.com/bahmnireports/schedule?name=OPD+Visit+Count',
    );
    mockScheduleReport.mockResolvedValue(undefined);
    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  it('resolves the current user, builds the schedule URL, calls scheduleReport, shows a success notification, and dispatches an audit event', async () => {
    const { result } = renderHook(() => useQueueReport(), { wrapper });
    const startDate = new Date('2024-03-01');
    const endDate = new Date('2024-03-31');

    result.current.mutate({
      report,
      format: 'PDF',
      startDate,
      endDate,
      defaultPaperSize: 'A3',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockBuildScheduleReportUrl).toHaveBeenCalledWith(
      report.name,
      'PDF',
      'superman',
      startDate,
      endDate,
      report.config?.paperSize,
      undefined,
    );
    expect(mockScheduleReport).toHaveBeenCalledWith(
      'https://example.com/bahmnireports/schedule?name=OPD+Visit+Count',
    );
    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'REPORTS_QUEUE_SUCCESS_TITLE',
      message: 'REPORTS_QUEUE_SUCCESS_MESSAGE',
      type: 'success',
    });
    expect(mockDispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'RUN_REPORT',
      messageParams: { reportName: report.name },
      module: 'MODULE_LABEL_REPORTS_KEY',
    });
  });

  it('passes the report template location through for Custom Excel', async () => {
    const { result } = renderHook(() => useQueueReport(), { wrapper });

    result.current.mutate({
      report,
      format: 'CUSTOM EXCEL',
      reportTemplateLocation: 'uuid-template.xlsx',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockBuildScheduleReportUrl).toHaveBeenCalledWith(
      report.name,
      'CUSTOM EXCEL',
      'superman',
      undefined,
      undefined,
      report.config?.paperSize,
      'uuid-template.xlsx',
    );
  });

  it('shows an error notification and does not dispatch an audit event when scheduling fails', async () => {
    mockScheduleReport.mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useQueueReport(), { wrapper });

    result.current.mutate({ report, format: 'PDF' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'REPORTS_ERROR_TITLE',
      message: 'REPORTS_QUEUE_ERROR_MESSAGE',
      type: 'error',
    });
    expect(mockDispatchAuditEvent).not.toHaveBeenCalled();
  });

  it('shows an error notification when the current user cannot be resolved', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const { result } = renderHook(() => useQueueReport(), { wrapper });

    result.current.mutate({ report, format: 'PDF' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockScheduleReport).not.toHaveBeenCalled();
    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'REPORTS_ERROR_TITLE',
      message: 'REPORTS_QUEUE_ERROR_MESSAGE',
      type: 'error',
    });
  });
});
