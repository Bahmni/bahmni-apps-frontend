import {
  ObservationForm,
  ObservationDataInFormControls,
  ValidationError,
} from '@bahmni/services';
import { useCallback } from 'react';

interface UseObservationFormActionsProps {
  viewingForm: ObservationForm | null | undefined;
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  onRemoveForm?: (formUuid: string) => void;
  observations: ObservationDataInFormControls[];
  hasData: boolean;
  isValid: boolean;
  validationErrors: ValidationError[];
  onFormObservationsChange?: (
    formUuid: string,
    observations: ObservationDataInFormControls[],
  ) => void;
  clearFormData: () => void;
}

export function useObservationFormActions({
  viewingForm,
  onViewingFormChange,
  onRemoveForm,
  observations,
  hasData,
  isValid,
  onFormObservationsChange,
  clearFormData,
}: UseObservationFormActionsProps) {
  const handleDiscardForm = useCallback(() => {
    clearFormData();

    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }

    onViewingFormChange(null);
  }, [viewingForm, onRemoveForm, onViewingFormChange, clearFormData]);

  const handleSaveForm = useCallback(() => {
    if (!hasData) {
      return;
    }

    if (!isValid) {
      return;
    }

    if (viewingForm && onFormObservationsChange) {
      onFormObservationsChange(viewingForm.uuid, observations);
    }

    onViewingFormChange(null);
  }, [
    viewingForm,
    onViewingFormChange,
    observations,
    hasData,
    isValid,
    onFormObservationsChange,
  ]);

  const handleBackToForms = useCallback(() => {
    onViewingFormChange(null);
  }, [onViewingFormChange]);

  return {
    handleDiscardForm,
    handleSaveForm,
    handleBackToForms,
  };
}
