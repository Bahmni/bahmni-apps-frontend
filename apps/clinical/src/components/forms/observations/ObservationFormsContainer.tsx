import {
  ActionArea,
  Icon,
  ICON_SIZE,
  InlineNotification,
  SkeletonText,
} from '@bahmni/design-system';
import {
  Container as Form2Container,
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
  VALIDATION_STATE_SCRIPT_ERROR,
} from '../../../constants/forms';
import { useObservationFormData } from '../../../hooks/useObservationFormData';
import styles from './styles/ObservationFormsContainer.module.scss';
import { executeOnFormSaveEvent } from './utils/formEventExecutor';

interface ObservationFormsContainerProps {
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  viewingForm?: ObservationForm | null;
  onRemoveForm?: (formUuid: string) => void;
  pinnedForms: ObservationForm[];
  updatePinnedForms: (newPinnedForms: ObservationForm[]) => Promise<void>;
  onFormObservationsChange?: (
    formUuid: string,
    observations: Form2Observation[],
    validationState?:
      | null
      | typeof VALIDATION_STATE_EMPTY
      | typeof VALIDATION_STATE_MANDATORY
      | typeof VALIDATION_STATE_INVALID
      | typeof VALIDATION_STATE_SCRIPT_ERROR,
  ) => void;
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
    | typeof VALIDATION_STATE_SCRIPT_ERROR
  >(null);
  const [validationErrorMessage, setValidationErrorMessage] = useState<
    string | null
  >(null);
  const formContainerRef = useRef<React.ComponentRef<
    typeof Form2Container
  > | null>(null);

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

  const handleFormDataChange = React.useCallback(
    (data: unknown) => {
      if (validationErrorType) {
        setValidationErrorType(null);
      }
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

  const isCurrentFormPinned = viewingForm
    ? pinnedForms.some((form) => form.uuid === viewingForm.uuid)
    : false;

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

  const handleDiscardForm = () => {
    setValidationErrorType(null);
    if (viewingForm && onRemoveForm) {
      onRemoveForm(viewingForm.uuid);
    }
    onViewingFormChange(null);
  };

  const handleSaveForm = (
    observationsToSave: Form2Observation[],
    validationState:
      | null
      | typeof VALIDATION_STATE_EMPTY
      | typeof VALIDATION_STATE_MANDATORY
      | typeof VALIDATION_STATE_INVALID
      | typeof VALIDATION_STATE_SCRIPT_ERROR = null,
  ) => {
    if (viewingForm && onFormObservationsChange) {
      onFormObservationsChange(
        viewingForm.uuid,
        observationsToSave,
        validationState,
        validationErrorType,
      );
    }
    onViewingFormChange(null);
  };

  const validateAndSave = () => {
    if (formContainerRef.current) {
      if (validationErrorType) {
        setValidationErrorType(null);
        const { observations: currentObservations } =
          formContainerRef.current.getValue();
        handleSaveForm(
          currentObservations as Form2Observation[],
          validationErrorType,
        );
        return;
      }

      const { observations: currentObservations, errors } =
        formContainerRef.current.getValue();

      const isEmpty = !currentObservations || currentObservations.length === 0;
      const hasErrors = errors && errors.length > 0;

      if (isEmpty) {
        setValidationErrorType(VALIDATION_STATE_EMPTY);
        return;
      }

      if (hasErrors) {
        const hasMandatoryError = errors
          .flat()
          .some(
            (err: { get?: (key: string) => string; message?: string }) =>
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

      setValidationErrorType(null);
      setValidationErrorMessage(null);

      try {
        const hasValidData = (obs: (typeof currentObservations)[number]) =>
          obs.value !== undefined ||
          (obs.groupMembers && obs.groupMembers.length > 0);

        const validCurrentObservations =
          currentObservations?.filter(hasValidData);

        const observationsToValidate: Form2Observation[] =
          validCurrentObservations && validCurrentObservations.length > 0
            ? (validCurrentObservations as Form2Observation[])
            : observations;

        const containerState = (
          formContainerRef.current as {
            state?: { data?: Record<string, unknown> };
          } | null
        )?.state;
        const formData = containerState?.data as
          | Record<string, unknown>
          | undefined;

        const processedObservations = executeOnFormSaveEvent(
          formMetadata!,
          observationsToValidate,
          patientUUID!,
          formData,
        );

        handleSaveForm(processedObservations, null);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : t('OBSERVATION_FORM_SCRIPT_ERROR_MESSAGE');
        setValidationErrorType(VALIDATION_STATE_SCRIPT_ERROR);
        setValidationErrorMessage(errorMessage);
      }
    }
  };

  const continueAnyway = () => {
    setValidationErrorType(null);
    if (formContainerRef.current) {
      const { observations: currentObservations } =
        formContainerRef.current.getValue();
      handleSaveForm(
        currentObservations as Form2Observation[],
        validationErrorType,
      );
    }
  };

  const discard = () => {
    setValidationErrorType(null);
    resetForm();
    handleDiscardForm();
  };

  const error = metadataError
    ? new Error(
        getFormattedError(metadataError).message ??
          t('ERROR_FETCHING_FORM_METADATA'),
      )
    : null;

  const formViewContent = (
    <div className={styles.formView}>
      {validationErrorType &&
        validationErrorType !== VALIDATION_STATE_SCRIPT_ERROR && (
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

      {validationErrorType === VALIDATION_STATE_SCRIPT_ERROR &&
        validationErrorMessage && (
          <div className={styles.errorNotificationWrapper}>
            <InlineNotification
              kind="error"
              title={t('OBSERVATION_FORM_SCRIPT_ERROR_TITLE')}
              subtitle={validationErrorMessage}
              lowContrast
              hideCloseButton={false}
              onClose={() => {
                setValidationErrorType(null);
                setValidationErrorMessage(null);
              }}
            />
          </div>
        )}

      <div className={styles.formContent}>
        {isLoadingMetadata ? (
          <SkeletonText width="100%" lineCount={3} />
        ) : error ? (
          <div>{error.message}</div>
        ) : formMetadata && patientUUID ? (
          <Form2Container
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

  return null;
};

export default ObservationFormsContainer;
