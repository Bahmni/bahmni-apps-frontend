import {
  ActionArea,
  Icon,
  ICON_SIZE,
  InlineNotification,
  SkeletonText,
} from '@bahmni/design-system';
import {
  CarbonContainer,
  FormMetadata as Form2FormMetadata, // Aliased to disambiguate from FormMetadata type exported by @bahmni/services
} from '@bahmni/form2-controls';
import '@bahmni/form2-controls/dist/bundle.css';
import './styles/form2-controls-fixes.scss';
import {
  ObservationForm,
  Form2Observation,
  getFormattedError,
  getFormattedPatientById,
  getUserPreferredLocale,
  mapGenderFromFhir,
  transformContainerObservationsToForm2Observations,
  convertImmutableToPlainObject,
  extractNotesFromFormData,
  type AgeDetails,
  computeAgeDetails,
  hasMissingMandatoryVisibleField,
} from '@bahmni/services';
import { useActivePractitioner, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_FORM_API_NAMES,
  VALIDATION_STATE_EMPTY,
  VALIDATION_STATE_MANDATORY,
  VALIDATION_STATE_INVALID,
  VALIDATION_STATE_SCRIPT_ERROR,
} from '../../../constants/forms';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useObservationFormData } from '../../../hooks/useObservationFormData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import styles from './styles/ObservationFormsContainer.module.scss';
import { executeOnFormSaveEvent } from './utils/formEventExecutor';

const AGE_DETAILS_DEFAULT: AgeDetails = {
  year: 0,
  month: 0,
  day: 0,
  ageInDays: 0,
  ageText: '',
};

interface ObservationFormsContainerProps {
  onViewingFormChange: (viewingForm: ObservationForm | null) => void;
  viewingForm?: ObservationForm | null;
  onRemoveForm?: (formUuid: string) => void;
  onFormObservationsChange?: (
    formUuid: string,
    observations: Form2Observation[],
    validationErrorType?:
      | null
      | typeof VALIDATION_STATE_EMPTY
      | typeof VALIDATION_STATE_MANDATORY
      | typeof VALIDATION_STATE_INVALID
      | typeof VALIDATION_STATE_SCRIPT_ERROR,
  ) => void;
  existingObservations?: Form2Observation[];
  activeEncounterUuid?: string | null;
}

const ObservationFormsContainer: React.FC<ObservationFormsContainerProps> = ({
  onViewingFormChange,
  viewingForm,
  onRemoveForm,
  onFormObservationsChange,
  existingObservations,
  activeEncounterUuid,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { user } = useActivePractitioner();
  const { episodeOfCare, activeVisitId } = useClinicalAppData();

  const {
    data: fhirPatient,
    isLoading: isPatientLoading,
    error: patientError,
  } = useQuery({
    queryKey: ['patient', patientUUID],
    queryFn: () => getFormattedPatientById(patientUUID!),
    enabled: !!patientUUID,
  });

  const patientContext = useMemo(() => {
    if (!fhirPatient || !patientUUID) return null;
    const ageDetails = fhirPatient.birthDate
      ? computeAgeDetails(fhirPatient.birthDate)
      : null;
    return {
      uuid: patientUUID,
      identifier: fhirPatient.identifier ?? undefined,
      display: fhirPatient.fullName ?? undefined,
      givenName: fhirPatient.givenName ?? undefined,
      familyName: fhirPatient.familyName ?? undefined,
      age: ageDetails?.year,
      ageInDays: ageDetails?.ageInDays,
      birthdate: fhirPatient.birthDate ?? undefined,
      birthtime: fhirPatient.birthtime ?? undefined,
      gender: fhirPatient.gender
        ? mapGenderFromFhir(fhirPatient.gender)
        : undefined,
      activeVisitUuid: activeVisitId ?? undefined,
      currentEncounterUuid: activeEncounterUuid ?? undefined,
      getAgeDetails: () => ageDetails ?? AGE_DETAILS_DEFAULT,
    };
  }, [fhirPatient, patientUUID, activeVisitId, activeEncounterUuid]);
  const episodeOfCareUuids = episodeOfCare.map((eoc) => eoc.uuid);
  const { forms: allForms, isLoading: isAllFormsLoading } =
    useObservationFormsSearch('', episodeOfCareUuids);
  const { pinnedForms, updatePinnedForms } = usePinnedObservationForms(
    allForms,
    { userUuid: user?.uuid, isFormsLoading: isAllFormsLoading },
  );
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
    typeof CarbonContainer
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

  const observationsWithValues = React.useMemo(() => {
    if (!existingObservations) return [];
    return existingObservations.filter(
      (obs) =>
        (obs.value !== null && obs.value !== undefined) ||
        (obs.groupMembers && obs.groupMembers.length > 0),
    );
  }, [existingObservations]);

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
    validationErrorType:
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
        validationErrorType,
      );
    }
    onViewingFormChange(null);
  };

  const validateAndSave = () => {
    if (!patientContext) {
      setValidationErrorType(VALIDATION_STATE_SCRIPT_ERROR);
      setValidationErrorMessage(t('OBSERVATION_FORM_LOADING_METADATA_ERROR'));
      return;
    }

    if (formContainerRef.current) {
      if (validationErrorType) {
        setValidationErrorType(null);
        const { observations: currentObservations } =
          formContainerRef.current.getValue();

        const transformedObservations =
          currentObservations && currentObservations.length > 0
            ? transformContainerObservationsToForm2Observations(
                currentObservations,
              )
            : [];

        handleSaveForm(transformedObservations, validationErrorType);
        return;
      }

      // Get observations once
      const { observations: currentObservations, errors } =
        formContainerRef.current.getValue();

      // Transform once
      const transformedObservations =
        currentObservations && currentObservations.length > 0
          ? transformContainerObservationsToForm2Observations(
              currentObservations,
            )
          : [];

      // Recursively check if observation or its group members have values
      const hasValue = (obs: Form2Observation): boolean => {
        // Check if observation has a direct value
        if (obs.value !== null && obs.value !== undefined && obs.value !== '') {
          return true;
        }

        // Check if observation has group members with values (for grouped obs controls)
        if (obs.groupMembers && obs.groupMembers.length > 0) {
          return obs.groupMembers.some(hasValue);
        }

        return false;
      };

      const hasAnyValue = transformedObservations.some(hasValue);
      const isEmpty = !hasAnyValue; // Empty if no values (including empty strings), even if there are notes
      const hasErrors = errors && errors.length > 0;

      if (isEmpty) {
        setValidationErrorType(VALIDATION_STATE_EMPTY);
        return;
      }

      // form2-controls does not propagate mandatory errors to getValue().errors for
      // fields that were never interacted with — including always-visible mandatory
      // fields and fields revealed via isHidden scripting. Check the Container data
      // directly to catch these violations.
      const containerStateData = (
        formContainerRef.current as {
          state?: { data?: Record<string, unknown> | { toJS?: () => unknown } };
        } | null
      )?.state?.data;
      const hasMissingMandatory = hasMissingMandatoryVisibleField(
        convertImmutableToPlainObject(containerStateData) as
          | Record<string, unknown>
          | undefined,
      );

      if (hasErrors || hasMissingMandatory) {
        const hasMandatoryError =
          hasMissingMandatory ||
          errors
            .flat()
            .some(
              (err: { get?: (key: string) => string; message?: string }) =>
                (err.get?.('message') ?? err.message) ===
                VALIDATION_STATE_MANDATORY,
            );
        const errorType = hasMandatoryError
          ? VALIDATION_STATE_MANDATORY
          : VALIDATION_STATE_INVALID;
        setValidationErrorType(errorType);
        return;
      }

      setValidationErrorType(null);
      setValidationErrorMessage(null);

      try {
        // Extract and append notes-only observations to the existing array
        extractAndAppendNotesFromFormData(
          formContainerRef,
          transformedObservations,
        );

        // Get form data for executeOnFormSaveEvent
        const containerState = (
          formContainerRef.current as {
            state?: {
              data?: Record<string, unknown> | { toJS?: () => unknown };
            };
          } | null
        )?.state;

        const processedObservations = executeOnFormSaveEvent(
          formMetadata!,
          transformedObservations,
          patientContext,
          containerState?.data,
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
      // Get observations once
      const { observations: currentObservations } =
        formContainerRef.current.getValue();

      // Transform once
      const transformedObservations =
        currentObservations && currentObservations.length > 0
          ? transformContainerObservationsToForm2Observations(
              currentObservations,
            )
          : [];

      // Extract and append notes-only observations
      extractAndAppendNotesFromFormData(
        formContainerRef,
        transformedObservations,
      );

      handleSaveForm(transformedObservations, validationErrorType);
    }
  };

  const discard = () => {
    setValidationErrorType(null);
    resetForm();
    handleDiscardForm();
  };

  const error =
    metadataError || patientError
      ? new Error(
          metadataError
            ? (getFormattedError(metadataError).message ??
              t('ERROR_FETCHING_FORM_METADATA'))
            : (getFormattedError(patientError!).message ??
              t('ERROR_FETCHING_PATIENT_DATA')),
        )
      : null;

  const formViewContent = (
    <div className={styles.formView} data-testid="observation-form-view">
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

      <div
        className={styles.formContent}
        data-testid="observation-form-content"
      >
        {isLoadingMetadata || isPatientLoading ? (
          <SkeletonText
            width="100%"
            lineCount={3}
            data-testid="observation-form-loading"
          />
        ) : error ? (
          <div>{error.message}</div>
        ) : formMetadata && patientUUID && patientContext ? (
          <CarbonContainer
            ref={formContainerRef}
            metadata={{
              ...(formMetadata.schema as Form2FormMetadata),
              name: viewingForm?.name,
              version: formMetadata.version || '1',
            }}
            observations={observationsWithValues}
            patient={patientContext}
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
    <div
      className={styles.formTitleContainer}
      data-testid="observation-form-title-container"
    >
      <span data-testid="observation-form-name">{viewingForm?.name}</span>
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
        isPrimaryButtonDisabled={isPatientLoading || !patientContext}
        secondaryButtonText={t('OBSERVATION_FORM_DISCARD_BUTTON')}
        onSecondaryButtonClick={discard}
        content={formViewContent}
      />
    );
  }

  return null;
};

const extractAndAppendNotesFromFormData = (
  formContainerRef: React.RefObject<React.ComponentRef<
    typeof CarbonContainer
  > | null>,
  transformedObservations: Form2Observation[],
): void => {
  if (!formContainerRef.current) return;

  // Extract notes from raw form data for fields without values
  const containerState = (
    formContainerRef.current as {
      state?: { data?: Record<string, unknown> | { toJS?: () => unknown } };
    } | null
  )?.state;

  const formData = convertImmutableToPlainObject(containerState?.data);

  // Extract notes-only observations and append to the array using service function
  extractNotesFromFormData(formData, transformedObservations);
};

export default ObservationFormsContainer;
