import { fetchAuditLogs, RawAuditLogEntry } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  combineDateAndTime,
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

describe('combineDateAndTime', () => {
  it('returns undefined when no date is provided', () => {
    expect(combineDateAndTime(null, '10:30')).toBeUndefined();
  });

  it('combines a date and a valid HH:mm time', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, '10:30');

    expect(result).toBeDefined();
    const combined = new Date(result!);
    expect(combined.getHours()).toBe(10);
    expect(combined.getMinutes()).toBe(30);
  });

  it('returns just the date (as ISO) when no time is provided', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, '');

    expect(result).toBe(date.toISOString());
  });

  it('ignores a malformed time string', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = combineDateAndTime(date, 'not-a-time');

    expect(result).toBe(date.toISOString());
  });
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

  it('loads the default view (reversed) on mount', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(1), buildLog(2)]);

    const { result } = renderHook(() => useAuditLogs(), { wrapper });

    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    expect(result.current.logs[0].auditLogId).toBe(2);
    expect(result.current.logs[1].auditLogId).toBe(1);
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

  it('next() fetches using the current lastIndex as cursor and updates the rows', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(5), buildLog(6)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(7), buildLog(8)]);
    act(() => result.current.next());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([7, 8]),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastAuditLogId: 5 }),
    );
  });

  it('next() keeps the previous rows and shows NO_MORE_EVENTS_FOUND when empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(5), buildLog(6)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([]);
    act(() => result.current.next());

    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_MORE_EVENTS_FOUND),
    );
    expect(result.current.logs.map((l) => l.auditLogId)).toEqual([6, 5]);
  });

  it('prev() re-runs the default view when still at the initial page', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() =>
      expect(result.current.emptyMessageKey).toBe(NO_EVENTS_FOUND),
    );

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(1)]);
    act(() => result.current.prev());

    await waitFor(() => expect(result.current.logs).toHaveLength(1));
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ defaultView: true }),
    );
  });

  it('prev() uses firstIndex as a cursor once past the initial page', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(5), buildLog(6)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(3), buildLog(4)]);
    act(() => result.current.prev());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([3, 4]),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.objectContaining({ lastAuditLogId: 6, prev: true }),
    );
  });

  it('runReport() always replaces the table, even when the result is empty', async () => {
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(5), buildLog(6)]);
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
    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(5), buildLog(6)]);
    const { result } = renderHook(() => useAuditLogs(), { wrapper });
    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    mockFetchAuditLogs.mockResolvedValueOnce([buildLog(9)]);
    act(() => result.current.runReport());

    await waitFor(() =>
      expect(result.current.logs.map((l) => l.auditLogId)).toEqual([9]),
    );
    expect(mockFetchAuditLogs).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ lastAuditLogId: expect.anything() }),
    );
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
});
