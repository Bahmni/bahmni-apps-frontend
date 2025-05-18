import { useActivePractitioner } from '../useActivePractitioner';
import { FhirPractitioner, FormattedPractitioner } from '@types/practitioner';
import {
  getActivePractitioner,
  formatPractitioner,
} from '@services/practitionerService';
import { getFormattedError } from '@utils/common';
import { useNotification } from '@hooks/useNotification';

// Mock dependencies
jest.mock('@services/practitionerService');
const mockedGetCurrentUserPractitioner =
  getActivePractitioner as jest.MockedFunction<typeof getActivePractitioner>;
const mockedFormatPractitioner = formatPractitioner as jest.MockedFunction<
  typeof formatPractitioner
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
    useStateMock.mockImplementationOnce(
      (initialValue: FormattedPractitioner | null) => [
        initialValue,
        mockSetPractitioner,
      ],
    );
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

  it('should call fetchPractitioner on initialization', () => {
    // Arrange
    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    useActivePractitioner();

    // Assert
    expect(useEffectMock).toHaveBeenCalled();

    // Get the effect function and dependencies
    const effectFn = useEffectMock.mock.calls[0][0];
    const deps = useEffectMock.mock.calls[0][1];

    // Verify dependencies include fetchPractitioner
    expect(deps.length).toBe(1); // fetchPractitioner

    // Call the effect function to simulate useEffect execution
    effectFn();

    // Verify API call was made
    expect(mockedGetCurrentUserPractitioner).toHaveBeenCalled();
  });

  it('should update states correctly on successful API response', async () => {
    // Arrange
    const mockFhirPractitioner: FhirPractitioner = {
      resourceType: 'Practitioner',
      id: 'test-uuid',
      meta: {
        versionId: '1',
        lastUpdated: '2023-01-01T12:00:00Z',
      },
      name: [
        {
          family: 'Doe',
          given: ['John'],
          text: 'John Doe',
        },
      ],
      active: true,
    };

    const mockFormattedPractitioner: FormattedPractitioner = {
      id: 'test-uuid',
      familyName: 'Doe',
      givenName: 'John',
      fullName: 'John Doe',
      active: true,
      lastUpdated: '2023-01-01T12:00:00Z',
    };

    mockedGetCurrentUserPractitioner.mockResolvedValueOnce(
      mockFhirPractitioner,
    );
    mockedFormatPractitioner.mockReturnValueOnce(mockFormattedPractitioner);

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
    expect(mockedGetCurrentUserPractitioner).toHaveBeenCalled();
    expect(mockedFormatPractitioner).toHaveBeenCalledWith(mockFhirPractitioner);
    expect(mockSetPractitioner).toHaveBeenCalledWith(mockFormattedPractitioner);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle null practitioner correctly', async () => {
    // Arrange
    mockedGetCurrentUserPractitioner.mockResolvedValueOnce(null);

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
    expect(mockedGetCurrentUserPractitioner).toHaveBeenCalled();
    // formatPractitioner should not be called
    expect(mockedFormatPractitioner).not.toHaveBeenCalled();
    // practitioner should remain null (no setter call)
    expect(mockSetPractitioner).not.toHaveBeenCalled();
    // error should be set
    expect(mockSetError).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle Error objects correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch practitioner');
    mockedGetCurrentUserPractitioner.mockRejectedValueOnce(mockError);

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
    expect(mockedGetCurrentUserPractitioner).toHaveBeenCalled();
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
    mockedGetCurrentUserPractitioner.mockRejectedValueOnce(nonErrorObject);

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

    // Verify an Error was created with the message from getFormattedError
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
    const mockFhirPractitioner: FhirPractitioner = {
      resourceType: 'Practitioner',
      id: 'test-uuid',
      meta: {
        versionId: '1',
        lastUpdated: '2023-01-01T12:00:00Z',
      },
    };

    const mockFormattedPractitioner: FormattedPractitioner = {
      id: 'test-uuid',
      lastUpdated: '2023-01-01T12:00:00Z',
    };

    mockedGetCurrentUserPractitioner.mockResolvedValueOnce(
      mockFhirPractitioner,
    );
    mockedFormatPractitioner.mockReturnValueOnce(mockFormattedPractitioner);

    // Act
    const result = useActivePractitioner();

    // Clear the mocks to verify new calls
    mockSetPractitioner.mockClear();
    mockSetLoading.mockClear();
    mockSetError.mockClear();
    mockedGetCurrentUserPractitioner.mockClear();
    mockedFormatPractitioner.mockClear();

    // Setup for refetch
    const updatedMockFhirPractitioner: FhirPractitioner = {
      resourceType: 'Practitioner',
      id: 'test-uuid',
      meta: {
        versionId: '2',
        lastUpdated: '2023-01-02T12:00:00Z',
      },
      name: [
        {
          family: 'Doe',
          given: ['John'],
          text: 'John Doe',
        },
      ],
    };

    const updatedMockFormattedPractitioner: FormattedPractitioner = {
      id: 'test-uuid',
      familyName: 'Doe',
      givenName: 'John',
      fullName: 'John Doe',
      lastUpdated: '2023-01-02T12:00:00Z',
    };

    mockedGetCurrentUserPractitioner.mockResolvedValueOnce(
      updatedMockFhirPractitioner,
    );
    mockedFormatPractitioner.mockReturnValueOnce(
      updatedMockFormattedPractitioner,
    );

    // Call refetch
    await result.refetch();

    // Assert
    expect(mockedGetCurrentUserPractitioner).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockedFormatPractitioner).toHaveBeenCalledWith(
      updatedMockFhirPractitioner,
    );
    expect(mockSetPractitioner).toHaveBeenCalledWith(
      updatedMockFormattedPractitioner,
    );
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});
