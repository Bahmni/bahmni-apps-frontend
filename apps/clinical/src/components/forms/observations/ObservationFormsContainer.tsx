import {
  ActionArea,
  Icon,
  ICON_SIZE,
  InlineNotification,
  SkeletonText,
} from '@bahmni/design-system';
import {
  Container,
  FormMetadata as Form2FormMetadata,
} from '@bahmni/form2-controls';
import '@bahmni/form2-controls/dist/bundle.css';
import './styles/form2-controls-fixes.scss';
import {
  ObservationForm,
  Form2Observation,
  getFormattedError,
  getUserPreferredLocale,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_FORM_API_NAMES } from '../../../constants/forms';
import { useObservationFormData } from '../../../hooks/useObservationFormData';
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
  // Callback to lift observation form data to parent for consultation bundle
  onFormObservationsChange?: (
    formUuid: string,
    observations: Form2Observation[],
  ) => void;
  // Existing saved observations for the current form (for edit mode)
  existingObservations?: Form2Observation[];
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
  viewingForm,
  onRemoveForm,
  pinnedForms,
  updatePinnedForms,
  onFormObservationsChange,
  existingObservations,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [showValidationError, setShowValidationError] = useState(false);
  const formContainerRef = useRef<Container>(null);

  const {
    observations,
    handleFormDataChange,
    resetForm,
    formMetadata,
    isLoadingMetadata,
    metadataError,
  } = useObservationFormData(
    viewingForm?.uuid ? { formUuid: viewingForm.uuid } : undefined,
  );

  // Check if current form is pinned
  const isCurrentFormPinned = viewingForm
    ? pinnedForms.some((form) => form.uuid === viewingForm.uuid)
    : false;

  // Handle pin/unpin toggle
  const handlePinToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewingForm) {
      const newPinnedForms = isCurrentFormPinned
        ? pinnedForms.filter((form) => form.uuid !== viewingForm.uuid)
        : [...pinnedForms, viewingForm];
      updatePinnedForms(newPinnedForms);
    }
  };

  // Handle form discard - remove from list and exit view mode
  const handleDiscardForm = () => {
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    onViewingFormChange(null);
  };

  // Handle form save - lift observations to parent and exit view mode
  const handleSaveForm = () => {
    if (viewingForm && onFormObservationsChange) {
      onFormObservationsChange(viewingForm.uuid, observations);
    }
    onViewingFormChange(null);
  };

  // Handle back navigation - exit view mode without saving
  const handleBack = () => {
    onViewingFormChange(null);
  };

  // Validate form and save if no errors
  const validateAndSave = () => {
    if (formContainerRef.current) {
      const { errors } = formContainerRef.current.getValue();
      if (errors && errors.length > 0) {
        setShowValidationError(true);
        return;
      }

      setShowValidationError(false);
      handleSaveForm();
    }
  };

  // Discard form and clear validation errors
  const discard = () => {
    setShowValidationError(false);
    resetForm();
    handleDiscardForm();
  };

  // Navigate back to forms list and clear validation errors
  const navigateToForms = () => {
    setShowValidationError(false);
    handleBack();
  };

  // Format error for display
  const error = metadataError
    ? new Error(
        getFormattedError(metadataError).message ??
          t('ERROR_FETCHING_FORM_METADATA'),
      )
    : null;

  // Form view content when a form is selected
  const formViewContent = (
    <div className={styles.formView}>
      {showValidationError && (
        <div className={styles.errorNotificationWrapper}>
          <InlineNotification
            kind="error"
            title={t('OBSERVATION_FORM_VALIDATION_ERROR_TITLE')}
            subtitle={t('OBSERVATION_FORM_VALIDATION_ERROR_SUBTITLE')}
            lowContrast
            hideCloseButton={false}
            onClose={() => setShowValidationError(false)}
          />
        </div>
      )}

      <div className={styles.formContent}>
        {isLoadingMetadata ? (
          <SkeletonText width="100%" lineCount={3} />
        ) : error ? (
          <div>{error.message}</div>
        ) : formMetadata && patientUUID ? (
          <Container
            ref={formContainerRef}
            metadata={{
              ...(formMetadata.schema as Form2FormMetadata),
              name: viewingForm?.name,
              version: formMetadata.version || '1',
            }}
            observations={existingObservations ?? []}
            patient={{ uuid: patientUUID }}
            translations={formMetadata.translations ?? {}}
            validate={showValidationError}
            validateForm={showValidationError}
            collapse={false}
            locale={getUserPreferredLocale()}
            onValueUpdated={handleFormDataChange}
          />
        ) : (
          <div>{t('OBSERVATION_FORM_LOADING_METADATA_ERROR')}</div>
        )}
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
        onPrimaryButtonClick={validateAndSave}
        isPrimaryButtonDisabled={false}
        secondaryButtonText={t('OBSERVATION_FORM_DISCARD_BUTTON')}
        onSecondaryButtonClick={discard}
        tertiaryButtonText={t('OBSERVATION_FORM_BACK_BUTTON')}
        onTertiaryButtonClick={navigateToForms}
        content={formViewContent}
      />
    );
  }

  // If no form is being viewed, render nothing
  return null;
};

export default ObservationFormsContainer;
