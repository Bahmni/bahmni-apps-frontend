import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientSearch, useSimplePatientSearch } from '../usePatientSearch';
import { RegistrationService } from '../../services/registration/registrationService';
import { PatientSearchCriteria, PatientSearchResponse } from '../../types/registration';

// Mock the RegistrationService
jest.mock('../../services/registration/registrationService');
const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;

// Mock useDebounce
jest.mock('../useDebounce', () => {
  return jest.fn((value) => value);
});

const mockSearchResponse: PatientSearchResponse = {
  results: [
    {
      uuid: 'patient-1',
      display: 'John Doe',
      voided: false,
      identifiers: [
        {
          uuid: 'id-1',
          identifier: 'P001',
          identifierType: { uuid: 'type-1', name: 'Patient ID', display: 'Patient ID' },
          preferred: true,
        },
      ],
      person: {
        uuid: 'person-1',
        display: 'John Doe',
        gender: 'M',
        age: 30,
        birthdate: '1993-01-01',
        birthdateEstimated: false,
        names: [
          {
            uuid: 'name-1',
            display: 'John Doe',
            givenName: 'John',
            familyName: 'Doe',
            preferred: true,
          },
        ],
        addresses: [
          {
            uuid: 'address-1',
            display: '123 Main St, City, Country',
            address1: '123 Main St',
            cityVillage: 'City',
            country: 'Country',
            preferred: true,
          },
        ],
      },
    },
    {
      uuid: 'patient-2',
      display: 'Jane Smith',
      voided: false,
      identifiers: [
        {
          uuid: 'id-2',
          identifier: 'P002',
          identifierType: { uuid: 'type-1', name: 'Patient ID', display: 'Patient ID' },
          preferred: true,
        },
      ],
      person: {
        uuid: 'person-2',
        display: 'Jane Smith',
        gender: 'F',
        age: 25,
        birthdate: '1998-05-15',
        birthdateEstimated: false,
        names: [
          {
            uuid: 'name-2',
            display: 'Jane Smith',
            givenName: 'Jane',
            familyName: 'Smith',
            preferred: true,
          },
        ],
        addresses: [
          {
            uuid: 'address-2',
            display: '456 Oak Ave, Town, Country',
            address1: '456 Oak Ave',
            cityVillage: 'Town',
            country: 'Country',
            preferred: true,
          },
        ],
      },
    },
  ],
  totalCount: 2,
  hasMore: false,
};

describe('usePatientSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the search cache between tests
    const searchCache = (global as any).searchCache;
    if (searchCache) {
      searchCache.clear();
    }
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => usePatientSearch());

      expect(result.current.results).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSearchCriteria).toBeNull();
      expect(result.current.hasSearched).toBe(false);
      expect(result.current.isEmpty).toBe(false);
      expect(result.current.canLoadMore).toBe(false);
    });
  });

  describe('Search Functionality', () => {
    it('should perform search successfully', async () => {
      mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePatientSearch());

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      expect(mockRegistrationService.searchPatients).toHaveBeenCalledWith(searchCriteria);
      expect(result.current.results).toEqual(mockSearchResponse.results);
      expect(result.current.totalCount).toBe(mockSearchResponse.totalCount);
      expect(result.current.hasMore).toBe(mockSearchResponse.hasMore);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasSearched).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it('should handle search error', async () => {
      const errorMessage = 'Network error';
      mockRegistrationService.searchPatients.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientSearch());

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    it('should validate search criteria', async () => {
      const { result } = renderHook(() => usePatientSearch());

      const emptyCriteria: PatientSearchCriteria = {};

      await act(async () => {
        await result.current.searchPatients(emptyCriteria);
      });

      expect(result.current.error).toBe('Please provide at least one search criteria');
      expect(mockRegistrationService.searchPatients).not.toHaveBeenCalled();
    });

    it('should show loading state during search', async () => {
      // Create a promise that we can control
      let resolveSearch: (value: PatientSearchResponse) => void;
      const searchPromise = new Promise<PatientSearchResponse>((resolve) => {
        resolveSearch = resolve;
      });

      mockRegistrationService.searchPatients.mockReturnValue(searchPromise);

      const { result } = renderHook(() => usePatientSearch());

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      // Start the search
      act(() => {
        result.current.searchPatients(searchCriteria);
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the search
      await act(async () => {
        resolveSearch(mockSearchResponse);
        await searchPromise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Load More Functionality', () => {
    it('should load more results', async () => {
      const firstPageResponse: PatientSearchResponse = {
        results: [mockSearchResponse.results[0]],
        totalCount: 2,
        hasMore: true,
      };

      const secondPageResponse: PatientSearchResponse = {
        results: [mockSearchResponse.results[1]],
        totalCount: 2,
        hasMore: false,
      };

      mockRegistrationService.searchPatients
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const { result } = renderHook(() => usePatientSearch());

      // Initial search
      await act(async () => {
        await result.current.searchPatients({ name: 'John' });
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.canLoadMore).toBe(true);

      // Load more
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.canLoadMore).toBe(false);
    });

    it('should not load more if already loading', async () => {
      const { result } = renderHook(() => usePatientSearch());

      // Set up initial state with hasMore = true but isLoading = true
      await act(async () => {
        await result.current.searchPatients({ name: 'John' });
      });

      // Manually set loading state
      act(() => {
        (result.current as any).isLoading = true;
      });

      await act(async () => {
        await result.current.loadMore();
      });

      // Should not make additional API call
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Search', () => {
    it('should clear search results', async () => {
      mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePatientSearch());

      // Perform search
      await act(async () => {
        await result.current.searchPatients({ name: 'John' });
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.hasSearched).toBe(true);

      // Clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSearchCriteria).toBeNull();
      expect(result.current.hasSearched).toBe(false);
    });
  });

  describe('Retry Search', () => {
    it('should retry last search', async () => {
      mockRegistrationService.searchPatients
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSearchResponse);

      const { result } = renderHook(() => usePatientSearch());

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      // Initial search fails
      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      expect(result.current.error).toBe('Network error');

      // Retry search
      await act(async () => {
        await result.current.retrySearch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.results).toEqual(mockSearchResponse.results);
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledTimes(2);
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledWith(searchCriteria);
    });

    it('should not retry if no previous search criteria', async () => {
      const { result } = renderHook(() => usePatientSearch());

      await act(async () => {
        await result.current.retrySearch();
      });

      expect(mockRegistrationService.searchPatients).not.toHaveBeenCalled();
    });
  });

  describe('Caching', () => {
    it('should cache search results', async () => {
      mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePatientSearch({ enableCache: true }));

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      // First search
      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      // Second identical search should use cache
      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      // API should only be called once
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledTimes(1);
      expect(result.current.results).toEqual(mockSearchResponse.results);
    });

    it('should bypass cache when disabled', async () => {
      mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => usePatientSearch({ enableCache: false }));

      const searchCriteria: PatientSearchCriteria = { name: 'John' };

      // First search
      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      // Second identical search should not use cache
      await act(async () => {
        await result.current.searchPatients(searchCriteria);
      });

      // API should be called twice
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledTimes(2);
    });
  });

  describe('Computed Values', () => {
    it('should correctly compute isEmpty state', async () => {
      const emptyResponse: PatientSearchResponse = {
        results: [],
        totalCount: 0,
        hasMore: false,
      };

      mockRegistrationService.searchPatients.mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => usePatientSearch());

      // Before search
      expect(result.current.isEmpty).toBe(false);

      // After empty search
      await act(async () => {
        await result.current.searchPatients({ name: 'Nonexistent' });
      });

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.hasSearched).toBe(true);
    });
  });
});

describe('useSimplePatientSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search automatically when query changes', async () => {
    mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

    const { result, rerender } = renderHook(
      ({ query }) => useSimplePatientSearch(query),
      { initialProps: { query: '' } }
    );

    expect(result.current.results).toEqual([]);

    // Change query
    rerender({ query: 'John' });

    await waitFor(() => {
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledWith({ name: 'John' });
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResponse.results);
    });
  });

  it('should clear search when query is empty', async () => {
    mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

    const { result, rerender } = renderHook(
      ({ query }) => useSimplePatientSearch(query),
      { initialProps: { query: 'John' } }
    );

    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResponse.results);
    });

    // Clear query
    rerender({ query: '' });

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });

  it('should trim whitespace from query', async () => {
    mockRegistrationService.searchPatients.mockResolvedValue(mockSearchResponse);

    const { result } = renderHook(() => useSimplePatientSearch('  John  '));

    await waitFor(() => {
      expect(mockRegistrationService.searchPatients).toHaveBeenCalledWith({ name: 'John' });
    });
  });
});
