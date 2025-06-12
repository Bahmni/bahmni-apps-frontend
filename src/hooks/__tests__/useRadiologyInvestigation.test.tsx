import { renderHook, act } from '@testing-library/react';
import { useRadiologyInvestigation } from '../useRadiologyInvestigation';
import {
  RadiologyInvestigationByDate,
  RadiologyInvestigation,
} from '@types/radiologyInvestigation';
import { getPatientRadiologyInvestigationsByDate } from '@services/radiologyInvestigationService';
import { usePatientUUID } from '../usePatientUUID';
import { getFormattedError } from '@utils/common';
import i18n from '@/setupTests.i18n';

// Mock dependencies
jest.mock('@services/radiologyInvestigationService');
jest.mock('../usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetPatientRadiologyOrdersByDate =
  getPatientRadiologyInvestigationsByDate as jest.MockedFunction<
    typeof getPatientRadiologyInvestigationsByDate
  >;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useRadiologyOrders hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockFormattedRadiologyOrder: RadiologyInvestigation = {
    id: 'order-uuid-123',
    testName: 'Chest X-Ray',
    priority: 'urgent',
    orderedBy: 'Dr. John Doe',
    orderedDate: '2023-12-01',
  };

  const mockRadiologyOrdersByDate: RadiologyInvestigationByDate[] = [
    {
      date: '2023-12-01',
      orders: [mockFormattedRadiologyOrder],
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

  it('should fetch radiology orders successfully when patient UUID is available', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate.mockResolvedValueOnce(
      mockRadiologyOrdersByDate,
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
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyOrdersByDate,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle null patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyOrdersByDate).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle undefined patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyOrdersByDate).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty string patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue('');

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyOrdersByDate).not.toHaveBeenCalled();
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle service error correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch radiology orders');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Failed to fetch radiology orders',
    });

    // Act
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledWith(
      mockPatientUUID,
    );
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.radiologyInvestigations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error object from API correctly', async () => {
    // Arrange
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate.mockRejectedValueOnce(nonErrorObject);
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

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    const updatedRadiologyOrders: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-02',
        orders: [
          {
            ...mockFormattedRadiologyOrder,
            id: 'order-uuid-456',
            testName: 'CT Scan',
          },
        ],
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate
      .mockResolvedValueOnce(mockRadiologyOrdersByDate)
      .mockResolvedValueOnce(updatedRadiologyOrders);

    // Act - Initial render
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyOrdersByDate,
    );

    // Act - Call refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.radiologyInvestigations).toEqual(
      updatedRadiologyOrders,
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledWith(
      mockPatientUUID,
    );
  });

  it('should handle refetch with error correctly', async () => {
    // Arrange
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate
      .mockResolvedValueOnce(mockRadiologyOrdersByDate)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    // Act - Initial render
    const { result } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyOrdersByDate,
    );
    expect(result.current.error).toBeNull();

    // Act - Call refetch with error
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error state
    expect(result.current.error).toBe(mockError);
    expect(result.current.radiologyInvestigations).toEqual([]); // Should reset on error
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledTimes(2);
  });

  it('should update when patient UUID changes', async () => {
    // Arrange
    const newPatientUUID = 'patient-uuid-456';
    const newRadiologyOrders: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-03',
        orders: [
          {
            ...mockFormattedRadiologyOrder,
            id: 'order-uuid-789',
            testName: 'MRI',
          },
        ],
      },
    ];

    mockedGetPatientRadiologyOrdersByDate
      .mockResolvedValueOnce(mockRadiologyOrdersByDate)
      .mockResolvedValueOnce(newRadiologyOrders);

    // Act - Initial render with first patient UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useRadiologyInvestigation());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.radiologyInvestigations).toEqual(
      mockRadiologyOrdersByDate,
    );

    // Act - Change patient UUID
    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    // Wait for new fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.radiologyInvestigations).toEqual(newRadiologyOrders);
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenNthCalledWith(
      1,
      mockPatientUUID,
    );
    expect(mockedGetPatientRadiologyOrdersByDate).toHaveBeenNthCalledWith(
      2,
      newPatientUUID,
    );
  });

  it('should clear error state on successful refetch', async () => {
    // Arrange
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientRadiologyOrdersByDate
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockRadiologyOrdersByDate);
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
      mockRadiologyOrdersByDate,
    );
    expect(result.current.loading).toBe(false);
  });
});
