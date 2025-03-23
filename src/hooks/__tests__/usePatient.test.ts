import { usePatient } from '../usePatient';
import { FhirPatient } from '@types/patient';
import { getPatientById } from '@services/patientService';

// Mock the patientService
jest.mock('../../services/patientService');
const mockedGetPatientById = getPatientById as jest.MockedFunction<
  typeof getPatientById
>;

// Mock React hooks
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn(),
    useEffect: jest.fn(),
  };
});

describe('usePatient hook', () => {
  let mockSetPatient: jest.Mock;
  let mockSetLoading: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup useState mock implementation
    mockSetPatient = jest.fn();
    mockSetLoading = jest.fn();
    mockSetError = jest.fn();

    const useStateMock = jest.requireMock('react').useState;

    // First call is for patient state
    useStateMock.mockImplementationOnce((initialValue: FhirPatient | null) => [
      initialValue,
      mockSetPatient,
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
    // Act
    const result = usePatient('test-uuid');

    // Assert
    expect(result.patient).toBeNull();
    expect(result.loading).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should call fetchPatient when patientUUID is provided', () => {
    // Arrange
    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    usePatient('test-uuid');

    // Assert
    expect(useEffectMock).toHaveBeenCalled();

    // Get the effect function and dependencies
    const effectFn = useEffectMock.mock.calls[0][0];
    const deps = useEffectMock.mock.calls[0][1];

    // Verify dependencies include patientUUID
    expect(deps).toEqual(['test-uuid']);

    // Call the effect function to simulate useEffect execution
    effectFn();

    // Verify API call was made
    expect(mockedGetPatientById).toHaveBeenCalledWith('test-uuid');
  });

  it('should not call fetchPatient when patientUUID is empty', () => {
    // Arrange
    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    usePatient(''); // Empty patientUUID

    // Assert
    expect(useEffectMock).toHaveBeenCalled();

    // Get the effect function
    const effectFn = useEffectMock.mock.calls[0][0];

    // Call the effect function to simulate useEffect execution
    effectFn();

    // Verify API call was NOT made
    expect(mockedGetPatientById).not.toHaveBeenCalled();
  });

  it('should update state correctly on successful API response', async () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
    };
    mockedGetPatientById.mockResolvedValueOnce(mockPatient);

    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    usePatient('test-uuid');

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetPatient).toHaveBeenCalledWith(mockPatient);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle Error objects correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch patient');
    mockedGetPatientById.mockRejectedValueOnce(mockError);

    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    usePatient('test-uuid');

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetError).toHaveBeenCalledWith(mockError);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle non-Error objects by creating a new Error', async () => {
    // Arrange
    const nonErrorObject = { message: 'API error' }; // Not an Error instance
    mockedGetPatientById.mockRejectedValueOnce(nonErrorObject);

    const useEffectMock = jest.requireMock('react').useEffect;

    // Act
    usePatient('test-uuid');

    // Get and call the effect function
    const effectFn = useEffectMock.mock.calls[0][0];
    await effectFn();

    // Assert
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);

    // Verify a new Error was created with the default message
    expect(mockSetError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An unknown error occurred',
      }),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    const mockPatient = {
      resourceType: 'Patient' as const,
      id: 'test-uuid',
    };
    mockedGetPatientById.mockResolvedValueOnce(mockPatient);

    // Act
    const result = usePatient('test-uuid');

    // Clear the mocks to verify new calls
    mockSetPatient.mockClear();
    mockSetLoading.mockClear();
    mockSetError.mockClear();
    mockedGetPatientById.mockClear();

    // Setup for refetch - Note: We're mocking the same patient object for simplicity
    // In a real scenario, this could be a different patient object
    mockedGetPatientById.mockResolvedValueOnce(mockPatient);

    // Call refetch
    await result.refetch();

    // Assert
    expect(mockedGetPatientById).toHaveBeenCalledWith('test-uuid');
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetPatient).toHaveBeenCalledWith(mockPatient);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});
