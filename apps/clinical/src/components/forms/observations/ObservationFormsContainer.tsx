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
  hasMissingMandatoryVisibleField,
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
  // synchronous fires are skipped. setTimeout(0) flips the flag after React's
  // commit phase is fully done.
  const initSettledRef = React.useRef(!isEditMode);

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
    // Baseline not yet captured (init still settling) or no user changes yet.
    if (baselineObservations.length === 0 || observations.length === 0)
      return false;
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
        setTimeout(() => {
          initSettledRef.current = true;
          if (formContainerRef.current) {
            const { observations: initObs } =
              formContainerRef.current.getValue();
            if (initObs && initObs.length > 0) {
              setBaselineObservations(
                transformContainerObservationsToForm2Observations(initObs),
              );
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
    return existingObservations
      .filter(
        (obs) =>
          (obs.value !== null && obs.value !== undefined) ||
          (obs.groupMembers && obs.groupMembers.length > 0),
      )
      .map((obs) => {
        // CarbonContainer's Immutable.js records call value.indexOf('voided')
        // internally. Complex observations fetched from FHIR have { url, fileName }
        // OBJECT values — convert to plain string URL so CarbonContainer doesn't
        // crash. The OBJECT is restored at save time via restoreComplexValues().
        if (
          typeof obs.value === 'object' &&
          obs.value !== null &&
          'url' in obs.value
        ) {
          return { ...obs, value: (obs.value as ComplexValue).url };
        }
        return obs;
      });
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
        restoreComplexValues(transformedObservations, statusSourceRef.current);
        injectMissingDeleteObs(
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

      if (isEmpty && !hasMissingMandatory) {
        setValidationErrorType(VALIDATION_STATE_EMPTY);
        return;
      }

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
        mergeObservationStatuses(
          transformedObservations,
          statusSourceRef.current,
        );
        restoreComplexValues(transformedObservations, statusSourceRef.current);
        injectMissingDeleteObs(
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
      restoreComplexValues(transformedObservations, statusSourceRef.current);
      injectMissingDeleteObs(transformedObservations, statusSourceRef.current);

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
      <span data-testid="observation-form-name">
        {isEditMode
          ? `${t('EDIT_OBSERVATION_FORM_LABEL')} ${viewingForm?.name}`
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

/**
 * When an addMore file-upload item is deleted, form2-controls removes it from
 * the list entirely instead of keeping it as voided. CarbonContainer.getValue()
 * no longer returns it, so the uuid is lost and no DELETE entry is generated.
 *
 * This function diffs `transformed` (what CarbonContainer returned) against
 * `original` (the FHIR-fetched observations in statusSourceRef). Any uuid
 * present in original but absent from transformed is injected as a synthetic
 * voided entry so createObservationEntriesWithVerbs emits a DELETE.
 */
const injectMissingDeleteObs = (
  transformed: Form2Observation[],
  original: Form2Observation[],
): void => {
  const presentUuids = new Set<string>();
  const collectUuids = (obs: Form2Observation) => {
    if (obs.uuid) presentUuids.add(obs.uuid);
    obs.groupMembers?.forEach(collectUuids);
  };
  transformed.forEach(collectUuids);

  const injectInto = (
    originalList: Form2Observation[],
    targetList: Form2Observation[],
  ) => {
    for (const orig of originalList) {
      if (orig.uuid && !presentUuids.has(orig.uuid)) {
        // Obs existed in original but is gone from CarbonContainer output → DELETE
        targetList.push({
          ...orig,
          voided: true,
          value: null,
          groupMembers: undefined,
        });
      }
      if (orig.groupMembers?.length) {
        const matchingGroup = targetList.find((o) => o.uuid === orig.uuid);
        if (matchingGroup) {
          matchingGroup.groupMembers = matchingGroup.groupMembers ?? [];
          injectInto(orig.groupMembers, matchingGroup.groupMembers);
        }
      }
    }
  };

  injectInto(original, transformed);
};

/**
 * CarbonContainer receives Complex observation values as plain string URLs
 * (OBJECT values are stripped in observationsWithValues to avoid the
 * value.indexOf crash). This function restores the original ComplexValue
 * OBJECT (which carries fileName) from the frozen statusSource so that
 * createObservationResource can persist valueAttachment.title to the DB.
 *
 * For newly uploaded files (not in source), the value remains a string and
 * FhirObservationTransformer's FileNameCache handles the title on save.
 */
const restoreComplexValues = (
  transformed: Form2Observation[],
  source: Form2Observation[],
): void => {
  // Build url → ComplexValue map from source observations
  const urlToComplex = new Map<string, ComplexValue>();
  const buildMap = (obs: Form2Observation) => {
    if (
      typeof obs.value === 'object' &&
      obs.value !== null &&
      'url' in obs.value
    ) {
      urlToComplex.set(
        (obs.value as ComplexValue).url,
        obs.value as ComplexValue,
      );
    }
    obs.groupMembers?.forEach(buildMap);
  };
  source.forEach(buildMap);

  const restore = (obs: Form2Observation) => {
    if (typeof obs.value === 'string' && urlToComplex.has(obs.value)) {
      obs.value = urlToComplex.get(obs.value)!;
    }
    obs.groupMembers?.forEach(restore);
  };
  transformed.forEach(restore);
};

/**
 * CarbonContainer does not pass the `status` field through getValue().
 * This function copies the FHIR status from pre-loaded existingObservations
 * into the transformed observations (matched by uuid) so that PUT requests
 * in the bundle echo back the same status OpenMRS currently has stored.
 * Without it, sending no status causes a null error; sending a different
 * status causes "Editing the fields [status] on Obs is not allowed".
 */
const mergeObservationStatuses = (
  transformed: Form2Observation[],
  existing: Form2Observation[],
): void => {
  for (const obs of transformed) {
    if (!obs.uuid) continue;
    const match = existing.find((e) => e.uuid === obs.uuid);
    if (match?.status) {
      obs.status = match.status;
    }
    if (obs.groupMembers && match?.groupMembers) {
      mergeObservationStatuses(obs.groupMembers, match.groupMembers);
    }
  }
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

/**
 * Value-level comparison used by detectFormChanges.
 * Handles coded ({uuid}) vs coded, Complex ({url}) vs string, and primitives.
 */
const obsValuesEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;

  // Date normalization: baseline stores Date objects (from CarbonContainer's
  // getValue()), while observations stores ISO strings (from transformControlValue).
  // Extract the YYYY-MM-DD prefix for a timezone-safe comparison.
  const toDateStr = (v: unknown): string | null => {
    if (v instanceof Date && !isNaN((v as Date).getTime()))
      return (v as Date).toISOString().slice(0, 10);
    if (typeof v === 'string') {
      const m = (v as string).match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
    return null;
  };
  const aDate = toDateStr(a);
  const bDate = toDateStr(b);
  if (aDate !== null && bDate !== null) return aDate === bDate;

  const aObj = typeof a === 'object' ? (a as Record<string, unknown>) : null;
  const bObj = typeof b === 'object' ? (b as Record<string, unknown>) : null;

  // Coded values: compare by uuid only (ignore display/name differences)
  if (aObj && 'uuid' in aObj && bObj && 'uuid' in bObj) {
    return aObj.uuid === bObj.uuid;
  }
  // Complex: string URL vs {url} object
  if (typeof a === 'string' && bObj && 'url' in bObj) return a === bObj.url;
  if (typeof b === 'string' && aObj && 'url' in aObj) return b === aObj.url;

  return String(a) === String(b);
};

/**
 * Compares current form observations (from useObservationFormData, keyed by
 * formFieldPath) against the FHIR-loaded originals.  Returns true when any
 * field was added, removed, or changed — and false when every value matches,
 * so the Done button correctly re-disables when the user restores originals.
 */
const detectFormChanges = (
  current: Form2Observation[],
  original: Form2Observation[],
): boolean => {
  const collect = (
    list: Form2Observation[],
    map: Map<string, unknown>,
  ): void => {
    for (const obs of list) {
      if (obs.formFieldPath && obs.value !== null && obs.value !== undefined) {
        map.set(obs.formFieldPath, obs.value);
      }
      if (obs.groupMembers) collect(obs.groupMembers, map);
    }
  };

  const currentVals = new Map<string, unknown>();
  collect(current, currentVals);
  const originalVals = new Map<string, unknown>();
  collect(original, originalVals);

  // New fields
  for (const path of currentVals.keys()) {
    if (!originalVals.has(path)) return true;
  }
  // Removed fields
  for (const path of originalVals.keys()) {
    if (!currentVals.has(path)) return true;
  }
  // Changed values
  for (const [path, val] of currentVals) {
    if (!obsValuesEqual(val, originalVals.get(path))) return true;
  }
  return false;
};

export default ObservationFormsContainer;
