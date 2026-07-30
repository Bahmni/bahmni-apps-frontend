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
  detectFormChanges,
  extractVersionFromFormFieldPath,
  injectMissingDeleteObs,
  markUnchangedObservations,
  mergeObservationStatuses,
  replaceInterpretationRemovedObs,
  replaceNoteRemovedObs,
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

  // Init-settle guard: CarbonContainer fires onValueUpdated on mount; all
  // synchronous fires are skipped. The timer is cancelled and rescheduled on
  // every init fire so the baseline is always captured AFTER the last init
  // fire settles — even if CarbonContainer fires slightly asynchronously.
  const initSettledRef = React.useRef(!isEditMode);
  const initSettleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Baseline captured from CarbonContainer's getValue() after init settles.
  // Using CarbonContainer's own state (not FHIR data) as the baseline ensures
  // any schema-driven defaults inside layout sections are included, so comparing
  // against this baseline correctly detects only genuine user changes.
  const [baselineObservations, setBaselineObservations] = React.useState<
    Form2Observation[]
  >([]);

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

  // Latch onto the first render that has FHIR-enriched observations (uuid + status).
  // handleFormDataChange overwrites the store on every keystroke with status-less
  // observations, making existingObservations stale by save time.
  // This ref freezes the enriched snapshot so mergeObservationStatuses always has
  // the correct current status ("final" or "amended") to echo back in PUT requests.
  //
  // The inline update below intentionally runs during render (not in an effect)
  // so the ref is updated synchronously on the very first render that carries
  // uuid-bearing observations — before any child renders or effects run.
  // It is a one-way latch: once the ref holds uuids it is never overwritten again.
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

  // Snapshot-based change detection (mirrors medication edit's hasEditChanges).
  // Uses CarbonContainer's own getValue() state (captured after init settles)
  // as the baseline — this includes schema-driven defaults inside layout sections,
  // so the comparison correctly detects only genuine user changes.
  const hasFormChanges = React.useMemo(() => {
    if (!isEditMode) return true; // non-edit forms are always saveable
    if (!initSettledRef.current) return false;
    if (observations.length === 0) return false;

    // Baseline not yet captured (init still settling) — wait for capture.
    if (baselineObservations.length > 0 && observations.length === 0)
      return false;
    // Compare current against baseline to detect changes.
    return detectFormChanges(observations, baselineObservations);
  }, [isEditMode, observations, baselineObservations]);

  const handleFormDataChange = React.useCallback(
    (data: unknown) => {
      if (validationErrorType) {
        setValidationErrorType(null);
      }
      // Skip all CarbonContainer fires until init has settled. setTimeout(0)
      // runs after React's synchronous commit phase (including Strict Mode
      // double-mount), so every init fire — no matter how many — is skipped.
      // After settling, capture CarbonContainer's current state as the baseline
      // so that any schema-driven defaults are included in the comparison.
      if (!initSettledRef.current) {
        // Cancel any pending settle — reschedule so the baseline is captured
        // AFTER the last init fire (handles delayed async fires from
        // CarbonContainer that might arrive after the initial setTimeout(0)).
        if (initSettleTimerRef.current !== null) {
          clearTimeout(initSettleTimerRef.current);
        }
        initSettleTimerRef.current = setTimeout(() => {
          initSettleTimerRef.current = null;
          initSettledRef.current = true;
          if (formContainerRef.current) {
            const { observations: initObs } =
              formContainerRef.current.getValue();
            if (initObs && initObs.length > 0) {
              const baseline =
                transformContainerObservationsToForm2Observations(initObs);
              setBaselineObservations(baseline);
            }
          }
        }, 0);
        return;
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

    // getObservationsFromFhir (form2-controls) may return children both as
    // top-level entries AND inside a parent obsGroup's groupMembers.  Passing
    // the duplicate to CarbonContainer causes two problems:
    //   1. React "duplicate key" warnings (CarbonContainer uses uuid as key).
    //   2. getValue() returns the child twice → baseline gets 2 fingerprints
    //      for that formFieldPath → detectFormChanges always reports "changed".
    //
    // Fix: collect every uuid that appears inside any obs's groupMembers, then
    // exclude top-level obs whose uuid is in that set.  The child will still
    // pre-populate via the parent's groupMembers property.
    const childUuids = new Set<string>();
    const collectChildUuids = (obs: Form2Observation): void => {
      obs.groupMembers?.forEach((child) => {
        if (child.uuid) childUuids.add(child.uuid);
        collectChildUuids(child);
      });
    };
    existingObservations.forEach(collectChildUuids);

    // Recursively convert Complex { url, fileName } values to plain string URLs.
    // CarbonContainer's Immutable.js records call value.indexOf('voided'), so
    // object values crash the render.  This must also apply to values nested
    // inside groupMembers — without it, getValue() returns the child Complex as
    // an object whose fingerprint ("url:http://...") never matches the string
    // fingerprint ("http://...") produced by extractControls, keeping Done enabled
    // even when the user has made no net change.
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

    // getObservationsFromFhir (form2-controls) returns interpretation as display
    // strings ("Abnormal", "Normal") via CODE_TO_INTERPRETATION. CarbonContainer
    // internally uses uppercase codes ("ABNORMAL", "NORMAL") for comparison and
    // the abnormal SelectableTag's `selected` state. Normalise to uppercase so
    // the interpretation is pre-loaded correctly on edit.
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
              )
            : [];

        mergeObservationStatuses(
          transformedObservations,
          statusSourceRef.current,
        );
        replaceNoteRemovedObs(transformedObservations, statusSourceRef.current);
        replaceInterpretationRemovedObs(
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
        replaceNoteRemovedObs(transformedObservations, statusSourceRef.current);
        replaceInterpretationRemovedObs(
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
      replaceNoteRemovedObs(transformedObservations, statusSourceRef.current);
      replaceInterpretationRemovedObs(
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
          <EncounterDetails />
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
              // When editing an existing encounter, use the version embedded in
              // the saved observations' formFieldPath (e.g. "Vitals.1/14-0" → "1").
              // This ensures pre-population works for encounters saved before the
              // FORM_METADATA_URL was updated to return the OpenMRS record version.
              // For new encounters (no existing obs), use the OpenMRS record version
              // so future formFieldPaths encode the correct version for lookup.
              //
              // Read from statusSourceRef (the frozen first FHIR-enriched snapshot),
              // NOT observationsWithValues[0] — the latter is rebuilt from the store
              // on every keystroke, so its [0] element (and hence the extracted
              // version) can change mid-edit. A version change here re-triggers
              // form2-controls' Container.componentDidUpdate tree rebuild against
              // observations that no longer line up with the schema, blanking fields.
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
