import { ObservationForm } from '@bahmni/services';
import { useCallback } from 'react';

interface UseObservationFormActionsProps {
  viewingForm: ObservationForm | null | undefined;
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  onRemoveForm?: (formUuid: string) => void;
}

/**
 * Hook to manage observation form actions (save, discard, back)
 *
 * @param viewingForm - The currently viewing observation form
 * @param onViewingFormChange - Callback to notify parent when form viewing state changes
 * @param onRemoveForm - Optional callback to remove observation form from selected forms list
 * @returns Observation form action handlers
 */
export function useObservationFormActions({
  viewingForm,
  onViewingFormChange,
  onRemoveForm,
}: UseObservationFormActionsProps) {
  const handleDiscardForm = useCallback(() => {
    // Remove the form from selected forms list if callback is provided
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    // Close the form view
    onViewingFormChange(null);
  }, [viewingForm, onRemoveForm, onViewingFormChange]);

  const handleSaveForm = useCallback(() => {
    // TODO: Implement form saving logic
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  const handleBackToForms = useCallback(() => {
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  return {
    handleDiscardForm,
    handleSaveForm,
    handleBackToForms,
  };
}
