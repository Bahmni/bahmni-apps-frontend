import { useState, useCallback, useEffect } from 'react';
import { OpenMRSPatient, UpdatePatientRequest } from '../types/registration';
import { RegistrationService } from '../services/registration/registrationService';
import { useNotification } from './useNotification';

/**
 * Patient Edit Hook
 * Provides patient editing operations including loading, updating, and deleting patients
 */

interface UsePatientEditState {
  patient: OpenMRSPatient | null;
  isLoading: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
}

interface UsePatientEditActions {
  updatePatient: (data: UpdatePatientRequest) => Promise<OpenMRSPatient | null>;
  deletePatient: () => Promise<boolean>;
  refreshPatient: () => Promise<void>;
  canDelete: () => Promise<boolean>;
  clearError: () => void;
}

interface UsePatientEditReturn extends UsePatientEditState, UsePatientEditActions {}

interface UsePatientEditOptions {
  patientUuid?: string;
  autoLoad?: boolean;
}

/**
 * Custom hook for patient editing operations
 * @param options - Configuration options for the hook
 * @returns Patient edit state and actions
 */
export const usePatientEdit = (
  options: UsePatientEditOptions = {},
): UsePatientEditReturn => {
  const { patientUuid, autoLoad = true } = options;
  const notification = useNotification();

  // State management
  const [patient, setPatient] = useState<OpenMRSPatient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patient data
  const loadPatient = useCallback(
    async (uuid: string): Promise<void> => {
      if (!uuid) return;

      setIsLoading(true);
      setError(null);

      try {
        const patientData = await RegistrationService.getPatientByUuid(uuid);
        setPatient(patientData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load patient';
        setError(errorMessage);
        notification.addNotification({
          type: 'error',
          title: 'Failed to load patient data',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [notification],
  );

  // Update patient
  const updatePatient = useCallback(
    async (data: UpdatePatientRequest): Promise<OpenMRSPatient | null> => {
      if (!patientUuid) {
        notification.addNotification({
          type: 'error',
          title: 'Patient UUID is required for updating',
          message: 'Please provide a valid patient UUID to update patient data.',
        });
        return null;
      }

      setIsUpdating(true);
      setError(null);

      try {
        const updatedPatient = await RegistrationService.updatePatient(
          patientUuid,
          data,
        );
        setPatient(updatedPatient);
        notification.addNotification({
          type: 'success',
          title: 'Patient updated successfully',
          message: 'Patient data has been updated successfully.',
        });
        return updatedPatient;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
        setError(errorMessage);
        notification.addNotification({
          type: 'error',
          title: 'Failed to update patient',
          message: errorMessage,
        });
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [patientUuid, notification],
  );

  // Delete patient
  const deletePatient = useCallback(async (): Promise<boolean> => {
    if (!patientUuid) {
      notification.addNotification({
        type: 'error',
        title: 'Patient UUID is required for deletion',
        message: 'Please provide a valid patient UUID to delete patient data.',
      });
      return false;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await RegistrationService.deletePatient(patientUuid);
      notification.addNotification({
        type: 'success',
        title: 'Patient deleted successfully',
        message: 'Patient has been deleted successfully.',
      });
      setPatient(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to delete patient',
        message: errorMessage,
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [patientUuid, notification]);

  // Check if patient can be deleted
  const canDelete = useCallback(async (): Promise<boolean> => {
    if (!patientUuid) {
      return false;
    }

    try {
      return await RegistrationService.canDeletePatient(patientUuid);
    } catch (err) {
      console.error('Error checking delete permission:', err);
      return false;
    }
  }, [patientUuid]);

  // Refresh patient data
  const refreshPatient = useCallback(async (): Promise<void> => {
    if (patientUuid) {
      await loadPatient(patientUuid);
    }
  }, [patientUuid, loadPatient]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load patient on mount or when patientUuid changes
  useEffect(() => {
    if (autoLoad && patientUuid) {
      loadPatient(patientUuid);
    }
  }, [autoLoad, patientUuid, loadPatient]);

  return {
    // State
    patient,
    isLoading,
    isUpdating,
    isDeleting,
    error,

    // Actions
    updatePatient,
    deletePatient,
    refreshPatient,
    canDelete,
    clearError,
  };
};

export default usePatientEdit;
