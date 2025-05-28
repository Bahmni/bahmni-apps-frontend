import { renderHook, act, waitFor } from '@testing-library/react';
import { useConceptSearch } from '../useConceptSearch';
import * as conceptService from '@services/conceptService';

jest.mock('@services/conceptService');

describe('useConceptSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (conceptService.searchConcepts as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should set loading state during fetch', async () => {
    // Set up a delayed promise that we can control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    // Mock the API call to use our controlled promise
    (conceptService.searchConcepts as jest.Mock).mockReturnValue(promise);

    // Start with empty search term to avoid immediate fetch
    const { result, rerender } = renderHook(
      ({ searchTerm }) => useConceptSearch(searchTerm),
      { initialProps: { searchTerm: '' } },
    );

    // Initially loading should be false
    expect(result.current.loading).toBe(false);

    // Change to non-empty search term
    rerender({ searchTerm: 'test' });

    // Advance timers to trigger the debounced fetch (now 500ms)
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the loading state to be set
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the API call
    await act(async () => {
      // Resolve our controlled promise
      resolvePromise([]);
    });

    // Wait for loading to be false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return concepts when fetch succeeds', async () => {
    const mockConcepts = [
      { conceptName: 'Test', conceptUuid: '123', matchedName: 'Test' },
    ];
    (conceptService.searchConcepts as jest.Mock).mockResolvedValue(
      mockConcepts,
    );

    const { result } = renderHook(() => useConceptSearch('test'));

    // Advance timers to trigger the debounced fetch (now 500ms)
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the API call to complete
    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockConcepts);
    });
  });

  it('should fetch when searchTerm is a single character', async () => {
    const mockConcepts = [
      { conceptName: 'A', conceptUuid: '123', matchedName: 'A' },
    ];
    (conceptService.searchConcepts as jest.Mock).mockResolvedValue(
      mockConcepts,
    );

    const { result } = renderHook(() => useConceptSearch('a'));

    // Advance timers to trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the API call to complete
    await waitFor(() => {
      expect(conceptService.searchConcepts).toHaveBeenCalledWith('a', 20);
      expect(result.current.searchResults).toEqual(mockConcepts);
    });
  });

  it('should return empty array when searchTerm is empty', async () => {
    const { result } = renderHook(() => useConceptSearch(''));

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(conceptService.searchConcepts).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
  });

  it('should set error state when fetch fails', async () => {
    const mockError = new Error('API error');
    (conceptService.searchConcepts as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useConceptSearch('test'));

    // Advance timers to trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });
  });

  it('should debounce API calls when searchTerm changes rapidly', async () => {
    const { rerender } = renderHook(
      ({ searchTerm }) => useConceptSearch(searchTerm),
      {
        initialProps: { searchTerm: '' }, // Start with empty to avoid initial API call
      },
    );

    // Change the searchTerm multiple times rapidly
    rerender({ searchTerm: 'te' });
    rerender({ searchTerm: 'tes' });
    rerender({ searchTerm: 'test' });

    // API should not be called yet (before debounce time)
    expect(conceptService.searchConcepts).not.toHaveBeenCalled();

    // Advance timers to trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for API to be called
    await waitFor(() => {
      // API should be called with the latest searchTerm
      expect(conceptService.searchConcepts).toHaveBeenCalledTimes(1);
      expect(conceptService.searchConcepts).toHaveBeenCalledWith('test', 20);
    });
  });

  it('should reset the error state when a new search begins', async () => {
    // First, cause an error
    const mockError = new Error('API error');
    (conceptService.searchConcepts as jest.Mock).mockRejectedValue(mockError);

    const { result, rerender } = renderHook(
      ({ searchTerm }) => useConceptSearch(searchTerm),
      {
        initialProps: { searchTerm: 'error-term' },
      },
    );

    // Advance timers to trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    // Now, fix the mock and try a new search
    (conceptService.searchConcepts as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      rerender({ searchTerm: 'new-term' });
    });

    // Advance timers to trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Error state should be reset when new search starts
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it('should convert non-Error objects to Error instances', async () => {
    // Mock a non-Error object rejection
    const nonErrorObj = { message: 'Custom error message' };
    (conceptService.searchConcepts as jest.Mock).mockRejectedValue(nonErrorObj);

    const { result } = renderHook(() => useConceptSearch('test'));

    // Trigger the debounced fetch
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Wait for the error to be processed
    await waitFor(() => {
      // Verify the error is an Error instance with the fallback message
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        'Failed to fetch concepts for search',
      );
    });
  });

  it('should use custom debounce delay when provided', async () => {
    const customDelay = 300;

    // Start with empty search term to avoid immediate fetch
    const { rerender } = renderHook(
      ({ searchTerm }) => useConceptSearch(searchTerm, 20, customDelay),
      { initialProps: { searchTerm: '' } },
    );

    // Change to non-empty search term
    rerender({ searchTerm: 'test' });

    // Advance timers by less than custom delay
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    // API should still not be called
    expect(conceptService.searchConcepts).not.toHaveBeenCalled();

    // Advance timers to complete custom delay
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // Wait for API to be called
    await waitFor(() => {
      expect(conceptService.searchConcepts).toHaveBeenCalledWith('test', 20);
    });
  });

  it('should handle whitespace-only search terms as empty', async () => {
    const { result } = renderHook(() => useConceptSearch('   '));

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(conceptService.searchConcepts).not.toHaveBeenCalled();
    expect(result.current.searchResults).toEqual([]);
  });
});
