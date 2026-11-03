import { fetchAuditLogs, RawAuditLogEntry } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  MATCHING_EVENTS_NOT_FOUND,
  NO_EVENTS_FOUND,
  NO_MORE_EVENTS_FOUND,
  useAuditLogs,
} from '../useAuditLogs';

jest.mock('@bahmni/services', () => {
  const actual = jest.requireActual('@bahmni/services');
  return {
    ...actual,
    fetchAuditLogs: jest.fn(),
  };
});

const mockFetchAuditLogs = fetchAuditLogs as jest.MockedFunction<
  typeof fetchAuditLogs
>;

const buildLog = (auditLogId: number): RawAuditLogEntry => ({
  auditLogId,
  dateCreated: '2024-01-01T10:00:00.000Z',
  eventType: 'OPEN_VISIT',
  userId: 'superman',
  patientId: `PID-${auditLogId}`,
  message: 'Opened a visit',
  module: 'MODULE_LABEL_REGISTRATION_KEY',
});

describe('useAuditLogs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // The backend's default view returns the newest page already newest-first,
  // while cursor requests return ascending rows (reversed for display).
  const newestFirst = (...ids: number[]) => ids.map(buildLog);

  it('loads the default view newest-first on mount', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));

    const { result } = renderHook(() => useAuditLogs(), { wrapper });

    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    expect(result.current.logs.map((l) => l.auditLogId)).toEqual([6, 5]);
    expect(result.current.emptyMessageKey).toBeNull();
    expect(mockFetchAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ defaultView: true }),
    );
  });

  it('shows NO_EVENTS_FOUND when the initial default view is empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAuditLogs(), { wrapper });

    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_EVENTS_FOUND),
    );
    expect(result.current.logs).toHaveLength(0);
  });

  it('first page has no previous, and next only when it is a full page', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, i) => buildLog(100 - i)),
    );

    const { result } = renderHook(() => useAuditLogs(), { wrapper });

    await waitFor(() => expect(result.current.logs).toHaveLength(50));
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrevious).toBe(false);
  });

  it('first page has neither next nor previous when it is not a full page', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));

    const { result } = renderHook(() => useAuditLogs(), { wrapper });

    await waitFor(() => expect(result.current.logs).toHaveLength(2));
    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrevious).toBe(false);
  });

  it('next() loads older events using the oldest shown id as cursor', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(3), buildLog(4)]);
    act(() => result.current.next());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([4, 3]),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastAuditLogId: 5, prev: true }),
    );
    expect(result.current.hasPrevious).toBe(true);
    expect(result.current.currentPageNumber).toBe(2);
  });

  it('next() keeps the rows, page and previous state and shows NO_MORE_EVENTS_FOUND when empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([]);
    act(() => result.current.next());

    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_MORE_EVENTS_FOUND),
    );
    expect(result.current.logs.map((l) => l.auditLogId)).toEqual([6, 5]);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.currentPageNumber).toBe(1);
  });

  it('prev() loads newer events using the newest shown id as cursor', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, i) => buildLog(100 - i)),
    );
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(50));

    mockFetchAuditLogs.mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, i) => buildLog(i + 1)),
    );
    act(() => result.current.next());
    await waitFor(() => expect(result.current.currentPageNumber).toBe(2));
    expect(result.current.hasPrevious).toBe(true);

    // Going back from page 2 returns a full page, yet it is page 1 again.
    mockFetchAuditLogs.mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, i) => buildLog(51 + i)),
    );
    act(() => result.current.prev());

    await waitFor(() => expect(result.current.currentPageNumber).toBe(1));
    expect(result.current.logs[0].auditLogId).toBe(100);
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastAuditLogId: 50 }),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ prev: expect.anything() }),
    );
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.currentPageNumber).toBe(1);
  });

  it('prev() hides previous but keeps next when there is nothing newer', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, i) => buildLog(100 - i)),
    );
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(50));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(10)]);
    act(() => result.current.next());
    await waitFor(() => expect(result.current.hasPrevious).toBe(true));

    mockFetchAuditLogs.mockResolvedValueOnce([]);
    act(() => result.current.prev());

    await waitFor(() => expect(result.current.hasPrevious).toBe(false));
    expect(result.current.emptyMessageKey).toBe(NO_MORE_EVENTS_FOUND);
    expect(result.current.logs.map((l) => l.auditLogId)).toEqual([10]);
  });

  it('ignores next() while a request is already in flight', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    let resolveNext: (logs: RawAuditLogEntry[]) => void = () => undefined;
    mockFetchAuditLogs.mockReturnValueOnce(
      new Promise<RawAuditLogEntry[]>((resolve) => {
        resolveNext = resolve;
      }),
    );
    act(() => result.current.next());
    await waitFor(() => expect(result.current.isFetching).toBe(true));

    act(() => result.current.next());

    // initial load + the first next() only
    expect(mockFetchAuditLogs).toHaveBeenCalledTimes(2);

    await act(async () => resolveNext([buildLog(3), buildLog(4)]));
    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([4, 3]),
    );
    expect(mockFetchAuditLogs).toHaveBeenCalledTimes(2);
  });

  it('next()/prev() re-run the default view when there is no cursor yet', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_EVENTS_FOUND),
    );

    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(1));
    act(() => result.current.prev());

    await waitFor(() => expect(result.current.logs).toHaveLength(1));
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultView: true }),
    );
  });

  it('runReport() always replaces the table, even when the result is empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([]);
    act(() => result.current.runReport());

    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(MATCHING_EVENTS_NOT_FOUND),
    );
    expect(result.current.logs).toHaveLength(0);
  });

  it('runReport() replaces the table with matching rows and resets the cursor', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce(newestFirst(6, 5));
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(9)]);
    act(() => result.current.runReport());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([9]),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultView: true }),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ lastAuditLogId: expect.anything() }),
    );
    expect(result.current.hasPrevious).toBe(false);
  });

  it('reset() clears username/patientId/date filters and reloads the default view', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(1), buildLog(2)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    act(() =>
      result.current.setFilters((prev) => ({
        ...prev,
        username: 'batman',
        patientId: 'PID-9',
        startTime: '10:30',
      })),
    );
    expect(result.current.filters.username).toBe('batman');

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(3)]);
    act(() => result.current.reset());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([3]),
    );
    expect(result.current.filters).toMatchObject({
      username: '',
      patientId: '',
      startTime: '',
    });
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultView: true }),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ username: expect.anything() }),
    );
  });

  it('reset() clears the previously shown rows when the default view is empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(1), buildLog(2)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([]);
    act(() => result.current.reset());

    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_EVENTS_FOUND),
    );
    expect(result.current.logs).toHaveLength(0);
  });
});
