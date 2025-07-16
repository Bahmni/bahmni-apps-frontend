import { renderHook, act } from '@testing-library/react';
import { Coding } from 'fhir/r4';
import i18n from '@/setupTests.i18n';
import { getPatientDiagnoses } from '@services/diagnosesService';
import { Diagnosis } from '@types/diagnosis';
import { getFormattedError } from '@utils/common';
import { useDiagnoses } from '../useDiagnoses';
import { usePatientUUID } from '../usePatientUUID';

// Mock dependencies
jest.mock('@services/diagnosesService');
jest.mock('../usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetPatientDiagnoses = getPatientDiagnoses as jest.MockedFunction<
  typeof getPatientDiagnoses
>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useDiagnoses hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockCertainty: Coding = {
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
    code: 'confirmed',
    display: 'Confirmed',
  };

  const mockDiagnoses: Diagnosis[] = [
    {
      id: 'diagnosis-uuid-123',
      display: 'Hypertension',
      certainty: mockCertainty,
      recordedDate: '2023-12-01T10:30:00.000+0000',
      recorder: 'Dr. John Doe',
    },
    {
      id: 'diagnosis-uuid-456',
      display: 'Diabetes',
      certainty: mockCertainty,
      recordedDate: '2023-12-02T11:30:00.000+0000',
      recorder: 'Dr. Jane Smith',
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
    const { result } = renderHook(() => useDiagnoses());

    // Assert
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch diagnoses successfully when patient UUID is available', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockResolvedValueOnce(mockDiagnoses);

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Assert initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.diagnoses).toEqual([]);

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);
    expect(result.current.diagnoses).toEqual(mockDiagnoses);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle null patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(null);

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientDiagnoses).not.toHaveBeenCalled();
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle undefined patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue(undefined);

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientDiagnoses).not.toHaveBeenCalled();
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle empty string patient UUID correctly', async () => {
    // Arrange
    mockedUsePatientUUID.mockReturnValue('');

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientDiagnoses).not.toHaveBeenCalled();
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.error?.message).toBe('Invalid patient UUID');
    expect(result.current.loading).toBe(false);
  });

  it('should handle service error correctly', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch diagnoses');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error Title',
      message: 'Failed to fetch diagnoses',
    });

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);
    expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
    expect(result.current.error).toBe(mockError);
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error object from API correctly', async () => {
    // Arrange
    const nonErrorObject = { message: 'API Error' };
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses.mockRejectedValueOnce(nonErrorObject);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'An unexpected error occurred',
    });

    // Act
    const { result } = renderHook(() => useDiagnoses());

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    // Assert
    expect(result.current.error?.message).toBe('An unexpected error occurred');
    expect(result.current.diagnoses).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should provide a refetch function that fetches data again', async () => {
    // Arrange
    const updatedDiagnoses: Diagnosis[] = [
      {
        id: 'diagnosis-uuid-789',
        display: 'Asthma',
        certainty: mockCertainty,
        recordedDate: '2023-12-03T12:30:00.000+0000',
        recorder: 'Dr. Bob Wilson',
      },
    ];

    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockResolvedValueOnce(updatedDiagnoses);

    // Act - Initial render
    const { result } = renderHook(() => useDiagnoses());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);

    // Act - Call refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.diagnoses).toEqual(updatedDiagnoses);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledWith(mockPatientUUID);
  });

  it('should handle refetch with error correctly', async () => {
    // Arrange
    const mockError = new Error('Refetch failed');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockRejectedValueOnce(mockError);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Refetch failed',
    });

    // Act - Initial render
    const { result } = renderHook(() => useDiagnoses());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);
    expect(result.current.error).toBeNull();

    // Act - Call refetch with error
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error state
    expect(result.current.error).toBe(mockError);
    expect(result.current.diagnoses).toEqual([]); // Should reset on error
    expect(result.current.loading).toBe(false);
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledTimes(2);
  });

  it('should update when patient UUID changes', async () => {
    // Arrange
    const newPatientUUID = 'patient-uuid-456';
    const newDiagnoses: Diagnosis[] = [
      {
        id: 'diagnosis-uuid-999',
        display: 'Migraine',
        certainty: mockCertainty,
        recordedDate: '2023-12-04T15:30:00.000+0000',
        recorder: 'Dr. Alice Brown',
      },
    ];

    mockedGetPatientDiagnoses
      .mockResolvedValueOnce(mockDiagnoses)
      .mockResolvedValueOnce(newDiagnoses);

    // Act - Initial render with first patient UUID
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    const { result, rerender } = renderHook(() => useDiagnoses());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.diagnoses).toEqual(mockDiagnoses);

    // Act - Change patient UUID
    mockedUsePatientUUID.mockReturnValue(newPatientUUID);
    rerender();

    // Wait for new fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Assert final state
    expect(result.current.diagnoses).toEqual(newDiagnoses);
    expect(mockedGetPatientDiagnoses).toHaveBeenCalledTimes(2);
    expect(mockedGetPatientDiagnoses).toHaveBeenNthCalledWith(
      1,
      mockPatientUUID,
    );
    expect(mockedGetPatientDiagnoses).toHaveBeenNthCalledWith(
      2,
      newPatientUUID,
    );
  });

  it('should clear error state on successful refetch', async () => {
    // Arrange
    const mockError = new Error('Initial error');
    mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
    mockedGetPatientDiagnoses
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockDiagnoses);
    mockedGetFormattedError.mockReturnValueOnce({
      title: 'Error',
      message: 'Initial error',
    });

    // Act - Initial render with error
    const { result } = renderHook(() => useDiagnoses());

    // Wait for initial fetch (error)
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe(mockError);
    expect(result.current.diagnoses).toEqual([]);

    // Act - Successful refetch
    await act(async () => {
      result.current.refetch();
      await Promise.resolve();
    });

    // Assert error is cleared
    expect(result.current.error).toBeNull();
    expect(result.current.diagnoses).toEqual(mockDiagnoses);
    expect(result.current.loading).toBe(false);
  });
});
