import {
  searchPatientByCustomAttribute,
  FormattedPatientSearchResult,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhoneNumberSearch } from '../usePhoneNumberSearch';

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  searchPatientByCustomAttribute: jest.fn(),
  getFormattedError: jest.fn(),
  useTranslation: jest.fn(),
}));

const mockedSearchPatientByCustomAttribute =
  searchPatientByCustomAttribute as jest.MockedFunction<
    typeof searchPatientByCustomAttribute
  >;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockTranslate = (key: string) => {
  const translations: Record<string, string> = {
    PHONE_SEARCH_ERROR: 'Error searching by phone number',
    NETWORK_ERROR: 'Network error occurred',
  };
  return translations[key] || key;
};
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('usePhoneNumberSearch hook', () => {
  mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);

  mockedGetFormattedError.mockImplementation((error: any) => ({
    title: error.title ?? 'unknown title',
    message: error.message ?? 'Unknown error',
  }));

  const mockPatientSearchResult: FormattedPatientSearchResult = {
    id: 'patient-id-123',
    patientId: 'PAT001',
    fullName: 'John Doe',
    phoneNumber: '+1234567890',
    alternatePhoneNumber: null,
    gender: 'M',
    age: '35',
    registrationDate: '2024-01-15',
    uuid: 'patient-uuid-123',
  };

  const mockSearchResults = [mockPatientSearchResult];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePhoneNumberSearch(''));

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should search patients by phone number successfully', async () => {
    const searchTerm = '+1234567890';
    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(
      mockSearchResults,
    );

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        'phoneNumber',
        mockTranslate,
      );
      expect(result.current.searchResults).toEqual(mockSearchResults);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should search patients with custom attribute type', async () => {
    const searchTerm = '+1234567890';
    const customAttributeType = 'alternatePhoneNumber';
    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(
      mockSearchResults,
    );

    const { result } = renderHook(() =>
      usePhoneNumberSearch(searchTerm, customAttributeType),
    );

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        customAttributeType,
        mockTranslate,
      );
      expect(result.current.searchResults).toEqual(mockSearchResults);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle empty search results', async () => {
    const searchTerm = '+9999999999';
    const emptyResults: FormattedPatientSearchResult[] = [];
    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(emptyResults);

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle empty search term', async () => {
    const { result } = renderHook(() => usePhoneNumberSearch(''));

    expect(mockedSearchPatientByCustomAttribute).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should handle whitespace-only search term', async () => {
    const { result } = renderHook(() => usePhoneNumberSearch('   '));

    expect(mockedSearchPatientByCustomAttribute).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should show loading state during search', async () => {
    const searchTerm = '+1234567890';
    let resolvePromise: (value: FormattedPatientSearchResult[]) => void;
    const pendingPromise = new Promise<FormattedPatientSearchResult[]>(
      (resolve) => {
        resolvePromise = resolve;
      },
    );
    mockedSearchPatientByCustomAttribute.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        'phoneNumber',
        mockTranslate,
      );
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    act(() => {
      resolvePromise!(mockSearchResults);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.searchResults).toEqual(mockSearchResults);
    });
  });

  it('should handle API errors correctly', async () => {
    const searchTerm = '+1234567890';
    const mockError = new Error('Network error');
    const formattedError = {
      title: 'Error',
      message: 'Network error occurred',
    };
    mockedSearchPatientByCustomAttribute.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        'phoneNumber',
        mockTranslate,
      );
      expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toBe(formattedError.message);
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle non-Error objects in catch block', async () => {
    const searchTerm = '+1234567890';
    const errorMessage = 'Request failed';
    const nonErrorObject = { message: errorMessage, status: 500 };
    const formattedError = { title: 'Error', message: errorMessage };
    mockedSearchPatientByCustomAttribute.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(mockedGetFormattedError).toHaveBeenCalledWith(nonErrorObject);
      expect(result.current.error).toBe(formattedError.message);
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should reset error state when starting a new search', async () => {
    const mockError = new Error('Network error');
    const formattedError = {
      title: 'Error',
      message: 'Network error occurred',
    };
    mockedSearchPatientByCustomAttribute.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce(formattedError);

    const { result, rerender } = renderHook(
      ({ searchTerm }) => usePhoneNumberSearch(searchTerm),
      { initialProps: { searchTerm: '+1234567890' } },
    );

    await waitFor(() => {
      expect(result.current.error).toBe(formattedError.message);
    });

    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(
      mockSearchResults,
    );

    rerender({ searchTerm: '+0987654321' });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.searchResults).toEqual(mockSearchResults);
    });
  });

  it('should handle multiple search results', async () => {
    const searchTerm = '+1234567890';
    const multipleResults = [
      mockPatientSearchResult,
      {
        ...mockPatientSearchResult,
        id: 'patient-id-456',
        uuid: 'patient-uuid-456',
        patientId: 'PAT002',
        fullName: 'Jane Smith',
        phoneNumber: '+1234567890',
        age: '28',
      },
    ];
    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(multipleResults);

    const { result } = renderHook(() => usePhoneNumberSearch(searchTerm));

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(multipleResults);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle attribute type changes', async () => {
    const searchTerm = '+1234567890';
    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(
      mockSearchResults,
    );

    const { result, rerender } = renderHook(
      ({ attributeType }) => usePhoneNumberSearch(searchTerm, attributeType),
      { initialProps: { attributeType: 'phoneNumber' } },
    );

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        'phoneNumber',
        mockTranslate,
      );
    });

    mockedSearchPatientByCustomAttribute.mockResolvedValueOnce(
      mockSearchResults,
    );

    rerender({ attributeType: 'alternatePhoneNumber' });

    await waitFor(() => {
      expect(mockedSearchPatientByCustomAttribute).toHaveBeenCalledWith(
        searchTerm,
        'alternatePhoneNumber',
        mockTranslate,
      );
    });
  });
});
