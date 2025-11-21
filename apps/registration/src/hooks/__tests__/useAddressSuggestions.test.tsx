import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import type {
  AddressLevel,
  SelectedAddressMetadata,
} from '../useAddressFields';
import { useAddressSuggestions } from '../useAddressSuggestions';

// Mock dependencies
jest.mock('@bahmni/services');

const mockGetAddressHierarchyEntries =
  services.getAddressHierarchyEntries as jest.MockedFunction<
    typeof services.getAddressHierarchyEntries
  >;

describe('useAddressSuggestions', () => {
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockLevelsWithStrictEntry: AddressLevel[] = [
    {
      addressField: 'stateProvince',
      name: 'State',
      required: true,
      isStrictEntry: true,
    },
    {
      addressField: 'countyDistrict',
      name: 'District',
      required: false,
      isStrictEntry: true,
    },
    {
      addressField: 'cityVillage',
      name: 'City',
      required: false,
      isStrictEntry: true,
    },
  ];

  const mockSelectedMetadata: SelectedAddressMetadata = {};

  const mockSuggestions = [
    {
      name: 'Karnataka',
      uuid: 'state-uuid-1',
      userGeneratedId: null,
      parent: undefined,
    },
    {
      name: 'Tamil Nadu',
      uuid: 'state-uuid-2',
      userGeneratedId: null,
      parent: undefined,
    },
  ];

  describe('Debounced Search', () => {
    it('should debounce search input and fetch suggestions after 200ms', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Start typing (need at least 2 characters)
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
      });

      // Should not call API immediately
      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();

      // Advance timer by 150ms (less than debounce time)
      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();

      // Advance timer by another 100ms (total 250ms, past debounce time)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'stateProvince',
          'Ka',
          20,
          undefined,
        );
      });
    });

    it('should cancel previous debounce timer when new input arrives', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // First search (2 chars minimum)
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
      });

      // Advance 150ms
      act(() => {
        jest.advanceTimersByTime(150);
      });

      // Second search before first completes
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Kar');
      });

      // Advance another 200ms
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should only call API once with the latest search term
      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledTimes(1);
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'stateProvince',
          'Kar',
          20,
          undefined,
        );
      });
    });

    it('should not fetch suggestions for search strings less than 2 characters', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'K');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Query is disabled for < 2 characters
      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();
      expect(result.current.suggestions['stateProvince']).toEqual([]);
    });
  });

  describe('Hierarchical Filtering with Parent UUID', () => {
    it('should include parent UUID in API call for child fields', async () => {
      const selectedMetadata: SelectedAddressMetadata = {
        stateProvince: {
          uuid: 'state-uuid-1',
          value: 'Karnataka',
        },
      };

      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          name: 'Bangalore Urban',
          uuid: 'district-uuid-1',
          parent: {
            uuid: 'state-uuid-1',
            name: 'Karnataka',
            userGeneratedId: null,
          },
          userGeneratedId: null,
        },
      ]);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict'],
            mockLevelsWithStrictEntry,
            selectedMetadata,
          ),
        { wrapper },
      );

      // Search for district
      act(() => {
        result.current.debouncedSearchAddress('countyDistrict', 'Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Ba',
          20,
          'state-uuid-1', // Parent UUID should be passed
        );
      });
    });

    it('should filter suggestions by parent UUID on frontend', async () => {
      const selectedMetadata: SelectedAddressMetadata = {
        stateProvince: {
          uuid: 'state-uuid-1',
          value: 'Karnataka',
        },
      };

      // Backend returns suggestions with mixed parents
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          name: 'Bangalore Urban',
          uuid: 'district-uuid-1',
          parent: {
            uuid: 'state-uuid-1',
            name: 'Karnataka',
            userGeneratedId: null,
          },
          userGeneratedId: null,
        },
        {
          name: 'Chennai',
          uuid: 'district-uuid-2',
          parent: {
            uuid: 'state-uuid-2',
            name: 'Tamil Nadu',
            userGeneratedId: null,
          },
          userGeneratedId: null,
        },
      ]);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['countyDistrict'],
            mockLevelsWithStrictEntry,
            selectedMetadata,
          ),
        { wrapper },
      );

      act(() => {
        result.current.debouncedSearchAddress('countyDistrict', 'Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        // Should only include suggestions matching parent UUID
        expect(result.current.suggestions['countyDistrict']).toHaveLength(1);
        expect(result.current.suggestions['countyDistrict'][0].name).toBe(
          'Bangalore Urban',
        );
      });
    });

    it('should not filter top-level fields by parent UUID', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions['stateProvince']).toEqual(
          mockSuggestions,
        );
      });
    });
  });

  describe('Clearing Child Suggestions', () => {
    it('should clear search queries and suggestions for child fields', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([]);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict', 'cityVillage'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Populate suggestions for all fields
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
        result.current.debouncedSearchAddress('countyDistrict', 'Ba');
        result.current.debouncedSearchAddress('cityVillage', 'Be');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Clear child suggestions when parent changes
      act(() => {
        result.current.clearChildSuggestions('stateProvince');
      });

      // Child fields should have empty suggestions
      expect(result.current.suggestions['countyDistrict']).toEqual([]);
      expect(result.current.suggestions['cityVillage']).toEqual([]);
    });

    it('should clear selectedItems for child fields', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([]);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Set selected items
      act(() => {
        result.current.setSelectedItems({
          stateProvince: mockSuggestions[0],
          countyDistrict: {
            name: 'Bangalore',
            uuid: 'district-1',
            userGeneratedId: null,
            parent: undefined,
          },
        });
      });

      // Clear children of stateProvince
      act(() => {
        result.current.clearChildSuggestions('stateProvince');
      });

      expect(result.current.selectedItems['countyDistrict']).toBeNull();
      expect(result.current.selectedItems['stateProvince']).toBe(
        mockSuggestions[0],
      );
    });

    it('should not clear parent field suggestions', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Populate state suggestions
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions['stateProvince']).toEqual(
          mockSuggestions,
        );
      });

      // Clear district suggestions (child of state)
      act(() => {
        result.current.clearChildSuggestions('countyDistrict');
      });

      // State suggestions should remain unchanged
      expect(result.current.suggestions['stateProvince']).toEqual(
        mockSuggestions,
      );
    });
  });

  describe('Unmarking Cleared Fields', () => {
    it('should unmark field as cleared when user starts typing', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Clear child field
      act(() => {
        result.current.clearChildSuggestions('stateProvince');
      });

      // Suggestions should be empty
      expect(result.current.suggestions['countyDistrict']).toEqual([]);

      // Unmark as cleared
      act(() => {
        result.current.unmarkFieldAsCleared('countyDistrict');
      });

      // Now search should work again
      act(() => {
        result.current.debouncedSearchAddress('countyDistrict', 'Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Ba',
          20,
          undefined,
        );
      });
    });
  });

  describe('Multiple Autocomplete Fields', () => {
    it('should manage suggestions for multiple fields independently', async () => {
      const stateSuggestions = [
        {
          name: 'Karnataka',
          uuid: 'state-1',
          userGeneratedId: null,
          parent: undefined,
        },
      ];
      const districtSuggestions = [
        {
          name: 'Bangalore',
          uuid: 'district-1',
          userGeneratedId: null,
          parent: undefined,
        },
      ];

      mockGetAddressHierarchyEntries
        .mockResolvedValueOnce(stateSuggestions)
        .mockResolvedValueOnce(districtSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince', 'countyDistrict'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      // Search in both fields
      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
        result.current.debouncedSearchAddress('countyDistrict', 'Ba');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestions['stateProvince']).toEqual(
          stateSuggestions,
        );
        expect(result.current.suggestions['countyDistrict']).toEqual(
          districtSuggestions,
        );
      });
    });
  });

  describe('Suggestions Ref', () => {
    it('should maintain suggestions in a ref without triggering re-renders', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      const { result } = renderHook(
        () =>
          useAddressSuggestions(
            ['stateProvince'],
            mockLevelsWithStrictEntry,
            mockSelectedMetadata,
          ),
        { wrapper },
      );

      act(() => {
        result.current.debouncedSearchAddress('stateProvince', 'Ka');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(result.current.suggestionsRef.current['stateProvince']).toEqual(
          mockSuggestions,
        );
      });
    });
  });
});
