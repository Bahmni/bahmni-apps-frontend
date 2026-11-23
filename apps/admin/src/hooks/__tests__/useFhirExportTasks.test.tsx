import { fetchFhirExportTasks, FhirExportTask } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { FHIR_EXPORT_POLL_INTERVAL_MS } from '../../constants/app';
import {
  getFhirExportRefetchInterval,
  useFhirExportTasks,
} from '../useFhirExportTasks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchFhirExportTasks: jest.fn(),
}));

const mockFetch = fetchFhirExportTasks as jest.MockedFunction<
  typeof fetchFhirExportTasks
>;

const task = (id: string, status: string): FhirExportTask => ({
  id,
  status,
  anonymised: true,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe('getFhirExportRefetchInterval', () => {
  it('does not poll before any data is available', () => {
    expect(getFhirExportRefetchInterval(undefined)).toBe(false);
  });

  it('does not poll when there are no tasks', () => {
    expect(getFhirExportRefetchInterval([])).toBe(false);
  });

  it('polls every 30 seconds while any task is not terminal', () => {
    expect(
      getFhirExportRefetchInterval([
        task('1', 'completed'),
        task('2', 'accepted'),
      ]),
    ).toBe(30_000);
  });

  it('stops polling once every task is terminal', () => {
    expect(
      getFhirExportRefetchInterval([
        task('1', 'completed'),
        task('2', 'failed'),
        task('3', 'rejected'),
        task('4', 'cancelled'),
      ]),
    ).toBe(false);
  });
});

describe('useFhirExportTasks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not fetch when disabled', () => {
    renderHook(() => useFhirExportTasks(false), { wrapper: createWrapper() });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refetches after 30 seconds while a task is still running', async () => {
    mockFetch
      .mockResolvedValueOnce([task('1', 'requested')])
      .mockResolvedValueOnce([task('1', 'accepted')])
      .mockResolvedValueOnce([task('1', 'completed')]);

    const { result } = renderHook(() => useFhirExportTasks(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.data?.[0].status).toBe('requested'),
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(FHIR_EXPORT_POLL_INTERVAL_MS);
    });
    await waitFor(() =>
      expect(result.current.data?.[0].status).toBe('accepted'),
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(FHIR_EXPORT_POLL_INTERVAL_MS);
    });
    await waitFor(() =>
      expect(result.current.data?.[0].status).toBe('completed'),
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('stops polling once every task is terminal', async () => {
    mockFetch.mockResolvedValue([task('1', 'completed'), task('2', 'failed')]);

    const { result } = renderHook(() => useFhirExportTasks(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(FHIR_EXPORT_POLL_INTERVAL_MS * 3);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
