import {
  ActionArea,
  Icon,
  ICON_SIZE,
  InlineNotification,
  SkeletonText,
  MenuItemDivider,
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
  type ComplexValue,
  getFormattedError,
  getFormattedPatientById,
  getUserPreferredLocale,
  mapGenderFromFhir,
  transformContainerObservationsToForm2Observations,
  convertImmutableToPlainObject,
  extractNotesFromFormData,
  formatDateForControl,
  DATETIME_REGEX_PATTERN,
  type AgeDetails,
  computeAgeDetails,
} from '@bahmni/services';
import { useActivePractitioner, usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Reference, Task } from 'fhir/r4';
import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_FORM_API_NAMES,
  VALIDATION_STATE_EMPTY,
  VALIDATION_STATE_MANDATORY,
  VALIDATION_STATE_INVALID,
  VALIDATION_STATE_SCRIPT_ERROR,
} from '../../../constants/forms';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useObservationFormData } from '../../../hooks/useObservationFormData';
import useObservationFormsSearch from '../../../hooks/useObservationFormsSearch';
import { usePinnedObservationForms } from '../../../hooks/usePinnedObservationForms';
import {
  extractVersionFromFormFieldPath,
  injectMissingDeleteObs,
  markUnchangedObservations,
  mergeObservationStatuses,
  restoreComplexValues,
} from '../../../utils/fhir/observationReconciliation';
import EncounterDetails from '../encounterDetails/EncounterDetails';
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
    basedOn?: Reference,
  ) => void;
  existingObservations?: Form2Observation[];
  activeEncounterUuid?: string | null;
  directMode?: boolean;
  onDirectModeSubmit?: () => void | Promise<void>;
  onDirectModeCancel?: () => void;
  encounterSessionStartContext?: EncounterSessionStartContext;
}

const ObservationFormsContainer: React.FC<ObservationFormsContainerProps> = ({
  onViewingFormChange,
  viewingForm,
  onRemoveForm,
  onFormObservationsChange,
  existingObservations,
  activeEncounterUuid,
  directMode = false,
  onDirectModeSubmit,
  onDirectModeCancel,
  encounterSessionStartContext,
}) => {
  const { t } = useTranslation();

  // Derive early so it can be used for hook initialisation below.
  const isEditMode =
    encounterSessionStartContext?.editOnly === 'observationForms';

  // Tracks whether the form differs from its initial values — driven by CarbonContainer's
  // own setIsFormUpdated (uuid-based comparison against the observations it was mounted with).
  const [isFormUpdated, setIsFormUpdated] = React.useState(false);

  const task = encounterSessionStartContext?.task as Task | undefined;
  const basedOn = task?.basedOn?.[0];
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

  // One-way latch onto the first render with FHIR-enriched observations (uuid + status).
  const statusSourceRef = useRef<Form2Observation[]>(
    existingObservations ?? [],
  );
  if (
    !statusSourceRef.current.some((o) => !!o.uuid) &&
    existingObservations?.some((o) => !!o.uuid)
  ) {
    statusSourceRef.current = existingObservations;
  }

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

  // Non-edit forms are always saveable; edit forms gate on CarbonContainer's setIsFormUpdated.
  const hasFormChanges = !isEditMode || isFormUpdated;

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

    // Exclude top-level duplicates of obsGroup children (form2-controls returns both).
    const childUuids = new Set<string>();
    const collectChildUuids = (obs: Form2Observation): void => {
      obs.groupMembers?.forEach((child) => {
        if (child.uuid) childUuids.add(child.uuid);
        collectChildUuids(child);
      });
    };
    existingObservations.forEach(collectChildUuids);

    // Convert Complex { url, fileName } values to plain string URLs — CarbonContainer crashes on object values.
    const convertComplex = (obs: Form2Observation): Form2Observation => {
      const converted =
        typeof obs.value === 'object' &&
        obs.value !== null &&
        'url' in obs.value
          ? { ...obs, value: (obs.value as ComplexValue).url }
          : obs;
      if (converted.groupMembers) {
        return {
          ...converted,
          groupMembers: converted.groupMembers.map(convertComplex),
        };
      }
      return converted;
    };

    const convertDateTime = (obs: Form2Observation): Form2Observation => {
      const converted =
        typeof obs.value === 'string' && DATETIME_REGEX_PATTERN.test(obs.value)
          ? { ...obs, value: formatDateForControl(new Date(obs.value)) }
          : obs;
      if (converted.groupMembers) {
        return {
          ...converted,
          groupMembers: converted.groupMembers.map(convertDateTime),
        };
      }
      return converted;
    };

    // Normalise interpretation to uppercase codes to match CarbonContainer's internal format.
    const normalizeInterpretation = (
      obs: Form2Observation,
    ): Form2Observation => {
      const updated = obs.interpretation
        ? { ...obs, interpretation: obs.interpretation.toUpperCase() }
        : obs;
      if (updated.groupMembers) {
        return {
          ...updated,
          groupMembers: updated.groupMembers.map(normalizeInterpretation),
        };
      }
      return updated;
    };

    return existingObservations
      .filter((obs) => {
        // Drop top-level duplicates of groupMember children.
        if (obs.uuid && childUuids.has(obs.uuid)) return false;
        // Drop obs that have no value and no group members (nothing to show).
        return (
          (obs.value !== null && obs.value !== undefined) ||
          (obs.groupMembers && obs.groupMembers.length > 0)
        );
      })
      .map(convertComplex)
      .map(convertDateTime)
      .map(normalizeInterpretation);
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
        basedOn,
      );
    }
    onViewingFormChange(null);
  };

  const validateAndSave = (handleDirectModeSubmit?: () => void) => {
    if (!patientContext) {
      setValidationErrorType(VALIDATION_STATE_SCRIPT_ERROR);
      setValidationErrorMessage(t('OBSERVATION_FORM_LOADING_METADATA_ERROR'));
      return;
    }

    if (formContainerRef.current) {
      if (validationErrorType && !handleDirectModeSubmit) {
        setValidationErrorType(null);
        const { observations: currentObservations } =
          formContainerRef.current.getValue();

        const transformedObservations =
          currentObservations && currentObservations.length > 0
            ? transformContainerObservationsToForm2Observations(
                currentObservations,
                formMetadata,
              )
            : [];

        mergeObservationStatuses(
          transformedObservations,
          statusSourceRef.current,
        );
        restoreComplexValues(transformedObservations, statusSourceRef.current);
        injectMissingDeleteObs(
          transformedObservations,
          statusSourceRef.current,
        );
        markUnchangedObservations(
          transformedObservations,
          statusSourceRef.current,
        );

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
              formMetadata,
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

      if (hasErrors) {
        const hasMandatoryError = errors
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

      if (isEmpty) {
        setValidationErrorType(VALIDATION_STATE_EMPTY);
        return;
      }

      setValidationErrorType(null);
      setValidationErrorMessage(null);

      try {
        mergeObservationStatuses(
          transformedObservations,
          statusSourceRef.current,
        );
        restoreComplexValues(transformedObservations, statusSourceRef.current);
        injectMissingDeleteObs(
          transformedObservations,
          statusSourceRef.current,
        );
        markUnchangedObservations(
          transformedObservations,
          statusSourceRef.current,
        );

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
        handleDirectModeSubmit?.();
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
              formMetadata,
            )
          : [];

      // Extract and append notes-only observations
      extractAndAppendNotesFromFormData(
        formContainerRef,
        transformedObservations,
      );

      mergeObservationStatuses(
        transformedObservations,
        statusSourceRef.current,
      );
      restoreComplexValues(transformedObservations, statusSourceRef.current);
      injectMissingDeleteObs(transformedObservations, statusSourceRef.current);
      markUnchangedObservations(
        transformedObservations,
        statusSourceRef.current,
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
      {directMode && (
        <>
          <EncounterDetails
            encounterSessionStartContext={encounterSessionStartContext}
          />
          <MenuItemDivider />
          {isEditMode && viewingForm && (
            <div
              className={styles.editFormSectionTitle}
              data-testid="edit-form-section-title"
            >
              <span>{viewingForm.name}</span>
            </div>
          )}
        </>
      )}

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
              // Use the version embedded in the saved observations' formFieldPath when editing.
              version:
                extractVersionFromFormFieldPath(
                  statusSourceRef.current[0]?.formFieldPath,
                ) ??
                formMetadata.version ??
                '1',
            }}
            observations={observationsWithValues}
            patient={patientContext}
            translations={formMetadata.translations ?? {}}
            validate={validationErrorType !== null}
            validateForm
            collapse={false}
            locale={getUserPreferredLocale()}
            onValueUpdated={handleFormDataChange}
            setIsFormUpdated={setIsFormUpdated}
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
      <span data-testid="observation-form-name">
        {isEditMode
          ? `${t('EDIT_OBSERVATION_FORM')} ${viewingForm?.name}`
          : viewingForm?.name}
      </span>
      {!directMode &&
        !DEFAULT_FORM_API_NAMES.includes(viewingForm?.name ?? '') && (
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
    const primaryButtonText = directMode
      ? t('CONSULTATION_PAD_DONE_BUTTON')
      : validationErrorType
        ? t('OBSERVATION_FORM_CONTINUE_ANYWAY_BUTTON')
        : t('OBSERVATION_FORM_SAVE_BUTTON');

    const secondaryButtonText = directMode
      ? t('CONSULTATION_PAD_CANCEL_BUTTON')
      : t('OBSERVATION_FORM_DISCARD_BUTTON');

    const saveWithErrorHandling = validationErrorType
      ? continueAnyway
      : validateAndSave;

    const handlePrimaryClick = directMode
      ? () => validateAndSave(onDirectModeSubmit)
      : saveWithErrorHandling;

    const handleSecondaryClick = directMode
      ? (onDirectModeCancel ?? discard)
      : discard;

    return (
      <ActionArea
        className={styles.formViewActionArea}
        title={formTitleWithPin as unknown as string}
        primaryButtonText={primaryButtonText}
        onPrimaryButtonClick={handlePrimaryClick}
        isPrimaryButtonDisabled={
          isPatientLoading || !patientContext || (isEditMode && !hasFormChanges)
        }
        secondaryButtonText={secondaryButtonText}
        onSecondaryButtonClick={handleSecondaryClick}
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
