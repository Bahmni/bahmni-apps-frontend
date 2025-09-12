import {
  getPatientSearchResults,
  PatientSearchResult,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientSearch } from '../usePatientSearch';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getPatientSearchResults: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
}));

const mockedGetPatientSearchResults =
  getPatientSearchResults as jest.MockedFunction<
    typeof getPatientSearchResults
  >;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockTranslate = (key: string) => {
  const translations: Record<string, string> = {
    PATIENT_SEARCH_ERROR: 'Error searching for patients',
    NETWORK_ERROR: 'Network error occurred',
  };
  return translations[key] || key;
};
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('usePatientSearch hook', () => {
  mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);

  mockedGetFormattedError.mockImplementation((error: any) => ({
    title: error.title ?? 'unknown title',
    message: error.message ?? 'Unknown error',
  }));

  const mockPatientSearchResult: PatientSearchResult = {
    id: 'patient-id-123',
    patientId: 'PAT001',
    fullName: 'John Doe',
    phoneNumber: '+1234567890',
    alternatePhoneNumber: null,
    gender: 'M',
    age: '35y 0m 0d',
    registrationDate: '2023-01-15',
  };

  const mockSearchResults = {
    results: [mockPatientSearchResult],
    totalCount: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePatientSearch(''));

    // Assert
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should search patients successfully', async () => {
    // Arrange
    const searchTerm = 'John';
    mockedGetPatientSearchResults.mockResolvedValueOnce(mockSearchResults);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    await waitFor(() => {
      expect(mockedGetPatientSearchResults).toHaveBeenCalledWith(
        searchTerm,
        mockTranslate,
      );
      expect(result.current.searchResults).toEqual(mockSearchResults.results);
      expect(result.current.totalCount).toBe(mockSearchResults.totalCount);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle empty search results', async () => {
    // Arrange
    const searchTerm = 'NonExistentPatient';
    const emptyResults = { results: [], totalCount: 0 };
    mockedGetPatientSearchResults.mockResolvedValueOnce(emptyResults);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    await waitFor(() => {
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle empty search term', async () => {
    const { result } = renderHook(() => usePatientSearch(''));

    // Assert - empty search term should not trigger API call and should clear results
    expect(mockedGetPatientSearchResults).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should show loading state during search', async () => {
    // Arrange
    const searchTerm = 'John';
    let resolvePromise: (value: typeof mockSearchResults) => void;
    const pendingPromise = new Promise<typeof mockSearchResults>((resolve) => {
      resolvePromise = resolve;
    });
    mockedGetPatientSearchResults.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    // Assert loading state
    await waitFor(() => {
      expect(mockedGetPatientSearchResults).toHaveBeenCalledWith(
        searchTerm,
        mockTranslate,
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    // Resolve the promise
    act(() => {
      resolvePromise!(mockSearchResults);
    });

    // Assert final state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual(mockSearchResults.results);
    });
  });

  it('should handle API errors correctly', async () => {
    // Arrange
    const searchTerm = 'John';
    const mockError = new Error('Network error');
    const formattedError = {
      title: 'Error',
      message: 'Network error occurred',
    };
    mockedGetPatientSearchResults.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    await waitFor(() => {
      expect(mockedGetPatientSearchResults).toHaveBeenCalledWith(
        searchTerm,
        mockTranslate,
      );
      expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toBe(formattedError.message);
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle non-Error objects in catch block', async () => {
    // Arrange
    const searchTerm = 'John';
    const errorMessage = 'Request failed';
    const nonErrorObject = { message: errorMessage, status: 500 };
    const formattedError = { title: 'Error', message: errorMessage };
    mockedGetPatientSearchResults.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    await waitFor(() => {
      expect(mockedGetFormattedError).toHaveBeenCalledWith(nonErrorObject);
      expect(result.current.error).toBe(formattedError.message);
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should reset error state when starting a new search', async () => {
    // Arrange - First create an error state
    const mockError = new Error('Network error');
    const formattedError = {
      title: 'Error',
      message: 'Network error occurred',
    };
    mockedGetPatientSearchResults.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result, rerender } = renderHook(
      ({ searchTerm }) => usePatientSearch(searchTerm),
      { initialProps: { searchTerm: 'John' } },
    );

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBe(formattedError.message);
    });

    mockedGetPatientSearchResults.mockResolvedValueOnce(mockSearchResults);

    // Change search term to trigger new search
    rerender({ searchTerm: 'Jane' });

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.searchResults).toEqual(mockSearchResults.results);
      expect(result.current.totalCount).toBe(mockSearchResults.totalCount);
    });
  });

  it('should handle multiple search results', async () => {
    // Arrange
    const searchTerm = 'John';
    const multipleResults = {
      results: [
        mockPatientSearchResult,
        {
          ...mockPatientSearchResult,
          id: 'patient-id-456',
          patientId: 'PAT002',
          fullName: 'John Smith',
          age: '42',
        },
      ],
      totalCount: 2,
    };
    mockedGetPatientSearchResults.mockResolvedValueOnce(multipleResults);

    const { result } = renderHook(() => usePatientSearch(searchTerm));

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(multipleResults.results);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
