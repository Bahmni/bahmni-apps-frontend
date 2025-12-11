import {
  ObservationForm,
  ObservationPayload,
  ValidationError,
} from '@bahmni/services';
import { useCallback } from 'react';

interface UseObservationFormActionsProps {
  viewingForm: ObservationForm | null | undefined;
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  onRemoveForm?: (formUuid: string) => void;
  observations: ObservationPayload[];
  hasData: boolean;
  isValid: boolean;
  validationErrors: ValidationError[];
  onFormObservationsChange?: (
    formUuid: string,
    observations: ObservationPayload[],
  ) => void;
  clearFormData: () => void;
}

/**
 * Hook to manage observation form actions (save, discard, back)
 *
 * This hook handles:
 * - Form saving: Validates data and lifts observations to parent for consultation bundle
 * - Form discarding: Clears form data and optionally removes from selected forms
 * - Navigation back: Keeps form data but returns to form list
 *
 * @param props - Hook properties including form state, validation, and callbacks
 * @returns Observation form action handlers
 */
export function useObservationFormActions({
  viewingForm,
  onViewingFormChange,
  onRemoveForm,
  observations,
  hasData,
  isValid,
  validationErrors,
  onFormObservationsChange,
  clearFormData,
}: UseObservationFormActionsProps) {
  const handleDiscardForm = useCallback(() => {
    // Clear form data
    clearFormData();

    // Remove the form from selected forms list if callback is provided
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }

    // Close the form view
    onViewingFormChange(null);
  }, [viewingForm, onRemoveForm, onViewingFormChange, clearFormData]);

  const handleSaveForm = useCallback(() => {
    // Validate form has data
    if (!hasData) {
      console.warn('Cannot save observation form: No data entered');
      return;
    }

    // Validate form data
    if (!isValid) {
      console.error('Cannot save observation form: Validation errors', validationErrors);
      // TODO: Show validation errors to user
      return;
    }

    // Lift observations to parent for inclusion in consultation bundle
    if (viewingForm && onFormObservationsChange) {
      onFormObservationsChange(viewingForm.uuid, observations);
    }

    // DO NOT clear form data - keep it so user can reopen and edit
    // Data will only be cleared when user explicitly discards the form

    // Close the form view
    onViewingFormChange(null);
  }, [
    viewingForm,
    onViewingFormChange,
    observations,
    hasData,
    isValid,
    validationErrors,
    onFormObservationsChange,
  ]);

  const handleBackToForms = useCallback(() => {
    // Keep form data, just close the view
    // This allows user to come back and continue editing
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  return {
    handleDiscardForm,
    handleSaveForm,
    handleBackToForms,
  };
}
