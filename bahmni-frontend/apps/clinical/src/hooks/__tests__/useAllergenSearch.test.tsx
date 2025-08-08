import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import i18next from 'i18next';
import { ALLERGEN_TYPES } from '../../constants/allergy';
import { useClinicalConfig } from '../useClinicalConfig';
import {
  fetchAndFormatAllergenConcepts,
  fetchReactionConcepts,
  get
} from '@bahmni-frontend/bahmni-services';
import useAllergenSearch from '../useAllergenSearch';

// Mock hooks
jest.mock('../useClinicalConfig');
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  fetchAndFormatAllergenConcepts: jest.fn(),
  fetchReactionConcepts: jest.fn(),
  get:jest.fn()
}));

const mockUseClinicalConfig = useClinicalConfig as jest.MockedFunction<
  typeof useClinicalConfig
>;
jest.mock('@services/notificationService', () => ({
  showError: jest.fn(),
}));

const mockClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: '162552AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      foodAllergenUuid: '162553AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      environmentalAllergenUuid: '162554AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allergyReactionUuid: '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
};

// Mock the clinical config context
const wrapper = ({ children }: { children: React.ReactNode }) => children;

const mockFetchAndFormatAllergenConcepts =
  fetchAndFormatAllergenConcepts as jest.MockedFunction<
    typeof fetchAndFormatAllergenConcepts
  >;
const mockFetchReactionConcepts = fetchReactionConcepts as jest.MockedFunction<
  typeof fetchReactionConcepts
>;

const mockApiGet = get as jest.MockedFunction<typeof get>

describe('useAllergenSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Setup default mock implementation for useClinicalConfig
    mockUseClinicalConfig.mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      setClinicalConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });
    i18next.changeLanguage('en');

    // Mock API responses
    mockApiGet.mockResolvedValue(mockApiResponse);
    mockFetchAndFormatAllergenConcepts.mockResolvedValue(mockAllergens);
    mockFetchReactionConcepts.mockResolvedValue(mockReactions);
  });

  const mockReactions = [
    {
      code: 'reaction1',
      display: 'Rash',
      system: 'http://snomed.info/sct',
    },
    {
      code: 'reaction2',
      display: 'Hives',
      system: 'http://snomed.info/sct',
    },
  ];
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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('clinical config integration', () => {
    it('should wait for clinical config to load', async () => {
      mockUseClinicalConfig.mockReturnValue({
        clinicalConfig: null,
        setClinicalConfig: jest.fn(),
        isLoading: true,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.allergens).toEqual([]);
      expect(result.current.reactions).toEqual([]);
      expect(mockFetchAndFormatAllergenConcepts).not.toHaveBeenCalled();
      expect(mockFetchReactionConcepts).not.toHaveBeenCalled();
    });

    it('should handle missing clinical config', async () => {
      mockUseClinicalConfig.mockReturnValue({
        clinicalConfig: null,
        setClinicalConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        'Clinical configuration not found',
      );
      expect(result.current.allergens).toEqual([]);
      expect(result.current.reactions).toEqual([]);
    });

    it('should handle missing consultationPad', async () => {
      mockUseClinicalConfig.mockReturnValue({
        clinicalConfig: {
          patientInformation: {},
          actions: [],
          dashboards: [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        setClinicalConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        'Consultation pad configuration not found',
      );
      expect(result.current.allergens).toEqual([]);
      expect(result.current.reactions).toEqual([]);
    });

    it('should handle missing allergyConceptMap', async () => {
      mockUseClinicalConfig.mockReturnValue({
        clinicalConfig: {
          patientInformation: {},
          actions: [],
          dashboards: [],
          consultationPad: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        setClinicalConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        'Allergy concept map configuration not found',
      );
      expect(result.current.allergens).toEqual([]);
      expect(result.current.reactions).toEqual([]);
    });
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
    it('should handle undefined search term', async () => {
      const { result } = renderHook(() => useAllergenSearch(undefined), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.allergens).toEqual(mockAllergens);
      });
    });

    it('should handle null search term', async () => {
      // @ts-expect-error Testing null case
      const { result } = renderHook(() => useAllergenSearch(null), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.allergens).toEqual(mockAllergens);
      });
    });

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

  describe('reactions functionality', () => {
    it('should load and return reaction concepts', async () => {
      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual(mockReactions);
      });

      expect(mockFetchReactionConcepts).toHaveBeenCalledTimes(1);
    });

    it('should handle empty reaction concepts', async () => {
      mockFetchReactionConcepts.mockResolvedValue([]);
      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual([]);
      });
    });

    it('should handle error when fetching reaction concepts fails', async () => {
      const apiError = new Error('Failed to fetch reactions');
      mockFetchReactionConcepts.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Failed to fetch reactions');
        expect(result.current.reactions).toEqual([]);
      });
    });

    it('should maintain loading state until both allergens and reactions are loaded', async () => {
      let resolveAllergens: (value: typeof mockAllergens) => void;
      let resolveReactions: (value: typeof mockReactions) => void;

      const allergensPromise = new Promise<typeof mockAllergens>((resolve) => {
        resolveAllergens = resolve;
      });
      const reactionsPromise = new Promise<typeof mockReactions>((resolve) => {
        resolveReactions = resolve;
      });

      mockFetchAndFormatAllergenConcepts.mockReturnValue(allergensPromise);
      mockFetchReactionConcepts.mockReturnValue(reactionsPromise);

      const { result } = renderHook(() => useAllergenSearch(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Resolve allergens but not reactions
      await act(async () => {
        resolveAllergens(mockAllergens);
      });

      // Should still be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve reactions
      await act(async () => {
        resolveReactions(mockReactions);
      });

      // Now should be done loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.allergens).toEqual(mockAllergens);
        expect(result.current.reactions).toEqual(mockReactions);
      });
    });
  });
});
