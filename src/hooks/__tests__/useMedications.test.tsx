import { renderHook, act } from '@testing-library/react';
import { useMedications } from '../useMedications';
import { FormattedMedication, MedicationStatus } from '@types/medication';
import { getPatientMedications } from '@services/medicationService';
import { usePatientUUID } from '../usePatientUUID';
import { getFormattedError } from '@utils/common';
import i18n from '@/setupTests.i18n';

// Mock dependencies
jest.mock('@services/medicationService');
jest.mock('../usePatientUUID');
jest.mock('@utils/common');

// Type the mocked functions
const mockedGetPatientMedications =
  getPatientMedications as jest.MockedFunction<typeof getPatientMedications>;
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;

describe('useMedications hook', () => {
  const mockPatientUUID = 'patient-uuid-123';

  const mockMedications: FormattedMedication[] = [
    {
      id: 'medication-uuid-123',
      name: 'Aspirin 100mg',
      form: 'Tablet',
      dose: '100 mg',
      frequency: '1 / 1day',
      route: 'Oral',
      duration: '30 days',
      status: MedicationStatus.Active,
      priority: '',
      startDate: '2023-12-01T10:30:00.000+0000',
      orderDate: '2023-12-01T09:30:00.000+0000',
      orderedBy: 'Dr. John Doe',
      notes: 'Take with food',
      isActive: true,
      isScheduled: false,
    },
    {
      id: 'medication-uuid-456',
      name: 'Metformin 500mg',
      form: 'Tablet',
      dose: '500 mg',
      frequency: '2 / 1day',
      route: 'Oral',
      duration: '90 days',
      status: MedicationStatus.Completed,
      priority: '',
      startDate: '2023-11-01T10:30:00.000+0000',
      orderDate: '2023-11-01T09:30:00.000+0000',
      orderedBy: 'Dr. Jane Smith',
      notes: 'Take after meals',
      isActive: false,
      isScheduled: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Happy Path Cases', () => {
    it('should initialize with correct default values', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);

      // Act
      const { result } = renderHook(() => useMedications());

      // Assert
      expect(result.current.medications).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch medications successfully when patient UUID is available', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce(mockMedications);

      // Act
      const { result } = renderHook(() => useMedications());

      // Assert initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.medications).toEqual([]);

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert final state
      expect(mockedGetPatientMedications).toHaveBeenCalledWith(mockPatientUUID);
      expect(result.current.medications).toEqual(mockMedications);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle empty medications array', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce([]);

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.medications).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle medications with different statuses', async () => {
      // Arrange
      const medicationsWithDifferentStatuses: FormattedMedication[] = [
        {
          ...mockMedications[0],
          status: MedicationStatus.Active,
          isActive: true,
          isScheduled: false,
        },
        {
          ...mockMedications[1],
          status: MedicationStatus.Scheduled,
          isActive: false,
          isScheduled: true,
        },
        {
          ...mockMedications[0],
          id: 'medication-uuid-789',
          status: MedicationStatus.Stopped,
          isActive: false,
          isScheduled: false,
        },
      ];

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce(
        medicationsWithDifferentStatuses,
      );

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.medications).toHaveLength(3);
      expect(result.current.medications[0].status).toBe(
        MedicationStatus.Active,
      );
      expect(result.current.medications[0].isActive).toBe(true);
      expect(result.current.medications[1].status).toBe(
        MedicationStatus.Scheduled,
      );
      expect(result.current.medications[1].isScheduled).toBe(true);
      expect(result.current.medications[2].status).toBe(
        MedicationStatus.Stopped,
      );
      expect(result.current.medications[2].isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle null patient UUID correctly', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(mockedGetPatientMedications).not.toHaveBeenCalled();
      expect(result.current.medications).toEqual([]);
      expect(result.current.error?.message).toBe('Invalid patient UUID');
      expect(result.current.loading).toBe(false);
    });

    it('should handle undefined patient UUID correctly', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(mockedGetPatientMedications).not.toHaveBeenCalled();
      expect(result.current.medications).toEqual([]);
      expect(result.current.error?.message).toBe('Invalid patient UUID');
      expect(result.current.loading).toBe(false);
    });

    it('should handle empty string patient UUID correctly', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue('');

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(mockedGetPatientMedications).not.toHaveBeenCalled();
      expect(result.current.medications).toEqual([]);
      expect(result.current.error?.message).toBe('Invalid patient UUID');
      expect(result.current.loading).toBe(false);
    });

    it('should handle service error correctly', async () => {
      // Arrange
      const mockError = new Error('Failed to fetch medications');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockRejectedValueOnce(mockError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Error Title',
        message: 'Failed to fetch medications',
      });

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(mockedGetPatientMedications).toHaveBeenCalledWith(mockPatientUUID);
      expect(mockedGetFormattedError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toBe(mockError);
      expect(result.current.medications).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle non-Error object from API correctly', async () => {
      // Arrange
      const nonErrorObject = { message: 'API Error' };
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockRejectedValueOnce(nonErrorObject);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'An unexpected error occurred',
      });

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.error?.message).toBe(
        'An unexpected error occurred',
      );
      expect(result.current.medications).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockRejectedValueOnce(timeoutError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Network Error',
        message: 'Request timed out',
      });

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.error).toBe(timeoutError);
      expect(result.current.medications).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Refetch Functionality', () => {
    it('should provide a refetch function that fetches data again', async () => {
      // Arrange
      const updatedMedications: FormattedMedication[] = [
        {
          id: 'medication-uuid-999',
          name: 'Lisinopril 10mg',
          form: 'Tablet',
          dose: '10 mg',
          frequency: '1 / 1day',
          route: 'Oral',
          duration: '30 days',
          status: MedicationStatus.Active,
          priority: '',
          startDate: '2023-12-03T12:30:00.000+0000',
          orderDate: '2023-12-03T11:30:00.000+0000',
          orderedBy: 'Dr. Bob Wilson',
          notes: 'Monitor blood pressure',
          isActive: true,
          isScheduled: false,
        },
      ];

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications
        .mockResolvedValueOnce(mockMedications)
        .mockResolvedValueOnce(updatedMedications);

      // Act - Initial render
      const { result } = renderHook(() => useMedications());

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.medications).toEqual(mockMedications);

      // Act - Call refetch
      await act(async () => {
        result.current.refetch();
        await Promise.resolve();
      });

      // Assert final state
      expect(result.current.medications).toEqual(updatedMedications);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockedGetPatientMedications).toHaveBeenCalledTimes(2);
      expect(mockedGetPatientMedications).toHaveBeenCalledWith(mockPatientUUID);
    });

    it('should handle refetch with error correctly', async () => {
      // Arrange
      const mockError = new Error('Refetch failed');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications
        .mockResolvedValueOnce(mockMedications)
        .mockRejectedValueOnce(mockError);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Refetch failed',
      });

      // Act - Initial render
      const { result } = renderHook(() => useMedications());

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.medications).toEqual(mockMedications);
      expect(result.current.error).toBeNull();

      // Act - Call refetch with error
      await act(async () => {
        result.current.refetch();
        await Promise.resolve();
      });

      // Assert error state
      expect(result.current.error).toBe(mockError);
      expect(result.current.medications).toEqual([]); // Should reset on error
      expect(result.current.loading).toBe(false);
      expect(mockedGetPatientMedications).toHaveBeenCalledTimes(2);
    });

    it('should clear error state on successful refetch', async () => {
      // Arrange
      const mockError = new Error('Initial error');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockMedications);
      mockedGetFormattedError.mockReturnValueOnce({
        title: 'Error',
        message: 'Initial error',
      });

      // Act - Initial render with error
      const { result } = renderHook(() => useMedications());

      // Wait for initial fetch (error)
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.medications).toEqual([]);

      // Act - Successful refetch
      await act(async () => {
        result.current.refetch();
        await Promise.resolve();
      });

      // Assert error is cleared
      expect(result.current.error).toBeNull();
      expect(result.current.medications).toEqual(mockMedications);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Patient UUID Changes', () => {
    it('should update when patient UUID changes', async () => {
      // Arrange
      const newPatientUUID = 'patient-uuid-456';
      const newMedications: FormattedMedication[] = [
        {
          id: 'medication-uuid-888',
          name: 'Atorvastatin 20mg',
          form: 'Tablet',
          dose: '20 mg',
          frequency: '1 / 1day',
          route: 'Oral',
          duration: '90 days',
          status: MedicationStatus.Active,
          priority: '',
          startDate: '2023-12-04T15:30:00.000+0000',
          orderDate: '2023-12-04T14:30:00.000+0000',
          orderedBy: 'Dr. Alice Brown',
          notes: 'Monitor liver function',
          isActive: true,
          isScheduled: false,
        },
      ];

      mockedGetPatientMedications
        .mockResolvedValueOnce(mockMedications)
        .mockResolvedValueOnce(newMedications);

      // Act - Initial render with first patient UUID
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      const { result, rerender } = renderHook(() => useMedications());

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.medications).toEqual(mockMedications);

      // Act - Change patient UUID
      mockedUsePatientUUID.mockReturnValue(newPatientUUID);
      rerender();

      // Wait for new fetch
      await act(async () => {
        await Promise.resolve();
      });

      // Assert final state
      expect(result.current.medications).toEqual(newMedications);
      expect(mockedGetPatientMedications).toHaveBeenCalledTimes(2);
      expect(mockedGetPatientMedications).toHaveBeenNthCalledWith(
        1,
        mockPatientUUID,
      );
      expect(mockedGetPatientMedications).toHaveBeenNthCalledWith(
        2,
        newPatientUUID,
      );
    });

    it('should handle patient UUID changing from valid to null', async () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce(mockMedications);

      // Act - Initial render with valid UUID
      const { result, rerender } = renderHook(() => useMedications());

      // Wait for initial fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.medications).toEqual(mockMedications);
      expect(result.current.error).toBeNull();

      // Act - Change to null UUID
      mockedUsePatientUUID.mockReturnValue(null);
      rerender();

      // Wait for state update
      await act(async () => {
        await Promise.resolve();
      });

      // Assert - The hook keeps the previous medications but sets an error
      expect(result.current.medications).toEqual(mockMedications); // Medications remain from previous successful fetch
      expect(result.current.error?.message).toBe('Invalid patient UUID');
      expect(result.current.loading).toBe(false);
      expect(mockedGetPatientMedications).toHaveBeenCalledTimes(1); // Should not call again
    });
  });

  describe('Edge Cases', () => {
    it('should handle medications with minimal data', async () => {
      // Arrange
      const minimalMedications: FormattedMedication[] = [
        {
          id: 'minimal-med',
          name: 'Unknown Medication',
          form: '',
          dose: '',
          frequency: '',
          route: '',
          duration: '',
          status: MedicationStatus.Active,
          priority: '',
          startDate: '',
          orderDate: '',
          orderedBy: '',
          notes: '',
          isActive: true,
          isScheduled: false,
        },
      ];

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce(minimalMedications);

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.medications).toEqual(minimalMedications);
      expect(result.current.medications[0].name).toBe('Unknown Medication');
      expect(result.current.medications[0].dose).toBe('');
      expect(result.current.medications[0].notes).toBe('');
    });

    it('should handle large number of medications', async () => {
      // Arrange
      const largeMedicationList: FormattedMedication[] = Array.from(
        { length: 100 },
        (_, index) => ({
          id: `medication-${index}`,
          name: `Medication ${index}`,
          form: 'Tablet',
          dose: `${(index + 1) * 10} mg`,
          frequency: '1 / 1day',
          route: 'Oral',
          duration: '30 days',
          status:
            index % 2 === 0
              ? MedicationStatus.Active
              : MedicationStatus.Completed,
          priority: '',
          startDate: '2023-12-01T10:30:00.000+0000',
          orderDate: '2023-12-01T09:30:00.000+0000',
          orderedBy: 'Dr. Test',
          notes: `Notes for medication ${index}`,
          isActive: index % 2 === 0,
          isScheduled: false,
        }),
      );

      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedGetPatientMedications.mockResolvedValueOnce(largeMedicationList);

      // Act
      const { result } = renderHook(() => useMedications());

      // Wait for async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.medications).toHaveLength(100);
      expect(result.current.medications[0].name).toBe('Medication 0');
      expect(result.current.medications[99].name).toBe('Medication 99');
    });

    it('should handle rapid patient UUID changes', async () => {
      // Arrange
      const uuid1 = 'patient-1';
      const uuid2 = 'patient-2';
      const uuid3 = 'patient-3';

      mockedGetPatientMedications
        .mockResolvedValueOnce([{ ...mockMedications[0], id: 'med-1' }])
        .mockResolvedValueOnce([{ ...mockMedications[0], id: 'med-2' }])
        .mockResolvedValueOnce([{ ...mockMedications[0], id: 'med-3' }]);

      // Act - Rapid UUID changes
      mockedUsePatientUUID.mockReturnValue(uuid1);
      const { result, rerender } = renderHook(() => useMedications());

      mockedUsePatientUUID.mockReturnValue(uuid2);
      rerender();

      mockedUsePatientUUID.mockReturnValue(uuid3);
      rerender();

      // Wait for all async operations
      await act(async () => {
        await Promise.resolve();
      });

      // Assert - Should have the latest data
      expect(result.current.medications[0].id).toBe('med-3');
      expect(mockedGetPatientMedications).toHaveBeenCalledTimes(3);
    });
  });
});
