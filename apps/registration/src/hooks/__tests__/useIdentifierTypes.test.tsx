import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getIdentifierTypes } from '@bahmni/services';
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

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should use cache for subsequent calls', async () => {
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
    // Should only be called once due to infinite caching
    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);
  });

  it('should cache data indefinitely and not refetch automatically', async () => {
    jest.useFakeTimers();
    (getIdentifierTypes as jest.Mock).mockResolvedValue(mockIdentifierTypes);

    const { result } = renderHook(() => useIdentifierTypes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);

    // Advance time by 1 hour
    jest.advanceTimersByTime(60 * 60 * 1000);

    // Should still only be called once (no automatic refetch)
    expect(getIdentifierTypes).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockIdentifierTypes);

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
});
