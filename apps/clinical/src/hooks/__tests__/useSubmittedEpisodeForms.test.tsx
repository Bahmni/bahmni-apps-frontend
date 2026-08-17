import { getEpisodeGradingStatus } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useSubmittedEpisodeForms } from '../useSubmittedEpisodeForms';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getEpisodeGradingStatus: jest.fn(),
}));

const mockGetEpisodeGradingStatus =
  getEpisodeGradingStatus as jest.MockedFunction<
    typeof getEpisodeGradingStatus
  >;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useSubmittedEpisodeForms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a Set containing the formUuid when already submitted', async () => {
    mockGetEpisodeGradingStatus.mockResolvedValue({
      alreadySubmitted: true,
      formUuid: 'grading-form-uuid',
    });

    const { result } = renderHook(
      () => useSubmittedEpisodeForms(['episode-uuid-1']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.size).toBe(1));
    expect(result.current.has('grading-form-uuid')).toBe(true);
    expect(mockGetEpisodeGradingStatus).toHaveBeenCalledWith('episode-uuid-1');
  });

  it('returns an empty Set when not yet submitted', async () => {
    mockGetEpisodeGradingStatus.mockResolvedValue({
      alreadySubmitted: false,
      formUuid: 'grading-form-uuid',
    });

    const { result } = renderHook(
      () => useSubmittedEpisodeForms(['episode-uuid-1']),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(mockGetEpisodeGradingStatus).toHaveBeenCalledTimes(1),
    );

    expect(result.current.size).toBe(0);
  });

  it('merges results across multiple concurrent episodes', async () => {
    mockGetEpisodeGradingStatus.mockImplementation(async (episodeUuid) => {
      if (episodeUuid === 'episode-uuid-1') {
        return { alreadySubmitted: true, formUuid: 'grading-form-uuid-uk' };
      }
      return { alreadySubmitted: true, formUuid: 'grading-form-uuid-us' };
    });

    const { result } = renderHook(
      () => useSubmittedEpisodeForms(['episode-uuid-1', 'episode-uuid-2']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.has('grading-form-uuid-uk')).toBe(true);
    expect(result.current.has('grading-form-uuid-us')).toBe(true);
  });

  it('returns an empty Set and does not throw when episodeUuids is empty', () => {
    const { result } = renderHook(() => useSubmittedEpisodeForms([]), {
      wrapper: createWrapper(),
    });

    expect(mockGetEpisodeGradingStatus).not.toHaveBeenCalled();
    expect(result.current.size).toBe(0);
  });

  it('defaults to an empty Set when called without arguments', () => {
    const { result } = renderHook(() => useSubmittedEpisodeForms(), {
      wrapper: createWrapper(),
    });

    expect(mockGetEpisodeGradingStatus).not.toHaveBeenCalled();
    expect(result.current.size).toBe(0);
  });

  it('fails open (empty Set) and logs the error when the fetch rejects', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const networkError = new Error('network error');
    mockGetEpisodeGradingStatus.mockRejectedValue(networkError);

    const { result } = renderHook(
      () => useSubmittedEpisodeForms(['episode-uuid-1']),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch episode grading status',
        expect.objectContaining({ message: 'network error' }),
      ),
    );

    expect(result.current.size).toBe(0);
    consoleErrorSpy.mockRestore();
  });

  it('does not add a formUuid when alreadySubmitted is true but formUuid is missing', async () => {
    mockGetEpisodeGradingStatus.mockResolvedValue({
      alreadySubmitted: true,
      formUuid: null,
    });

    const { result } = renderHook(
      () => useSubmittedEpisodeForms(['episode-uuid-1']),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(mockGetEpisodeGradingStatus).toHaveBeenCalledTimes(1),
    );

    expect(result.current.size).toBe(0);
  });

  it('skips fetching for a blank episode UUID', () => {
    const { result } = renderHook(() => useSubmittedEpisodeForms(['']), {
      wrapper: createWrapper(),
    });

    expect(mockGetEpisodeGradingStatus).not.toHaveBeenCalled();
    expect(result.current.size).toBe(0);
  });
});
