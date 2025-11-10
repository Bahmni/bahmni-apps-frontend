import { renderHook, act } from '@testing-library/react';
import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  Person,
  User,
  getFormattedError,
  useTranslation,
} from 'bahmni-services';
import { useActivePractitioner } from '../useActivePractitioner';

// Mock dependencies
jest.mock('bahmni-services');

// Type the mocked functions
const mockedGetCurrentProvider = getCurrentProvider as jest.MockedFunction<
  typeof getCurrentProvider
>;
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('useActivePractitioner hook', () => {
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      ERROR_FETCHING_USER_DETAILS: 'Error fetching user details',
      ERROR_FETCHING_PRACTITIONERS_DETAILS:
        'Error fetching practitioners details',
    };
    return translations[key] || key;
  });

  const mockUser: User = {
    uuid: 'user-uuid-123',
    username: 'johndoe',
  };

  const mockPerson: Person = {
    uuid: 'person-uuid-456',
    display: 'John Doe',
    gender: 'M',
    age: 35,
    birthdate: '1987-01-01T00:00:00.000+0000',
    birthdateEstimated: false,
    dead: false,
    deathDate: null,
    causeOfDeath: null,
    preferredName: {
      uuid: 'name-uuid-789',
      display: 'John Doe',
      links: [],
    },
    voided: false,
    birthtime: null,
    deathdateEstimated: false,
    links: [],
    resourceVersion: '1.9',
  };

  const mockProvider: Provider = {
    uuid: 'provider-uuid-123',
    display: 'John Doe - Clinician',
    person: mockPerson,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
  });

  it('should initialize with correct default values', () => {
    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Assert
    expect(result.current.practitioner).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch user and provider successfully', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(mockProvider);

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Assert initial loading state
    expect(result.current.loading).toBe(true);

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert final state
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.practitioner).toEqual(mockProvider);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle null user correctly', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(null);

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.practitioner).toBeNull();
    expect(result.current.error?.message).toBe('Error fetching user details');
    expect(result.current.loading).toBe(false);
  });

  it('should handle null provider correctly', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(null);

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.practitioner).toBeNull();
    expect(result.current.error?.message).toBe(
      'Error fetching practitioners details',
    );
    expect(result.current.loading).toBe(false);
  });

  it('should handle user fetch error correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch user');
    mockedGetCurrentUser.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Error Message',
    });

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).not.toHaveBeenCalled();
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.user).toBeNull();
    expect(result.current.practitioner).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle provider fetch error correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch provider');
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Error Message',
    });

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.practitioner).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error object from API correctly', async () => {
    // Arrange
    const nonErrorObject = { message: 'API Error' };
    mockedGetCurrentUser.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'API Error',
    });

    // Act
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for async operations
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.user).toBeNull();
    expect(result.current.practitioner).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    mockedGetCurrentUser
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ ...mockUser, username: 'johndoe_updated' });
    mockedGetCurrentProvider
      .mockResolvedValueOnce(mockProvider)
      .mockResolvedValueOnce({
        ...mockProvider,
        display: 'John Doe - Updated',
      });

    // Act - Initial render
    const { result } = renderHook(() => useActivePractitioner());

    // Wait for initial fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.practitioner).toEqual(mockProvider);

    // Act - Call refetch
    await act(async () => {
      result.current.refetch();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Assert final state
    expect(result.current.user).toEqual({
      ...mockUser,
      username: 'johndoe_updated',
    });
    expect(result.current.practitioner).toEqual({
      ...mockProvider,
      display: 'John Doe - Updated',
    });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(2);
    expect(mockedGetCurrentProvider).toHaveBeenCalledTimes(2);
  });
});
