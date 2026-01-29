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
import {
  DEFAULT_FORM_API_NAMES,
  VALIDATION_STATE_EMPTY,
  VALIDATION_STATE_MANDATORY,
  VALIDATION_STATE_INVALID,
} from '../../../constants/forms';
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
    validationState?:
      | null
      | typeof VALIDATION_STATE_EMPTY
      | typeof VALIDATION_STATE_MANDATORY
      | typeof VALIDATION_STATE_INVALID,
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
  const [validationErrorType, setValidationErrorType] = useState<
    | null
    | typeof VALIDATION_STATE_EMPTY
    | typeof VALIDATION_STATE_MANDATORY
    | typeof VALIDATION_STATE_INVALID
  >(null);
  const formContainerRef = useRef<Container>(null);

  const {
    observations,
    handleFormDataChange: baseHandleFormDataChange,
    resetForm,
    formMetadata,
    isLoadingMetadata,
    metadataError,
  } = useObservationFormData(
    viewingForm?.uuid ? { formUuid: viewingForm.uuid } : undefined,
  );

  // Wrap handleFormDataChange to clear validation error when user starts editing
  const handleFormDataChange = React.useCallback(
    (data: unknown) => {
      // Clear validation error type when user makes changes
      if (validationErrorType) {
        setValidationErrorType(null);
      }
      // Clear stored validation state in the store
      if (viewingForm && onFormObservationsChange) {
        onFormObservationsChange(viewingForm.uuid, observations, null);
      }
      baseHandleFormDataChange(data);
    },
    [
      baseHandleFormDataChange,
      validationErrorType,
      viewingForm,
      onFormObservationsChange,
      observations,
    ],
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
    setValidationErrorType(null);
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    onViewingFormChange(null);
  };

  // Handle form save - lift observations to parent and exit view mode
  const handleSaveForm = () => {
    if (viewingForm && onFormObservationsChange) {
      // Get current observations from form container if available
      // This ensures we save the latest values, not stale state
      let observationsToSave = observations;
      if (formContainerRef.current) {
        const { observations: currentObservations } =
          formContainerRef.current.getValue();
        if (currentObservations && currentObservations.length > 0) {
          observationsToSave = currentObservations as Form2Observation[];
        }
      }

      onFormObservationsChange(
        viewingForm.uuid,
        observationsToSave,
        validationErrorType,
      );
    }
    onViewingFormChange(null);
  };

  // Validate form and save if no errors
  const validateAndSave = () => {
    if (formContainerRef.current) {
      // If validationErrorType is already set, user clicked "Continue Anyway"
      // Skip validation and save directly
      if (validationErrorType) {
        setValidationErrorType(null);
        handleSaveForm();
        return;
      }

      const { observations: currentObservations, errors } =
        formContainerRef.current.getValue();

      const isEmpty = !currentObservations || currentObservations.length === 0;
      const hasErrors = errors && errors.length > 0;

      // Check for empty form
      if (isEmpty) {
        setValidationErrorType(VALIDATION_STATE_EMPTY);
        return;
      }

      // Check for validation errors
      if (hasErrors) {
        const hasMandatoryError = errors
          .flat()
          .some(
            (err) =>
              (err.get?.('message') ?? err.message) ===
              VALIDATION_STATE_MANDATORY,
          );
        setValidationErrorType(
          hasMandatoryError
            ? VALIDATION_STATE_MANDATORY
            : VALIDATION_STATE_INVALID,
        );
        return;
      }

      // If we reach here, validation passed
      setValidationErrorType(null);

      const observationsToSave: Form2Observation[] =
        currentObservations && currentObservations.length > 0
          ? (currentObservations as Form2Observation[])
          : observations;

      // Save with observations from Container
      if (viewingForm && onFormObservationsChange) {
        onFormObservationsChange(viewingForm.uuid, observationsToSave);
      }
      onViewingFormChange(null);
    }
  };

  // Continue anyway - save form even with validation errors
  const continueAnyway = () => {
    setValidationErrorType(null);
    handleSaveForm();
  };

  // Discard form and clear validation errors
  const discard = () => {
    setValidationErrorType(null);
    resetForm();
    handleDiscardForm();
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
      {validationErrorType && (
        <div className={styles.errorNotificationWrapper}>
          <InlineNotification
            kind="error"
            title={t(
              `OBSERVATION_FORM_VALIDATION_ERROR_TITLE_${validationErrorType.toUpperCase()}`,
            )}
            subtitle={t(
              `OBSERVATION_FORM_VALIDATION_ERROR_SUBTITLE_${validationErrorType.toUpperCase()}`,
            )}
            lowContrast
            hideCloseButton={false}
            onClose={() => setValidationErrorType(null)}
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
            validate={validationErrorType !== null}
            validateForm
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
        primaryButtonText={
          validationErrorType
            ? t('OBSERVATION_FORM_CONTINUE_ANYWAY_BUTTON')
            : t('OBSERVATION_FORM_SAVE_BUTTON')
        }
        onPrimaryButtonClick={
          validationErrorType ? continueAnyway : validateAndSave
        }
        isPrimaryButtonDisabled={false}
        secondaryButtonText={t('OBSERVATION_FORM_DISCARD_BUTTON')}
        onSecondaryButtonClick={discard}
        content={formViewContent}
      />
    );
  }

  // If no form is being viewed, render nothing
  return null;
};

export default ObservationFormsContainer;
