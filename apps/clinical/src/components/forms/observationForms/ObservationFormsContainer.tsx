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
  fetchFormMetadata,
  FormMetadata,
  ObservationForm,
  getFormattedError,
  getUserPreferredLocale,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
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
  viewingForm,
  onRemoveForm,
  pinnedForms,
  updatePinnedForms,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();

  const formContainerRef = useRef<Container>(null);
  const [showValidationError, setShowValidationError] = useState(false);

  // Fetch form metadata using TanStack Query
  const {
    data: formMetadata,
    isLoading: isLoadingMetadata,
    error: queryError,
  } = useQuery<FormMetadata>({
    queryKey: ['formMetadata', viewingForm?.uuid],
    queryFn: () => fetchFormMetadata(viewingForm!.uuid),
    enabled: !!viewingForm?.uuid,
  });

  // Format error for display
  const error = queryError
    ? new Error(
        getFormattedError(queryError).message ??
          t('ERROR_FETCHING_FORM_METADATA'),
      )
    : null;
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
    setShowValidationError(false);
    // Remove the form from selected forms list if callback is provided
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    // Close the form view
    onViewingFormChange(null);
  };

  const handleSaveForm = () => {
    if (formContainerRef.current) {
      const { errors } = formContainerRef.current.getValue();
      if (errors && errors.length > 0) {
        setShowValidationError(true);
        return;
      }

      setShowValidationError(false);

      // TODO: Implement actual save logic with observations
      onViewingFormChange(null);
    }
  };

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
            metadata={formMetadata.schema as Form2FormMetadata}
            observations={[]}
            patient={{ uuid: patientUUID }}
            translations={{}}
            validate={showValidationError}
            validateForm
            collapse={false}
            locale={getUserPreferredLocale()}
            onValueUpdated={() => {}}
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
        onPrimaryButtonClick={handleSaveForm}
        isPrimaryButtonDisabled={false}
        secondaryButtonText={t('OBSERVATION_FORM_DISCARD_BUTTON')}
        onSecondaryButtonClick={handleDiscardForm}
        tertiaryButtonText={t('OBSERVATION_FORM_BACK_BUTTON')}
        onTertiaryButtonClick={() => {
          setShowValidationError(false);
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
