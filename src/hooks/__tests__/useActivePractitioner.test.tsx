import { useActivePractitioner } from '../useActivePractitioner';
import { Provider, Person } from '@types/provider';
import { User } from '@types/user';
import { getCurrentProvider } from '@services/providerService';
import { getCurrentUser } from '@services/userService';
import { getFormattedError } from '@utils/common';
import { useNotification } from '@hooks/useNotification';
import { act } from '@testing-library/react';

// Mock dependencies
jest.mock('@services/providerService');
jest.mock('@services/userService');
const mockedGetCurrentProvider = getCurrentProvider as jest.MockedFunction<
  typeof getCurrentProvider
>;
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

jest.mock('@utils/common');
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

// Mock the useNotification hook
jest.mock('@hooks/useNotification');
const mockAddNotification = jest.fn();
(useNotification as jest.Mock).mockReturnValue({
  addNotification: mockAddNotification,
});

// Mock React hooks
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn(),
    useEffect: jest.fn((effect) => effect()),
    useCallback: jest.fn((fn) => fn),
  };
});

describe('useActivePractitioner hook', () => {
  let mockSetPractitioner: jest.Mock;
  let mockSetUser: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

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

    // Setup useState mock implementation
    mockSetPractitioner = jest.fn();
    mockSetUser = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    const useStateMock = jest.requireMock('react').useState;

    // Mock all state hooks
    useStateMock
      .mockImplementationOnce(() => [null, mockSetPractitioner]) // practitioner state
      .mockImplementationOnce(() => [null, mockSetUser]) // user state
      .mockImplementationOnce(() => [true, mockSetLoading]) // loading state
      .mockImplementationOnce(() => [null, mockSetError]); // error state
  });

  it('should initialize with correct default values', () => {
    // Act
    const result = useActivePractitioner();

    // Assert
    expect(result.practitioner).toBeNull();
    expect(result.user).toBeNull();
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
    expect(typeof result.refetch).toBe('function');
  });

  it('should fetch user and provider in correct order', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(mockProvider);

    // Act
    useActivePractitioner();

    // Assert initial loading state
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert the sequence of operations
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(mockSetPractitioner).toHaveBeenCalledWith(mockProvider);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });

  it('should handle null user correctly', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(null);

    // Act
    useActivePractitioner();

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockedGetCurrentProvider).not.toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'User not found',
    });
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });

  it('should handle null provider correctly', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(null);

    // Act
    useActivePractitioner();

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(mockSetPractitioner).not.toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Active Practitioner not found',
    });
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
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
    useActivePractitioner();

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockedGetCurrentProvider).not.toHaveBeenCalled();
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(mockSetError).toHaveBeenCalledWith(mockError);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error Title',
      message: 'Error Message',
    });
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
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
    useActivePractitioner();

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(mockUser.uuid);
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(mockSetError).toHaveBeenCalledWith(mockError);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error Title',
      message: 'Error Message',
    });
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(mockProvider);

    // Act
    const result = useActivePractitioner();

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Clear mocks for refetch
    jest.clearAllMocks();

    // Setup for refetch
    const updatedUser = { ...mockUser, username: 'johndoe_updated' };
    const updatedProvider = { ...mockProvider, display: 'John Doe - Updated' };
    mockedGetCurrentUser.mockResolvedValueOnce(updatedUser);
    mockedGetCurrentProvider.mockResolvedValueOnce(updatedProvider);

    // Call refetch
    await act(async () => {
      await result.refetch();
    });

    // Assert
    expect(mockSetLoading).toHaveBeenNthCalledWith(1, true);
    expect(mockedGetCurrentUser).toHaveBeenCalled();
    expect(mockSetUser).toHaveBeenCalledWith(updatedUser);
    expect(mockedGetCurrentProvider).toHaveBeenCalledWith(updatedUser.uuid);
    expect(mockSetPractitioner).toHaveBeenCalledWith(updatedProvider);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });
});
