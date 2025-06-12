import { renderHook, act } from '@testing-library/react';
import { useRadiologyInvestigation } from '../useRadiologyInvestigation';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import { getPatientRadiologyInvestigations } from '@services/radiologyInvestigationService';
import { usePatientUUID } from '../usePatientUUID';
import { getFormattedError } from '@utils/common';
import i18n from '@/setupTests.i18n';

// Mock dependencies
jest.mock('@services/radiologyInvestigationService');
jest.mock('../usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetPatientRadiologyInvestigations =
  getPatientRadiologyInvestigations as jest.MockedFunction<
    typeof getPatientRadiologyInvestigations
  >;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useRadiologyInvestigation hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockRadiologyInvestigations: RadiologyInvestigation[] = [
    {
      id: 'order-uuid-123',
      testName: 'Chest X-Ray',
      priority: 'urgent',
      orderedBy: 'Dr. John Doe',
      orderedDate: '2023-12-01T10:30:00.000Z',
    },
    {
      id: 'order-uuid-456',
      testName: 'CT Scan',
      priority: 'routine',
      orderedBy: 'Dr. Jane Smith',
      orderedDate: '2023-12-02T14:15:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with correct default values', () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Assert
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return ungrouped radiology investigations', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockResolvedValueOnce(
      mockRadiologyInvestigations,
    );

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Assert initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.radiologyInvestigations).toEqual([]);

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle loading state correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockResolvedValueOnce(
      mockRadiologyInvestigations,
    );

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Assert loading is true initially
    expect(result.current.loading).toBe(true);

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert loading is false after completion
    expect(result.current.loading).toBe(false);
  });

  it('should handle error state', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch radiology investigations');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Failed to fetch radiology investigations',
    });

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should refetch data when refetch is called', async () => {
    // Arrange
    const updatedInvestigations: RadiologyInvestigation[] = [
      {
        id: 'order-uuid-789',
        testName: 'MRI',
        priority: 'stat',
        orderedBy: 'Dr. Bob Wilson',
        orderedDate: '2023-12-03T16:20:00.000Z',
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations
      .mockResolvedValueOnce(mockRadiologyInvestigations)
      .mockResolvedValueOnce(updatedInvestigations);

    // Act - Initial render
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );

    // Act - Call refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.radiologyInvestigations).toEqual(
      updatedInvestigations,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledTimes(2);
  });

  it('should handle invalid patient UUID', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyInvestigations).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty string patient UUID', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue('');

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyInvestigations).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error object from API', async () => {
    // Arrange
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations.mockRejectedValueOnce(
      nonErrorObject,
    );
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'An unexpected error occurred',
    });

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(result.current.error?.message).toBe('An unexpected error occurred');
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should update when patient UUID changes', async () => {
    // Arrange
    const newPatientUUID = 'patient-uuid-456';
    const newInvestigations: RadiologyInvestigation[] = [
      {
        id: 'order-uuid-999',
        testName: 'Ultrasound',
        priority: 'routine',
        orderedBy: 'Dr. Alice Brown',
        orderedDate: '2023-12-04T09:00:00.000Z',
      },
    ];

    mockedGetPatientRadiologyInvestigations
      .mockResolvedValueOnce(mockRadiologyInvestigations)
      .mockResolvedValueOnce(newInvestigations);

    // Act - Initial render with first patient UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );

    // Act - Change patient UUID
    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    // Wait for new fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.radiologyInvestigations).toEqual(newInvestigations);
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenNthCalledWith(
      1,
      mockPatientUUID,
    );
    expect(mockedGetPatientRadiologyInvestigations).toHaveBeenNthCalledWith(
      2,
      newPatientUUID,
    );
  });

  it('should clear error state on successful refetch', async () => {
    // Arrange
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyInvestigations
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockRadiologyInvestigations);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    // Act - Initial render with error
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch (error)
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.radiologyInvestigations).toEqual([]);

    // Act - Successful refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error is cleared
    expect(result.current.error).toBeNull();
    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyInvestigations,
    );
    expect(result.current.loading).toBe(false);
  });
});
