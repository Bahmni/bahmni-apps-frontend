import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PatientSearchCriteria,
  PatientSearchResult,
  PatientSearchResponse,
} from '../types/registration';
import {
  REGISTRATION_CONFIG,
  REGISTRATION_LOADING_STATES,
} from '../constants/registration';
import { RegistrationService } from '../services/registration/registrationService';
import useDebounce from './useDebounce';

/**
 * Patient Search Hook
 * Provides patient search functionality with debouncing, caching, and state management
 */

interface UsePatientSearchState {
  results: PatientSearchResult[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  lastSearchCriteria: PatientSearchCriteria | null;
}

interface UsePatientSearchActions {
  searchPatients: (criteria: PatientSearchCriteria) => Promise<void>;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
  retrySearch: () => Promise<void>;
}

interface UsePatientSearchReturn
  extends UsePatientSearchState,
    UsePatientSearchActions {
  hasSearched: boolean;
  isEmpty: boolean;
  canLoadMore: boolean;
}

interface UsePatientSearchOptions {
  debounceMs?: number;
  enableCache?: boolean;
  maxCacheSize?: number;
  autoSearch?: boolean;
}

// Simple in-memory cache for search results
const searchCache = new Map<
  string,
  {
    data: PatientSearchResponse;
    timestamp: number;
  }
>();

/**
 * Custom hook for patient search functionality
 * @param options - Configuration options for the hook
 * @returns Patient search state and actions
 */
export const usePatientSearch = (
  options: UsePatientSearchOptions = {},
): UsePatientSearchReturn => {
  const {
    debounceMs = REGISTRATION_CONFIG.SEARCH_DEBOUNCE_MS,
    enableCache = true,
    maxCacheSize = 50,
    autoSearch = false,
  } = options;

  // State management
  const [state, setState] = useState<UsePatientSearchState>({
    results: [],
    totalCount: 0,
    hasMore: false,
    isLoading: false,
    error: null,
    lastSearchCriteria: null,
  });

  // Debounced search criteria for auto-search
  const [searchCriteria, setSearchCriteria] =
    useState<PatientSearchCriteria | null>(null);
  const debouncedCriteria = useDebounce(searchCriteria, debounceMs);

  // Generate cache key from search criteria
  const generateCacheKey = useCallback(
    (criteria: PatientSearchCriteria): string => {
      return JSON.stringify({
        ...criteria,
        // Normalize for consistent caching
        startIndex: criteria.startIndex || 0,
        limit: criteria.limit || REGISTRATION_CONFIG.DEFAULT_PAGE_SIZE,
      });
    },
    [],
  );

  // Get cached search results
  const getCachedResults = useCallback(
    (criteria: PatientSearchCriteria): PatientSearchResponse | null => {
      if (!enableCache) return null;

      const cacheKey = generateCacheKey(criteria);
      const cached = searchCache.get(cacheKey);

      if (!cached) return null;

      // Check if cache is still valid (5 minutes TTL)
      const isExpired =
        Date.now() - cached.timestamp > REGISTRATION_CONFIG.SEARCH_CACHE_TTL_MS;
      if (isExpired) {
        searchCache.delete(cacheKey);
        return null;
      }

      return cached.data;
    },
    [enableCache, generateCacheKey],
  );

  // Cache search results
  const setCachedResults = useCallback(
    (criteria: PatientSearchCriteria, data: PatientSearchResponse): void => {
      if (!enableCache) return;

      const cacheKey = generateCacheKey(criteria);

      // Maintain cache size limit
      if (searchCache.size >= maxCacheSize) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) {
          searchCache.delete(oldestKey);
        }
      }

      searchCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    },
    [enableCache, generateCacheKey, maxCacheSize],
  );

  // Core search function
  const performSearch = useCallback(
    async (
      criteria: PatientSearchCriteria,
      isLoadMore: boolean = false,
    ): Promise<void> => {
      try {
        // Validate search criteria
        if (
          !criteria.name &&
          !criteria.identifier &&
          !criteria.givenName &&
          !criteria.familyName &&
          !criteria.gender &&
          !criteria.birthdate &&
          criteria.age === undefined
        ) {
          setState((prev) => ({
            ...prev,
            error: 'Please provide at least one search criteria',
            isLoading: false,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
          lastSearchCriteria: criteria,
        }));

        // Check cache first
        const cachedResult = getCachedResults(criteria);
        if (cachedResult && !isLoadMore) {
          setState((prev) => ({
            ...prev,
            results: [...cachedResult.results],
            totalCount: cachedResult.totalCount,
            hasMore: cachedResult.hasMore,
            isLoading: false,
          }));
          return;
        }

        // Perform API search
        const response = await RegistrationService.searchPatients(criteria);

        // Cache the results
        setCachedResults(criteria, response);

        setState((prev) => ({
          ...prev,
          results: isLoadMore
            ? [...prev.results, ...response.results]
            : [...response.results],
          totalCount: response.totalCount,
          hasMore: response.hasMore,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Search failed';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    },
    [getCachedResults, setCachedResults],
  );

  // Public search action
  const searchPatients = useCallback(
    async (criteria: PatientSearchCriteria): Promise<void> => {
      await performSearch(criteria, false);
    },
    [performSearch],
  );

  // Load more results
  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.lastSearchCriteria || !state.hasMore || state.isLoading) {
      return;
    }

    const nextCriteria: PatientSearchCriteria = {
      ...state.lastSearchCriteria,
      startIndex: state.results.length,
    };

    await performSearch(nextCriteria, true);
  }, [
    state.lastSearchCriteria,
    state.hasMore,
    state.isLoading,
    state.results.length,
    performSearch,
  ]);

  // Retry last search
  const retrySearch = useCallback(async (): Promise<void> => {
    if (!state.lastSearchCriteria) return;
    await performSearch(state.lastSearchCriteria, false);
  }, [state.lastSearchCriteria, performSearch]);

  // Clear search results
  const clearSearch = useCallback((): void => {
    setState({
      results: [],
      totalCount: 0,
      hasMore: false,
      isLoading: false,
      error: null,
      lastSearchCriteria: null,
    });
    setSearchCriteria(null);
  }, []);

  // Auto-search effect (when enabled)
  useEffect(() => {
    if (autoSearch && debouncedCriteria) {
      performSearch(debouncedCriteria, false);
    }
  }, [autoSearch, debouncedCriteria, performSearch]);

  // Computed values
  const hasSearched = useMemo(
    () => state.lastSearchCriteria !== null,
    [state.lastSearchCriteria],
  );
  const isEmpty = useMemo(
    () => hasSearched && state.results.length === 0 && !state.isLoading,
    [hasSearched, state.results.length, state.isLoading],
  );
  const canLoadMore = useMemo(
    () => state.hasMore && !state.isLoading,
    [state.hasMore, state.isLoading],
  );

  return {
    // State
    ...state,

    // Actions
    searchPatients,
    clearSearch,
    loadMore,
    retrySearch,

    // Computed values
    hasSearched,
    isEmpty,
    canLoadMore,
  };
};

/**
 * Hook for simple patient search with just a query string
 * Simplified version for basic search scenarios
 */
export const useSimplePatientSearch = (
  query: string,
  options: UsePatientSearchOptions = {},
) => {
  const search = usePatientSearch({ ...options, autoSearch: true });

  useEffect(() => {
    if (query.trim()) {
      const criteria: PatientSearchCriteria = { name: query.trim() };
      search.searchPatients(criteria);
    } else {
      search.clearSearch();
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return search;
};

export default usePatientSearch;
