import { ObservationForm } from '@bahmni/services';
import { useCallback, useMemo } from 'react';

interface UseObservationFormPinningProps {
  viewingForm: ObservationForm | null | undefined;
  pinnedForms: ObservationForm[];
  updatePinnedForms: (newPinnedForms: ObservationForm[]) => Promise<void>;
}

/**
 * Hook to manage observation form pinning logic
 *
 * @param viewingForm - The currently viewing observation form
 * @param pinnedForms - Array of pinned observation forms
 * @param updatePinnedForms - Callback to update pinned forms
 * @returns Pin state and toggle handler
 */
export function useObservationFormPinning({
  viewingForm,
  pinnedForms,
  updatePinnedForms,
}: UseObservationFormPinningProps) {
  // Check if current form is pinned
  const isCurrentFormPinned = useMemo(
    () =>
      viewingForm
        ? pinnedForms.some((form) => form.uuid === viewingForm.uuid)
        : false,
    [viewingForm, pinnedForms],
  );

  // Handle pin/unpin toggle
  const handlePinToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (viewingForm) {
        let newPinnedForms;
        if (isCurrentFormPinned) {
          newPinnedForms = pinnedForms.filter(
            (form) => form.uuid !== viewingForm.uuid,
          );
        } else {
          newPinnedForms = [...pinnedForms, viewingForm];
        }
        updatePinnedForms(newPinnedForms);
      }
    },
    [viewingForm, isCurrentFormPinned, pinnedForms, updatePinnedForms],
  );

  return {
    isCurrentFormPinned,
    handlePinToggle,
  };
}
