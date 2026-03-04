import { searchMedications } from '@bahmni/services';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Bundle, Medication } from 'fhir/r4';

import { useMedicationSearch } from '../useMedicationSearch';

// Mock the dependencies
jest.mock('@bahmni/services', () => ({
  searchMedications: jest.fn(),
}));

const mockSearchMedications = searchMedications as jest.MockedFunction<
  typeof searchMedications
>;

describe('useMedicationSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSearchMedications.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Happy Paths', () => {
    it('should return initial state with empty search results', () => {
      const { result } = renderHook(() => useMedicationSearch(''));

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch medications when search term is provided', async () => {
      const mockMedication: Medication = {
        resourceType: 'Medication',
        id: '1',
        code: {
          coding: [
            {
              system: 'http://example.com',
              code: 'med1',
              display: 'Medication 1',
            },
          ],
        },
      };

      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockMedication,
          },
        ],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result } = renderHook(() => useMedicationSearch('aspirin'));

      // Advance timers to trigger the debounced fetch
      await act(async () => {
        jest.advanceTimersByTime(500);
        // Wait for promises to resolve
        await Promise.resolve();
      });

      // Wait for the API call to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.searchResults).toEqual([mockMedication]);
      });

      expect(result.current.error).toBeNull();
      expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 20);
    });

    it('should fetch medications with custom count parameter', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result } = renderHook(() => useMedicationSearch('aspirin', 50));

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 50);
    });

    it('should use custom debounce delay', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      // Start with empty search term to avoid initial fetch
      const { rerender } = renderHook(
        ({ searchTerm, delay }) => useMedicationSearch(searchTerm, 20, delay),
        { initialProps: { searchTerm: '', delay: 1000 } },
      );

      // Change to non-empty search term
      rerender({ searchTerm: 'aspirin', delay: 1000 });

      // Advance timers less than custom delay
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Should not have called API yet
      expect(mockSearchMedications).not.toHaveBeenCalled();

      // Advance to complete custom delay
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 20);
      });
    });

    it('should handle multiple medications in bundle', async () => {
      const mockMedications: Medication[] = [
        {
          resourceType: 'Medication',
          id: '1',
          code: { text: 'Medication 1' },
        },
        {
          resourceType: 'Medication',
          id: '2',
          code: { text: 'Medication 2' },
        },
        {
          resourceType: 'Medication',
          id: '3',
          code: { text: 'Medication 3' },
        },
      ];

      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: mockMedications.map((med) => ({ resource: med })),
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result } = renderHook(() => useMedicationSearch('med'));

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.searchResults).toEqual(mockMedications);
      });

      expect(result.current.searchResults).toHaveLength(3);
    });

    it('should clear results when search term becomes empty', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Medication',
              id: '1',
              code: { text: 'Medication 1' },
            },
          },
        ],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result, rerender } = renderHook(
        ({ searchTerm }) => useMedicationSearch(searchTerm),
        { initialProps: { searchTerm: 'aspirin' } },
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(1);
      });

      // Clear the search term
      rerender({ searchTerm: '' });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should clear results when search term is only whitespace', async () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useMedicationSearch(searchTerm),
        { initialProps: { searchTerm: 'aspirin' } },
      );

      // Change to whitespace only
      rerender({ searchTerm: '   ' });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Sad Paths', () => {
    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Failed to fetch medications';
      mockSearchMedications.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useMedicationSearch('aspirin'));

      await act(async () => {
        jest.advanceTimersByTime(500);
        // Wait for promises to resolve
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it('should handle non-Error objects thrown by API', async () => {
      mockSearchMedications.mockRejectedValue('String error');

      const { result } = renderHook(() => useMedicationSearch('aspirin'));

      await act(async () => {
        jest.advanceTimersByTime(500);
        // Wait for promises to resolve
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
      });

      expect(result.current.error?.message).toBe(
        'Failed to fetch medications for search',
      );
    });

    it('should handle bundle with no entries', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        // No entry property
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result } = renderHook(() => useMedicationSearch('aspirin'));

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle bundle entries without resources', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          { fullUrl: 'http://example.com/1' }, // No resource
          {
            resource: {
              resourceType: 'Medication',
              id: '2',
              code: { text: 'Valid Medication' },
            },
          },
          { fullUrl: 'http://example.com/3' }, // No resource
        ],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { result } = renderHook(() => useMedicationSearch('aspirin'));

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(1);
      });

      // Should only include entries with resources
      expect(result.current.searchResults[0].id).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle search term changes', async () => {
      const mockBundle1: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Medication',
              id: '1',
              code: { text: 'Aspirin' },
            },
          },
        ],
      };

      const mockBundle2: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Medication',
              id: '2',
              code: { text: 'Ibuprofen' },
            },
          },
        ],
      };

      mockSearchMedications
        .mockResolvedValueOnce(mockBundle1)
        .mockResolvedValueOnce(mockBundle2);

      const { result, rerender } = renderHook(
        ({ searchTerm }) => useMedicationSearch(searchTerm),
        { initialProps: { searchTerm: 'aspirin' } },
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.searchResults[0].id).toBe('1');
      });

      // Change search term
      rerender({ searchTerm: 'ibuprofen' });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.searchResults[0].id).toBe('2');
      });

      expect(mockSearchMedications).toHaveBeenCalledTimes(2);
      expect(mockSearchMedications).toHaveBeenNthCalledWith(1, 'aspirin', 20);
      expect(mockSearchMedications).toHaveBeenNthCalledWith(2, 'ibuprofen', 20);
    });

    it('should handle count parameter changes', async () => {
      const mockBundle: Bundle<Medication> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      mockSearchMedications.mockResolvedValue(mockBundle);

      const { rerender } = renderHook(
        ({ count }) => useMedicationSearch('aspirin', count),
        { initialProps: { count: 20 } },
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 20);
      });

      // Change count
      rerender({ count: 50 });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 50);
      });
    });

    it('should debounce API calls when searchTerm changes rapidly', async () => {
      const { rerender } = renderHook(
        ({ searchTerm }) => useMedicationSearch(searchTerm),
        { initialProps: { searchTerm: '' } },
      );

      // Change the searchTerm multiple times rapidly
      rerender({ searchTerm: 'a' });
      rerender({ searchTerm: 'as' });
      rerender({ searchTerm: 'asp' });
      rerender({ searchTerm: 'aspirin' });

      // API should not be called yet (before debounce time)
      expect(mockSearchMedications).not.toHaveBeenCalled();

      // Advance timers to trigger the debounced fetch
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for API to be called
      await waitFor(() => {
        // API should be called only once with the latest searchTerm
        expect(mockSearchMedications).toHaveBeenCalledTimes(1);
        expect(mockSearchMedications).toHaveBeenCalledWith('aspirin', 20);
      });
    });

    it('should not fetch when search term is empty', async () => {
      const { result } = renderHook(() => useMedicationSearch(''));

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(mockSearchMedications).not.toHaveBeenCalled();
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle component unmounting during fetch', async () => {
      // Set up a delayed promise that we can control
      let resolvePromise: (value: Bundle<Medication>) => void;
      const promise = new Promise<Bundle<Medication>>((resolve) => {
        resolvePromise = resolve;
      });

      // Mock the API call to use our controlled promise
      mockSearchMedications.mockReturnValue(promise);

      const { result, unmount } = renderHook(() =>
        useMedicationSearch('aspirin'),
      );

      // Advance timers to trigger the debounced fetch
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Unmount before fetch completes
      unmount();

      // Resolve the fetch after unmounting
      await act(async () => {
        resolvePromise!({
          resourceType: 'Bundle',
          type: 'searchset',
          entry: [],
        });
      });

      // Should not cause any errors
    });

    it('should reset error when new search is initiated', async () => {
      mockSearchMedications
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          resourceType: 'Bundle',
          type: 'searchset',
          entry: [],
        });

      const { result, rerender } = renderHook(
        ({ searchTerm }) => useMedicationSearch(searchTerm),
        { initialProps: { searchTerm: 'error' } },
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('First error');
      });

      // New search
      rerender({ searchTerm: 'success' });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
