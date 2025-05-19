import { useActivePractitioner } from '../useActivePractitioner';
import { Provider } from '@types/provider';
import { getCurrentProvider } from '@services/providerService';
import { getFormattedError } from '@utils/common';
import { useNotification } from '@hooks/useNotification';

// Mock dependencies
jest.mock('@services/providerService');
const mockedGetCurrentProvider = getCurrentProvider as jest.MockedFunction<
  typeof getCurrentProvider
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
    useEffect: jest.fn((effect) => {
      effect();
    }),
    useCallback: jest.fn((fn) => fn),
  };
});

describe('useActivePractitioner hook', () => {
  let mockSetPractitioner: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetPractitioner = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    const useStateMock = jest.requireMock('react').useState;

    // First call is for practitioner state
    useStateMock.mockImplementationOnce((initialValue: Provider | null) => [
      initialValue,
      mockSetPractitioner,
    ]);
    // Second call is for loading state
    useStateMock.mockImplementationOnce((initialValue: boolean) => [
      initialValue,
      mockSetLoading,
    ]);
    // Third call is for error state
    useStateMock.mockImplementationOnce((initialValue: Error | null) => [
      initialValue,
      mockSetError,
    ]);
  });

  it('should initialize with correct default values', () => {
    // Arrange - Set up the initial state values
    const useStateMock = jest.requireMock('react').useState;

    // Mock the useState calls to return the initial values we want to test
    useStateMock.mockImplementationOnce(() => [null, mockSetPractitioner]); // practitioner state
    useStateMock.mockImplementationOnce(() => [true, mockSetLoading]); // loading state
    useStateMock.mockImplementationOnce(() => [null, mockSetError]); // error state

    // Act
    const result = useActivePractitioner();

    // Assert - Check that the hook returns the expected values
    expect(result.practitioner).toBeNull();
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
    expect(typeof result.refetch).toBe('function');
  });

  it('should call fetchActivePractitioner on initialization', () => {
    // Arrange
    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    useActivePractitioner();

    // Assert
    expect(useEffectMock).toHaveBeenCalled();

    // Get the effect function and dependencies
    const effectFn = useEffectMock.mock.calls[0][0];
    const deps = useEffectMock.mock.calls[0][1];

    // Verify dependencies include fetchActivePractitioner
    expect(deps.length).toBe(1); // fetchActivePractitioner

    // Call the effect function to simulate useEffect execution
    effectFn();

    // Verify API call was made
    expect(mockedGetCurrentProvider).toHaveBeenCalled();
  });

  it('should update states correctly on successful API response', async () => {
    // Arrange
    const mockProvider: Provider = {
      uuid: 'provider-uuid-123',
      display: 'John Doe - Clinician',
      person: {
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
        preferredAddress: null,
        attributes: [],
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    };

    mockedGetCurrentProvider.mockResolvedValueOnce(mockProvider);

    const useEffectMock = jest.requireMock('react').useEffect;
    const useStateMock = jest.requireMock('react').useState;

    // Mock the useState calls
    useStateMock.mockImplementationOnce(() => [null, mockSetPractitioner]); // practitioner state
    useStateMock.mockImplementationOnce(() => [true, mockSetLoading]); // loading state
    useStateMock.mockImplementationOnce(() => [null, mockSetError]); // error state

    // Act
    useActivePractitioner();

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockedGetCurrentProvider).toHaveBeenCalled();
    expect(mockSetPractitioner).toHaveBeenCalledWith(mockProvider);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle null practitioner correctly', async () => {
    // Arrange
    mockedGetCurrentProvider.mockResolvedValueOnce(null);

    const useEffectMock = jest.requireMock('react').useEffect;
    const useStateMock = jest.requireMock('react').useState;

    // Mock the useState calls
    useStateMock.mockImplementationOnce(() => [null, mockSetPractitioner]); // practitioner state
    useStateMock.mockImplementationOnce(() => [true, mockSetLoading]); // loading state
    useStateMock.mockImplementationOnce(() => [null, mockSetError]); // error state

    // Act
    useActivePractitioner();

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockedGetCurrentProvider).toHaveBeenCalled();
    expect(mockSetPractitioner).not.toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error',
      message: 'Active Practitioner not found',
    });
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle Error objects correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch practitioner');
    mockedGetCurrentProvider.mockRejectedValueOnce(mockError);

    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Error Message',
    });

    const useEffectMock = jest.requireMock('react').useEffect;
    const useStateMock = jest.requireMock('react').useState;

    // Mock the useState calls
    useStateMock.mockImplementationOnce(() => [null, mockSetPractitioner]); // practitioner state
    useStateMock.mockImplementationOnce(() => [true, mockSetLoading]); // loading state
    useStateMock.mockImplementationOnce(() => [null, mockSetError]); // error state

    // Act
    useActivePractitioner();

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockedGetCurrentProvider).toHaveBeenCalled();
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(mockSetError).toHaveBeenCalledWith(mockError);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Error Title',
      message: 'Error Message',
    });
  });

  it('should handle non-Error objects by using getFormattedError', async () => {
    // Arrange
    const nonErrorObject = { message: 'API error' }; // Not an Error instance
    mockedGetCurrentProvider.mockRejectedValueOnce(nonErrorObject);

    mockedGetFormattedError.mockReturnValueOnce({
      title: 'API Error',
      message: 'An API error occurred',
    });

    const useEffectMock = jest.requireMock('react').useEffect;
    const useStateMock = jest.requireMock('react').useState;

    // Mock the useState calls
    useStateMock.mockImplementationOnce(() => [null, mockSetPractitioner]); // practitioner state
    useStateMock.mockImplementationOnce(() => [true, mockSetLoading]); // loading state
    useStateMock.mockImplementationOnce(() => [null, mockSetError]); // error state

    // Act
    useActivePractitioner();

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockedGetFormattedError).toHaveBeenCalledWith(nonErrorObject);
    expect(mockSetError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'API Error',
      message: 'An API error occurred',
    });
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    const mockProvider: Provider = {
      uuid: 'provider-uuid-123',
      display: 'John Doe - Clinician',
      person: {
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
        preferredAddress: null,
        attributes: [],
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    };

    mockedGetCurrentProvider.mockResolvedValueOnce(mockProvider);

    // Act
    const result = useActivePractitioner();

    // Clear the mocks to verify new calls
    mockSetPractitioner.mockClear();
    mockSetLoading.mockClear();
    mockSetError.mockClear();
    mockedGetCurrentProvider.mockClear();

    // Setup for refetch
    const updatedMockProvider: Provider = {
      uuid: 'provider-uuid-123',
      display: 'John Doe - Updated',
      person: {
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
        preferredAddress: null,
        attributes: [],
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    };

    mockedGetCurrentProvider.mockResolvedValueOnce(updatedMockProvider);

    // Call refetch
    await result.refetch();

    // Assert
    expect(mockedGetCurrentProvider).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetPractitioner).toHaveBeenCalledWith(updatedMockProvider);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});
