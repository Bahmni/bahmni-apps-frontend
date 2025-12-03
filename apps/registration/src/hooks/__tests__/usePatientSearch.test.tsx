import { searchPatientByNameOrId } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { usePatientSearch } from '../usePatientSearch';

jest.mock('@bahmni/services', () => ({
  searchPatientByNameOrId: jest.fn(),
}));

const mockSearchPatientByNameOrId =
  searchPatientByNameOrId as jest.MockedFunction<
    typeof searchPatientByNameOrId
  >;

describe('usePatientSearch', () => {
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

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockPatientResults = {
    pageOfResults: [
      {
        uuid: 'patient-1',
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
        identifier: 'GAN123456',
      },
      {
        uuid: 'patient-2',
        givenName: 'Jane',
        familyName: 'Smith',
        identifier: 'GAN789012',
      },
    ],
    totalCount: 2,
  } as any;

  it('should initialize with empty search terms', () => {
    const { result } = renderHook(() => usePatientSearch(), {
      wrapper,
    });

    expect(result.current.searchTerms).toEqual({});
    expect(result.current.getPatientSuggestions('row-1')).toEqual([]);
  });

  describe('Search Functionality', () => {
    it('should update search terms and fetch patient suggestions', async () => {
      mockSearchPatientByNameOrId.mockResolvedValue(mockPatientResults);

      const { result } = renderHook(() => usePatientSearch(), {
        wrapper,
      });

      act(() => {
        result.current.handleSearch('row-1', 'John');
      });

      expect(result.current.searchTerms['row-1']).toBe('John');

      await waitFor(() => {
        const suggestions = result.current.getPatientSuggestions('row-1');
        expect(suggestions).toHaveLength(2);
        expect(suggestions[0]).toEqual({
          id: 'patient-1',
          text: 'John Michael Doe (GAN123456)',
          identifier: 'GAN123456',
          name: 'John Michael Doe',
        });
        expect(suggestions[1]).toEqual({
          id: 'patient-2',
          text: 'Jane Smith (GAN789012)',
          identifier: 'GAN789012',
          name: 'Jane Smith',
        });
      });
    });

    it('should not fetch suggestions for search strings less than 2 characters', () => {
      const { result } = renderHook(() => usePatientSearch(), {
        wrapper,
      });

      act(() => {
        result.current.handleSearch('row-1', 'J');
      });

      expect(mockSearchPatientByNameOrId).not.toHaveBeenCalled();
      expect(result.current.getPatientSuggestions('row-1')).toEqual([]);
    });

    it('should handle multiple row searches independently', async () => {
      mockSearchPatientByNameOrId.mockResolvedValue(mockPatientResults);

      const { result } = renderHook(() => usePatientSearch(), {
        wrapper,
      });

      act(() => {
        result.current.handleSearch('row-1', 'John');
        result.current.handleSearch('row-2', 'Jane');
      });

      await waitFor(() => {
        expect(mockSearchPatientByNameOrId).toHaveBeenCalled();
      });

      expect(result.current.searchTerms['row-1']).toBe('John');
      expect(result.current.searchTerms['row-2']).toBe('Jane');
    });
  });

  describe('Clearing Search', () => {
    it('should clear search term for specific row', () => {
      const { result } = renderHook(() => usePatientSearch(), {
        wrapper,
      });

      act(() => {
        result.current.handleSearch('row-1', 'John');
        result.current.handleSearch('row-2', 'Jane');
      });

      expect(result.current.searchTerms['row-1']).toBe('John');
      expect(result.current.searchTerms['row-2']).toBe('Jane');

      act(() => {
        result.current.clearSearch('row-1');
      });

      expect(result.current.searchTerms['row-1']).toBeUndefined();
      expect(result.current.searchTerms['row-2']).toBe('Jane');
    });

    it('should clear all searches', () => {
      const { result } = renderHook(() => usePatientSearch(), {
        wrapper,
      });

      act(() => {
        result.current.handleSearch('row-1', 'John');
        result.current.handleSearch('row-2', 'Jane');
      });

      expect(Object.keys(result.current.searchTerms)).toHaveLength(2);

      act(() => {
        result.current.clearAllSearches();
      });

      expect(result.current.searchTerms).toEqual({});
    });
  });
});
