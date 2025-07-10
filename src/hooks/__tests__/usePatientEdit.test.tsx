import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientEdit } from '../usePatientEdit';
import { RegistrationService } from '../../services/registration/registrationService';
import { useNotification } from '../useNotification';
import { mockPatients } from '../../__mocks__/registrationMocks';
import { OpenMRSPatient } from '../../types/registration';

// Mock dependencies
jest.mock('../../services/registration/registrationService');
jest.mock('../useNotification');

const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

describe('usePatientEdit', () => {
  const mockNotification = {
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotification.mockReturnValue(mockNotification);
  });

  describe('Patient Loading', () => {
    it('should load patient data successfully', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.patient).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.patient).toEqual(mockPatient);
        expect(result.current.error).toBeNull();
      });

      expect(mockRegistrationService.getPatientByUuid).toHaveBeenCalledWith(patientUuid);
    });

    it('should handle patient loading error', async () => {
      const patientUuid = 'test-patient-uuid';
      const errorMessage = 'Failed to load patient';
      mockRegistrationService.getPatientByUuid.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.patient).toBeNull();
        expect(result.current.error).toBe(errorMessage);
      });

      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to load patient data',
        message: errorMessage,
      });
    });

    it('should not load patient when patientUuid is not provided', () => {
      const { result } = renderHook(() => usePatientEdit({}));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.patient).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockRegistrationService.getPatientByUuid).not.toHaveBeenCalled();
    });
  });

  describe('Patient Updating', () => {
    it('should update patient successfully', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      const updatedPatient = { ...mockPatient, person: { ...mockPatient.person, display: 'Updated Name' } };

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.updatePatient.mockResolvedValue(updatedPatient);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      const updateData = { person: { display: 'Updated Name' } };
      let updateResult: OpenMRSPatient | null = null;

      await act(async () => {
        updateResult = await result.current.updatePatient(updateData);
      });

      expect(updateResult).toEqual(updatedPatient);
      expect(result.current.patient).toEqual(updatedPatient);
      expect(result.current.isUpdating).toBe(false);
      expect(mockRegistrationService.updatePatient).toHaveBeenCalledWith(patientUuid, updateData);
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Patient updated successfully',
        message: 'Patient data has been updated successfully.',
      });
    });

    it('should handle patient update error', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      const errorMessage = 'Failed to update patient';

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.updatePatient.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      const updateData = { person: { display: 'Updated Name' } };
      let updateResult: OpenMRSPatient | null = null;

      await act(async () => {
        updateResult = await result.current.updatePatient(updateData);
      });

      expect(updateResult).toBeNull();
      expect(result.current.patient).toEqual(mockPatient); // Should remain unchanged
      expect(result.current.isUpdating).toBe(false);
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to update patient',
        message: errorMessage,
      });
    });

    it('should not update patient when patientUuid is not available', async () => {
      const { result } = renderHook(() => usePatientEdit({}));

      const updateData = { person: { display: 'Updated Name' } };
      let updateResult: OpenMRSPatient | null = null;

      await act(async () => {
        updateResult = await result.current.updatePatient(updateData);
      });

      expect(updateResult).toBeNull();
      expect(mockRegistrationService.updatePatient).not.toHaveBeenCalled();
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Patient UUID is required for updating',
        message: 'Please provide a valid patient UUID to update patient data.',
      });
    });
  });

  describe('Patient Deletion', () => {
    it('should delete patient successfully', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.deletePatient.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      let deleteResult = false;

      await act(async () => {
        deleteResult = await result.current.deletePatient();
      });

      expect(deleteResult).toBe(true);
      expect(result.current.isDeleting).toBe(false);
      expect(mockRegistrationService.deletePatient).toHaveBeenCalledWith(patientUuid);
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Patient deleted successfully',
        message: 'Patient has been deleted successfully.',
      });
    });

    it('should handle patient deletion error', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      const errorMessage = 'Failed to delete patient';

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.deletePatient.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      let deleteResult = false;

      await act(async () => {
        deleteResult = await result.current.deletePatient();
      });

      expect(deleteResult).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to delete patient',
        message: errorMessage,
      });
    });

    it('should not delete patient when patientUuid is not available', async () => {
      const { result } = renderHook(() => usePatientEdit({}));

      let deleteResult = false;

      await act(async () => {
        deleteResult = await result.current.deletePatient();
      });

      expect(deleteResult).toBe(false);
      expect(mockRegistrationService.deletePatient).not.toHaveBeenCalled();
      expect(mockNotification.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Patient UUID is required for deletion',
        message: 'Please provide a valid patient UUID to delete patient data.',
      });
    });
  });

  describe('Delete Permission Checking', () => {
    it('should return true when patient can be deleted', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.canDeletePatient.mockResolvedValue(true);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      let canDelete = false;

      await act(async () => {
        canDelete = await result.current.canDelete();
      });

      expect(canDelete).toBe(true);
      expect(mockRegistrationService.canDeletePatient).toHaveBeenCalledWith(patientUuid);
    });

    it('should return false when patient cannot be deleted', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.canDeletePatient.mockResolvedValue(false);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      let canDelete = true;

      await act(async () => {
        canDelete = await result.current.canDelete();
      });

      expect(canDelete).toBe(false);
      expect(mockRegistrationService.canDeletePatient).toHaveBeenCalledWith(patientUuid);
    });

    it('should return false when patientUuid is not available', async () => {
      const { result } = renderHook(() => usePatientEdit({}));

      let canDelete = true;

      await act(async () => {
        canDelete = await result.current.canDelete();
      });

      expect(canDelete).toBe(false);
      expect(mockRegistrationService.canDeletePatient).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Patient Data', () => {
    it('should refresh patient data successfully', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      const refreshedPatient = { ...mockPatient, person: { ...mockPatient.person, display: 'Refreshed Name' } };

      mockRegistrationService.getPatientByUuid.mockResolvedValueOnce(mockPatient);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      // Mock the refreshed data
      mockRegistrationService.getPatientByUuid.mockResolvedValueOnce(refreshedPatient);

      await act(async () => {
        await result.current.refreshPatient();
      });

      expect(result.current.patient).toEqual(refreshedPatient);
      expect(result.current.isLoading).toBe(false);
      expect(mockRegistrationService.getPatientByUuid).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh error', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];
      const errorMessage = 'Failed to refresh patient';

      mockRegistrationService.getPatientByUuid.mockResolvedValueOnce(mockPatient);

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      // Mock the refresh error
      mockRegistrationService.getPatientByUuid.mockRejectedValueOnce(new Error(errorMessage));

      await act(async () => {
        await result.current.refreshPatient();
      });

      expect(result.current.patient).toEqual(mockPatient); // Should remain unchanged
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Loading States', () => {
    it('should manage loading states correctly during operations', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];

      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.updatePatient.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockPatient), 100))
      );

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.patient).toEqual(mockPatient);
      });

      // Test updating state
      act(() => {
        result.current.updatePatient({ person: { display: 'Updated' } });
      });

      expect(result.current.isUpdating).toBe(true);

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should clear error when loading patient successfully after error', async () => {
      const patientUuid = 'test-patient-uuid';
      const mockPatient = mockPatients[0];

      // First call fails
      mockRegistrationService.getPatientByUuid.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePatientEdit({ patientUuid }));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Second call succeeds
      mockRegistrationService.getPatientByUuid.mockResolvedValueOnce(mockPatient);

      await act(async () => {
        await result.current.refreshPatient();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.patient).toEqual(mockPatient);
    });
  });
});
