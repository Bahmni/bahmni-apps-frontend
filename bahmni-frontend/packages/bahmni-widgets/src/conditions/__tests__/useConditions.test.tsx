import { renderHook, act } from '@testing-library/react';
import { Condition } from 'fhir/r4';
import i18n from '@/setupTests.i18n';
import { mockCondition } from '@__mocks__/conditionMocks';
import { getConditions } from '@services/conditionService';
import { getFormattedError } from '@utils/common';
import { useConditions } from '../useConditions';
import { usePatientUUID } from '../usePatientUUID';

// Mock dependencies
jest.mock('@services/conditionService');
jest.mock('@hooks/usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetConditions = getConditions as jest.MockedFunction<
  typeof getConditions
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useConditions hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockConditions: Condition[] = [
    mockCondition,
    {
      ...mockCondition,
      id: 'condition-uuid-456',
      code: {
        coding: [
          {
            code: '456789AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Diabetes Type 2',
          },
        ],
        text: 'Diabetes Type 2',
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'inactive',
            display: 'Inactive',
          },
        ],
      },
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
    const { result } = renderHook(() => useConditions());

    // Assert
    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch conditions successfully when patient UUID is available', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions.mockResolvedValueOnce(mockConditions);

    // Act
    const { result } = renderHook(() => useConditions());

    // Assert initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.conditions).toEqual([]);

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(mockedGetConditions).toHaveBeenCalledWith(mockPatientUUID);
    expect(result.current.conditions).toEqual(mockConditions);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle null patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetConditions).not.toHaveBeenCalled();
    expect(result.current.conditions).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle undefined patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetConditions).not.toHaveBeenCalled();
    expect(result.current.conditions).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty string patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue('');

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetConditions).not.toHaveBeenCalled();
    expect(result.current.conditions).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle service error correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch conditions');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Failed to fetch conditions',
    });

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetConditions).toHaveBeenCalledWith(mockPatientUUID);
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error object from API correctly', async () => {
    // Arrange
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'An unexpected error occurred',
    });

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(result.current.error?.message).toBe('An unexpected error occurred');
    expect(result.current.conditions).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    const updatedConditions: Condition[] = [
      {
        ...mockCondition,
        id: 'condition-uuid-789',
        code: {
          coding: [
            {
              code: '789012AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Asthma',
            },
          ],
          text: 'Asthma',
        },
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions
      .mockResolvedValueOnce(mockConditions)
      .mockResolvedValueOnce(updatedConditions);

    // Act - Initial render
    const { result } = renderHook(() => useConditions());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.conditions).toEqual(mockConditions);

    // Act - Call refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.conditions).toEqual(updatedConditions);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetConditions).toHaveBeenCalledTimes(2);
    expect(mockedGetConditions).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should handle refetch with error correctly', async () => {
    // Arrange
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions
      .mockResolvedValueOnce(mockConditions)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    // Act - Initial render
    const { result } = renderHook(() => useConditions());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.conditions).toEqual(mockConditions);
    expect(result.current.error).toBeNull();

    // Act - Call refetch with error
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error state
    expect(result.current.error).toBe(mockError);
    expect(result.current.conditions).toEqual([]); // Should reset on error
    expect(result.current.loading).toBe(false);
    expect(mockedGetConditions).toHaveBeenCalledTimes(2);
  });

  it('should update when patient UUID changes', async () => {
    // Arrange
    const newPatientUUID = 'patient-uuid-456';
    const newConditions: Condition[] = [
      {
        ...mockCondition,
        id: 'condition-uuid-999',
        code: {
          coding: [
            {
              code: '999888AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              display: 'Migraine',
            },
          ],
          text: 'Migraine',
        },
      },
    ];

    mockedGetConditions
      .mockResolvedValueOnce(mockConditions)
      .mockResolvedValueOnce(newConditions);

    // Act - Initial render with first patient UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useConditions());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.conditions).toEqual(mockConditions);

    // Act - Change patient UUID
    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    // Wait for new fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.conditions).toEqual(newConditions);
    expect(mockedGetConditions).toHaveBeenCalledTimes(2);
    expect(mockedGetConditions).toHaveBeenNthCalledWith(1, mockPatientUUID);
    expect(mockedGetConditions).toHaveBeenNthCalledWith(2, newPatientUUID);
  });

  it('should clear error state on successful refetch', async () => {
    // Arrange
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockConditions);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    // Act - Initial render with error
    const { result } = renderHook(() => useConditions());

    // Wait for initial fetch (error)
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.conditions).toEqual([]);

    // Act - Successful refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error is cleared
    expect(result.current.error).toBeNull();
    expect(result.current.conditions).toEqual(mockConditions);
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty conditions array from API', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetConditions.mockResolvedValueOnce([]);

    // Act
    const { result } = renderHook(() => useConditions());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(result.current.conditions).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
