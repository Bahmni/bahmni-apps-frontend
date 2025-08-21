import React from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { ObservationForm } from '@types/observationForms';
import * as styles from '../../consultationPad/styles/ConsultationPad.module.scss';

interface ObservationFormsWrapperProps {
  // Callback to notify parent when form viewing starts/ends
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  // The currently viewing form (passed from parent)
  viewingForm?: ObservationForm | null;
  // Callback to remove form from selected forms list
  onRemoveForm?: (formUuid: string) => void;
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
const ObservationFormsWrapper: React.FC<ObservationFormsWrapperProps> = ({
  onViewingFormChange,
  viewingForm: externalViewingForm,
  onRemoveForm,
}) => {
  const { t } = useTranslation();

  // Use the external viewingForm from parent
  const viewingForm = externalViewingForm;

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

  // If viewing a form, render the form with its own ActionArea
  if (viewingForm) {
    return (
      <ActionArea
        className={styles.formViewActionArea}
        title={viewingForm.name}
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

export default ObservationFormsWrapper;
