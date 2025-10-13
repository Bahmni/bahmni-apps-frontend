import {
  ActionArea,
  Icon,
  ICON_SIZE,
} from '@bahmni-frontend/bahmni-design-system';
import { ObservationForm } from '@bahmni-frontend/bahmni-services';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_FORM_API_NAMES } from '../../../constants/forms';
import styles from './styles/ObservationFormsContainer.module.scss';

interface ObservationFormsContainerProps {
  // Callback to notify parent when form viewing starts/ends
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  // The currently viewing form (passed from parent)
  viewingForm?: ObservationForm | null;
  // Callback to remove form from selected forms list
  onRemoveForm?: (formUuid: string) => void;
  // Pinned forms state passed from parent (required)
  pinnedForms: ObservationForm[];
  updatePinnedForms: (newPinnedForms: ObservationForm[]) => Promise<void>;
}

/**
 * ObservationFormsWrapper component
 *
 * Wraps the ObservationForms component with additional functionality that was extracted from ConsultationPad.
 * This component manages its own state for selected forms and viewing form,
 * and renders its own ActionArea when viewing a form.
 *
 * When viewing a form, it takes over the entire UI with its own ActionArea.
 * When not viewing a form, it renders just the observation forms component.
 */
const ObservationFormsContainer: React.FC<ObservationFormsContainerProps> = ({
  onViewingFormChange,
  viewingForm: externalViewingForm,
  onRemoveForm,
  pinnedForms,
  updatePinnedForms,
}) => {
  const { t } = useTranslation();

  // Use the external viewingForm from parent
  const viewingForm = externalViewingForm;

  // Check if current form is pinned
  const isCurrentFormPinned = viewingForm
    ? pinnedForms.some((form) => form.uuid === viewingForm.uuid)
    : false;

  const handlePinToggle = (e: React.MouseEvent) => {
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
  };

  const handleDiscardForm = () => {
    // Remove the form from selected forms list if callback is provided
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    // Close the form view
    onViewingFormChange(null);
  };

  const handleSaveForm = () => {
    // TODO: Implement form saving logic
    onViewingFormChange(null);
  };

  // Form view content when a form is selected
  const formViewContent = (
    <div className={styles.formView}>
      <div className={styles.formContent}>
        {/* TODO: Actual form rendering will be implemented here */}
        {/* For now, show empty content as form rendering is not yet implemented */}
      </div>
    </div>
  );

  // Create a custom title with pin icon
  const formTitleWithPin = (
    <div className={styles.formTitleContainer}>
      <span>{viewingForm?.name}</span>
      {!DEFAULT_FORM_API_NAMES.includes(viewingForm?.name ?? '') && (
        <div
          onClick={handlePinToggle}
          className={`${styles.pinIconContainer} ${isCurrentFormPinned ? styles.pinned : styles.unpinned}`}
          title={isCurrentFormPinned ? 'Unpin form' : 'Pin form'}
        >
          <Icon id="pin-icon" name="fa-thumbtack" size={ICON_SIZE.SM} />
        </div>
      )}
    </div>
  );

  // If viewing a form, render the form with its own ActionArea
  if (viewingForm) {
    return (
      <ActionArea
        className={styles.formViewActionArea}
        title={formTitleWithPin as unknown as string}
        primaryButtonText={t('OBSERVATION_FORM_SAVE_BUTTON')}
        onPrimaryButtonClick={handleSaveForm}
        isPrimaryButtonDisabled={false}
        secondaryButtonText={t('OBSERVATION_FORM_DISCARD_BUTTON')}
        onSecondaryButtonClick={handleDiscardForm}
        tertiaryButtonText={t('OBSERVATION_FORM_BACK_BUTTON')}
        onTertiaryButtonClick={() => {
          onViewingFormChange(null);
        }}
        content={formViewContent}
      />
    );
  }

  // If no form is being viewed, render nothing
  return null;
};

export default ObservationFormsContainer;
