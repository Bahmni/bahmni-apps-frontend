import { getIdentifierTypes } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIdentifierTypes } from '../useIdentifierTypes';

jest.mock('@bahmni/services', () => ({
  getIdentifierTypes: jest.fn(),
}));

const mockIdentifierTypes = [
  {
    uuid: 'id-type-1',
    name: 'Patient Identifier',
    description: 'Primary patient identifier',
    format: null,
    required: true,
    primary: true,
    identifierSources: [
      {
        uuid: 'source-1',
        name: 'Auto-generated',
        prefix: 'BAH',
      },
    ],
  },
  {
    uuid: 'id-type-2',
    name: 'National ID',
    description: 'National identification number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
];

describe('useIdentifierTypes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch identifier types successfully', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIdentifierTypes);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);
  });

  it('should handle error when fetching identifier types fails', async () => {
    const mockError = new Error('Failed to fetch identifier types');
    (getIdentifierTypes as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    // Wait for all retries to complete (with increased timeout for exponential backoff)
    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 10000 },
    );

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    // Hook has retry: 2, so it should attempt 3 times total (1 initial + 2 retries)
    expect(getIdentifierTypes).toHaveBeenCalledTimes(3);
  });

  it('should use cache for subsequent calls within stale time', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result: result1 } = renderHook(() => useIdentifierTypes(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    const { result: result2 } = renderHook(() => useIdentifierTypes(), {
      wrapper,
    });

    expect(result2.current.data).toEqual(mockIdentifierTypes);
    // Should only be called once because data is still fresh (within 30 min staleTime)
    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);
  });

  it('should not refetch within stale time window', async () => {
    jest.useFakeTimers();
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);

    // Advance time by 29 minutes (within 30-minute stale time)
    jest.advanceTimersByTime(29 * 60 * 1000);

    // Should still only be called once (data is still fresh)
    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockIdentifierTypes);

    jest.useRealTimers();
  });

  it('should mark data as stale after staleTime expires', async () => {
    jest.useFakeTimers();
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result, unmount } = renderHook(() => useIdentifierTypes(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);

    // Advance time past stale time (31 minutes)
    jest.advanceTimersByTime(31 * 60 * 1000);

    // Run pending timers to ensure TanStack Query processes the stale time
    jest.runOnlyPendingTimers();

    // Unmount and remount to trigger a new mount (which checks staleness)
    unmount();

    const { result: result2 } = renderHook(() => useIdentifierTypes(), {
      wrapper,
    });

    // Wait for the refetch to complete
    await waitFor(
      () => {
        expect(result2.current.isSuccess).toBe(true);
      },
      { timeout: 5000 },
    );

    // Should have been called twice: once on initial mount, once after stale time expired
    expect(getIdentifierTypes).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should refetch when refetch is called', async () => {
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(getIdentifierTypes).toHaveBeenCalledTimes(2);
  });

  it('should retry on failure with exponential backoff', async () => {
    const mockError = new Error('Network error');
    let callCount = 0;

    (getIdentifierTypes as jest.Mock).mockImplementation(() => {
      callCount++;
      // Fail first 2 attempts, succeed on 3rd
      if (callCount < 3) {
        return Promise.reject(mockError);
      }
      return Promise.resolve(mockIdentifierTypes);
    });

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    // Wait for all retries to complete with extended timeout for exponential backoff
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 10000 },
    );

    // Should have retried 2 times before succeeding on 3rd attempt
    expect(getIdentifierTypes).toHaveBeenCalledTimes(3);
    expect(result.current.data).toEqual(mockIdentifierTypes);
    expect(result.current.error).toBeNull();
  });
});
