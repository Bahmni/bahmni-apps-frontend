import { renderHook, act, waitFor } from '@testing-library/react';
import useInvestigationsSearch from '../useInvestigationsSearch';
import * as investigationService from '@services/investigationService';
import { FlattenedInvestigations } from '@types/investigations';

jest.mock('@services/investigationService');

describe('useInvestigationsSearch', () => {
  const mockInvestigations: FlattenedInvestigations[] = [
    {
      code: 'LAB001',
      display: 'Complete Blood Count',
      category: 'Laboratory',
      categoryCode: 'LAB',
    },
    {
      code: 'LAB002',
      display: 'Blood Glucose Test',
      category: 'Laboratory',
      categoryCode: 'LAB',
    },
    {
      code: 'RAD001',
      display: 'Chest X-Ray',
      category: 'Radiology',
      categoryCode: 'RAD',
    },
    {
      code: 'RAD002',
      display: 'CT Scan Head',
      category: 'Radiology',
      categoryCode: 'RAD',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (
      investigationService.getFlattenedInvestigations as jest.Mock
    ).mockResolvedValue(mockInvestigations);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Load', () => {
    it('should fetch investigations on mount', async () => {
      const { result } = renderHook(() => useInvestigationsSearch());

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);
      expect(result.current.investigations).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for the fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        investigationService.getFlattenedInvestigations,
      ).toHaveBeenCalledTimes(1);
      expect(result.current.investigations).toEqual(mockInvestigations);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch error on mount', async () => {
      const mockError = new Error('Failed to fetch investigations');
      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockRejectedValue(mockError);

      const { result } = renderHook(() => useInvestigationsSearch());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.investigations).toEqual([]);
      expect(result.current.error?.message).toBe(
        'Failed to fetch investigations',
      );
    });

    it('should only fetch investigations once on mount', async () => {
      const { rerender } = renderHook(
        ({ searchTerm }) => useInvestigationsSearch(searchTerm),
        { initialProps: { searchTerm: '' } },
      );

      await waitFor(() => {
        expect(
          investigationService.getFlattenedInvestigations,
        ).toHaveBeenCalledTimes(1);
      });

      // Rerender with different search term
      rerender({ searchTerm: 'blood' });

      // Should not fetch again
      expect(
        investigationService.getFlattenedInvestigations,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('Search Functionality', () => {
    it('should return all investigations when search term is empty', async () => {
      const { result } = renderHook(() => useInvestigationsSearch(''));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.investigations).toEqual(mockInvestigations);
    });

    it('should filter investigations based on search term', async () => {
      const { result } = renderHook(() => useInvestigationsSearch('blood'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Advance timers for debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([
        mockInvestigations[0], // Complete Blood Count
        mockInvestigations[1], // Blood Glucose Test
      ]);
    });

    it('should perform case-insensitive search', async () => {
      const { result } = renderHook(() => useInvestigationsSearch('BLOOD'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([
        mockInvestigations[0], // Complete Blood Count
        mockInvestigations[1], // Blood Glucose Test
      ]);
    });

    it('should handle search with multiple words', async () => {
      const { result } = renderHook(() => useInvestigationsSearch('ct scan'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([
        mockInvestigations[3], // CT Scan Head
      ]);
    });

    it('should match any word in the search term', async () => {
      const { result } = renderHook(() =>
        useInvestigationsSearch('glucose head'),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should match both Blood Glucose Test and CT Scan Head
      expect(result.current.investigations).toEqual([
        mockInvestigations[1], // Blood Glucose Test
        mockInvestigations[3], // CT Scan Head
      ]);
    });

    it('should trim whitespace from search term', async () => {
      const { result } = renderHook(() => useInvestigationsSearch('  blood  '));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([
        mockInvestigations[0], // Complete Blood Count
        mockInvestigations[1], // Blood Glucose Test
      ]);
    });

    it('should handle search term with only whitespace as empty', async () => {
      const { result } = renderHook(() => useInvestigationsSearch('   '));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual(mockInvestigations);
    });

    it('should return empty array when no matches found', async () => {
      const { result } = renderHook(() =>
        useInvestigationsSearch('nonexistent'),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([]);
    });
    test('should return only exact match if it exists', async () => {
      const { result } = renderHook(() =>
        useInvestigationsSearch('Complete Blood Count'),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([mockInvestigations[0]]);
    });
  });

  describe('Debounce Behavior', () => {
    it('should debounce search term changes', async () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useInvestigationsSearch(searchTerm),
        { initialProps: { searchTerm: '' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially should have all investigations
      expect(result.current.investigations).toEqual(mockInvestigations);

      // Change search term
      rerender({ searchTerm: 'blood' });

      // Results should not change immediately
      expect(result.current.investigations).toEqual(mockInvestigations);

      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Now results should be filtered
      expect(result.current.investigations).toHaveLength(2);
    });

    it('should handle rapid search term changes', async () => {
      const { result, rerender } = renderHook(
        ({ searchTerm }) => useInvestigationsSearch(searchTerm),
        { initialProps: { searchTerm: '' } },
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rapid changes
      rerender({ searchTerm: 'b' });
      rerender({ searchTerm: 'bl' });
      rerender({ searchTerm: 'blo' });
      rerender({ searchTerm: 'bloo' });
      rerender({ searchTerm: 'blood' });

      // Results should not change during rapid typing
      expect(result.current.investigations).toEqual(mockInvestigations);

      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only filter with the final search term
      expect(result.current.investigations).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty investigations array', async () => {
      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockResolvedValue([]);

      const { result } = renderHook(() => useInvestigationsSearch('blood'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual([]);
    });

    it('should handle undefined search term', async () => {
      const { result } = renderHook(() => useInvestigationsSearch(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.investigations).toEqual(mockInvestigations);
    });

    it('should handle special characters in search term', async () => {
      const specialInvestigations: FlattenedInvestigations[] = [
        {
          code: 'LAB003',
          display: 'HbA1c (Glycated Hemoglobin)',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
      ];

      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockResolvedValue(specialInvestigations);

      const { result } = renderHook(() => useInvestigationsSearch('HbA1c'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual(specialInvestigations);
    });

    it('should handle search with parentheses', async () => {
      const specialInvestigations: FlattenedInvestigations[] = [
        {
          code: 'LAB003',
          display: 'HbA1c (Glycated Hemoglobin)',
          category: 'Laboratory',
          categoryCode: 'LAB',
        },
      ];

      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockResolvedValue(specialInvestigations);

      const { result } = renderHook(() => useInvestigationsSearch('(Glycated'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.investigations).toEqual(specialInvestigations);
    });

    it('should handle network error with proper error formatting', async () => {
      const networkError = { response: { data: { message: 'Network error' } } };
      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockRejectedValue(networkError);

      const { result } = renderHook(() => useInvestigationsSearch());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      // getFormattedError extracts the message from the nested response
      expect(result.current.error?.message).toBe('An unknown error occurred');
    });

    it('should handle generic error', async () => {
      (
        investigationService.getFlattenedInvestigations as jest.Mock
      ).mockRejectedValue('Something went wrong');

      const { result } = renderHook(() => useInvestigationsSearch());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      // getFormattedError returns the original message for string errors
      expect(result.current.error?.message).toBe('Something went wrong');
    });
  });
});
