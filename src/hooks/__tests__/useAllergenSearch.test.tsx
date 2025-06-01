import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import useAllergenSearch from '../useAllergenSearch';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import { fetchAndFormatAllergenConcepts } from '@services/allergenService';
import { ALLERGEN_TYPES } from '@constants/concepts';
import * as api from '@services/api';

jest.mock('@services/allergenService');
jest.mock('@services/api');
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClinicalConfigProvider>{children}</ClinicalConfigProvider>
);

// Mock the api.get function
const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

const mockFetchAndFormatAllergenConcepts =
  fetchAndFormatAllergenConcepts as jest.MockedFunction<
    typeof fetchAndFormatAllergenConcepts
  >;

describe('useAllergenSearch', () => {
  // Mock response data for API calls
  const mockApiResponse = {
    setMembers: [
      {
        uuid: '123',
        display: 'Test Allergen',
        retired: false,
      },
    ],
  };

  const mockAllergens = [
    {
      uuid: '162298AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'ACE inhibitors',
      retired: false,
      type: ALLERGEN_TYPES.MEDICATION.display,
    },
    {
      uuid: '162299AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Amoxicillin',
      retired: false,
      type: ALLERGEN_TYPES.MEDICATION.display,
    },
    {
      uuid: '162304AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Penicillin',
      retired: false,
      type: ALLERGEN_TYPES.MEDICATION.display,
    },
    {
      uuid: '162312AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Peanuts',
      retired: false,
      type: ALLERGEN_TYPES.FOOD.display,
    },
    {
      uuid: '162319AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      display: 'Dust',
      retired: false,
      type: ALLERGEN_TYPES.ENVIRONMENT.display,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock API responses
    mockApiGet.mockResolvedValue(mockApiResponse);
    mockFetchAndFormatAllergenConcepts.mockResolvedValue(mockAllergens);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should set loading state during fetch', async () => {
    let resolvePromise: (value: typeof mockAllergens) => void;
    const promise = new Promise<typeof mockAllergens>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchAndFormatAllergenConcepts.mockReturnValue(promise);

    const { result } = renderHook(() => useAllergenSearch(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolvePromise(mockAllergens);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.allergens).toEqual(mockAllergens);
    });
  });

  describe('search functionality', () => {
    it('should filter allergens based on single word search term', async () => {
      const { result } = renderHook(() => useAllergenSearch('pe'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.allergens).toHaveLength(2);
        expect(result.current.allergens).toEqual([
          expect.objectContaining({
            display: 'Penicillin',
            type: ALLERGEN_TYPES.MEDICATION.display,
          }),
          expect.objectContaining({
            display: 'Peanuts',
            type: ALLERGEN_TYPES.FOOD.display,
          }),
        ]);
      });
    });

    it('should match allergens when search term contains multiple words', async () => {
      const { result } = renderHook(() => useAllergenSearch('ace inh'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.allergens).toHaveLength(1);
        expect(result.current.allergens).toEqual([
          expect.objectContaining({
            display: 'ACE inhibitors',
            type: ALLERGEN_TYPES.MEDICATION.display,
          }),
        ]);
      });
    });

    it('should handle search terms with extra whitespace', async () => {
      const { result } = renderHook(() => useAllergenSearch('  penicillin  '), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.allergens).toHaveLength(1);
        expect(result.current.allergens).toEqual([
          expect.objectContaining({
            display: 'Penicillin',
            type: ALLERGEN_TYPES.MEDICATION.display,
          }),
        ]);
      });
    });

    it('should return all allergens for empty search term', async () => {
      const { result } = renderHook(() => useAllergenSearch(''), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.allergens).toEqual(mockAllergens);
      });
    });

    it('should return all allergens for whitespace-only search term', async () => {
      const { result } = renderHook(() => useAllergenSearch('   '), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.allergens).toEqual(mockAllergens);
      });
    });

    it('should return empty array when no allergens are loaded', async () => {
      mockFetchAndFormatAllergenConcepts.mockResolvedValue([]);
      const { result } = renderHook(() => useAllergenSearch('test'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.allergens).toEqual([]);
      });
    });
  });

  describe('error handling', () => {
    it('should handle and format API errors', async () => {
      const apiError = new Error('API Error');
      mockFetchAndFormatAllergenConcepts.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('API Error');
        expect(result.current.allergens).toEqual([]);
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      const nonErrorObj = { message: 'An unknown error occurred' };
      mockFetchAndFormatAllergenConcepts.mockRejectedValue(nonErrorObj);

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('An unknown error occurred');
        expect(result.current.allergens).toEqual([]);
      });
    });
  });

  it('should handle case-insensitive search', async () => {
    const { result } = renderHook(() => useAllergenSearch('PENI'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.allergens).toHaveLength(1);
      expect(result.current.allergens).toEqual([
        expect.objectContaining({
          display: 'Penicillin',
          type: ALLERGEN_TYPES.MEDICATION.display,
        }),
      ]);
    });
  });

  it('should debounce search term updates', async () => {
    const { result, rerender } = renderHook(
      (searchTerm) => useAllergenSearch(searchTerm),
      {
        wrapper,
        initialProps: '',
      },
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.allergens).toEqual(mockAllergens);
    });

    // Update search term
    rerender('pe');

    // Advance timers to trigger debounce
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.allergens).toHaveLength(2);
      expect(result.current.allergens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            display: 'Penicillin',
            type: ALLERGEN_TYPES.MEDICATION.display,
          }),
          expect.objectContaining({
            display: 'Peanuts',
            type: ALLERGEN_TYPES.FOOD.display,
          }),
        ]),
      );
    });
  });
});
