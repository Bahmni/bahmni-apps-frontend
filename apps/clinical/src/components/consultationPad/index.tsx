import { ActionArea } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  dispatchAuditEvent,
  dispatchConsultationSaved,
  get,
  useTranslation,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import type { Encounter } from 'fhir/r4';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
} from 'react';
import { ERROR_TITLES } from '../../constants/errors';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import { useMedicationStore } from '../../stores/medicationsStore';
import { useObservationFormsStore } from '../../stores/observationFormsStore';
import { InputControlRenderer } from '../forms';
import ObservationFormsContainer from '../forms/observations/ObservationFormsContainer';
import { ENCOUNTER_DETAILS_INPUT_CONTROL_KEY } from './constants';
import { submitConsultation } from './services';
import styles from './styles/index.module.scss';
import {
  captureUpdatedResources,
  getActiveEntries,
  loadEncounterInputControls,
} from './utils';

interface ConsultationPadProps {
  encounterSessionStartContext: EncounterSessionStartContext;
  onClose: () => void;
}

const ConsultationPad: React.FC<ConsultationPadProps> = ({
  encounterSessionStartContext,
  onClose,
}) => {
  const encounterType = encounterSessionStartContext.encounterType;
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { clinicalConfig } = useClinicalConfig();
  const registry = useMemo(
    () => loadEncounterInputControls(clinicalConfig?.consultationPad),
    [clinicalConfig],
  );

  const {
    encounterConcepts,
    loading: loadingEncounterTypes,
    error: encounterTypesError,
  } = useEncounterConcepts();

  const isEncounterTypePropInvalid = useMemo(() => {
    if (!encounterType || loadingEncounterTypes) return false;
    return !encounterConcepts?.encounterTypes.some(
      (et) => et.name === encounterType,
    );
  }, [encounterType, encounterConcepts, loadingEncounterTypes]);

  const resolvedEncounterType = useMemo(() => {
    return (
      encounterType ??
      (clinicalConfig?.consultationPad?.inputControls?.find(
        (c) => c.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY,
      )?.metadata?.defaultEncounterType as string | undefined) ??
      null
    );
  }, [encounterType, clinicalConfig]);

  const editOnlyKey = encounterSessionStartContext.editOnly as
    | string
    | undefined;
  const editTitle = encounterSessionStartContext.editTitle as
    | string
    | undefined;

  const activeEntries = useMemo(
    () => getActiveEntries(registry, resolvedEncounterType!, editOnlyKey),
    [registry, resolvedEncounterType, editOnlyKey],
  );

  const subscribeAll = useCallback(
    (cb: () => void) => {
      const unsubscribes = activeEntries.map((entry) => entry.subscribe(cb));
      return () => unsubscribes.forEach((unsub) => unsub());
    },
    [activeEntries],
  );

  const hasConsultationData = useSyncExternalStore(subscribeAll, () =>
    activeEntries.some((entry) => entry.hasData()),
  );

  const isEncounterDetailsFormReady = useEncounterDetailsStore(
    (state) => state.isEncounterDetailsFormReady,
  );
  const isError = useEncounterDetailsStore((state) => state.isError);
  const selectedEncounterType = useEncounterDetailsStore(
    (state) => state.selectedEncounterType,
  );

  useEffect(() => {
    useEncounterDetailsStore
      .getState()
      .setRequestedEncounterType(resolvedEncounterType);
  }, [resolvedEncounterType]);

  const { practitioner } = useActivePractitioner();
  const { activeEncounter: sessionEncounter } = useEncounterSession({
    practitioner,
    encounterTypeUUID: selectedEncounterType?.uuid,
  });

  const editEncounterUuid = encounterSessionStartContext.editEncounterUuid as
    | string
    | undefined;
  const [editEncounter, setEditEncounter] = useState<Encounter | null>(null);
  const [editEncounterLoading, setEditEncounterLoading] = useState(false);
  useEffect(() => {
    if (editEncounterUuid) {
      setEditEncounterLoading(true);
      get<Encounter>(`/openmrs/ws/fhir2/R4/Encounter/${editEncounterUuid}`)
        .then(setEditEncounter)
        .catch(() => {
          setEditEncounter(null);
          addNotification({
            title: t('ERROR_DEFAULT_TITLE'),
            message: t('CONSULTATION_ERROR_GENERIC'),
            type: 'error',
            timeout: 5000,
          });
        })
        .finally(() => setEditEncounterLoading(false));
    }
  }, [editEncounterUuid, addNotification, t]);

  const activeEncounter = editEncounterUuid ? editEncounter : sessionEncounter;

  const { episodeOfCare } = useClinicalAppData();

  const episodeOfCareUuids = episodeOfCare.map((eoc) => eoc.uuid);
  const statDurationInMilliseconds =
    clinicalConfig?.consultationPad?.statDurationInMilliseconds;

  const {
    viewingForm,
    setViewingForm,
    updateFormData,
    getFormData,
    removeForm,
  } = useObservationFormsStore();

  useEffect(() => {
    return () => activeEntries.forEach((entry) => entry.reset());
  }, []);

  const handleSubmit = async () => {
    const validationResults = activeEntries.map((entry) => ({
      key: entry.key,
      valid: entry.validate(),
    }));

    const obsFormsResult = validationResults.find(
      (r) => r.key === 'observationForms',
    );
    if (obsFormsResult && !obsFormsResult.valid) {
      addNotification({
        title: t('OBSERVATION_FORMS_MANDATORY_ERROR_TITLE'),
        message: t('OBSERVATION_FORMS_MANDATORY_ERROR_MESSAGE'),
        type: 'error',
        timeout: 5000,
      });
    }

    if (!validationResults.every((r) => r.valid)) return;

    try {
      setIsSubmitting(true);
      const result = await submitConsultation({
        activeEncounter,
        episodeOfCareUuids,
        statDurationInMilliseconds,
        activeEntries,
      });

      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER
          .eventType as AuditEventType,
        patientUuid: result.patientUUID,
        messageParams: { encounterType: result.encounterTypeName },
      });

      const updatedResources = captureUpdatedResources(activeEntries);
      dispatchConsultationSaved({
        patientUUID: result.patientUUID,
        updatedResources,
        updatedConcepts: result.updatedConcepts,
      });

      addNotification({
        title: t('CONSULTATION_SUBMITTED_SUCCESS_TITLE'),
        message: t('CONSULTATION_SUBMITTED_SUCCESS_MESSAGE'),
        type: 'success',
        timeout: 5000,
      });

      activeEntries.forEach((entry) => entry.reset());
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'CONSULTATION_ERROR_GENERIC';
      addNotification({
        title: t(ERROR_TITLES.CONSULTATION_ERROR),
        message: t(errorMessage),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    activeEntries.forEach((entry) => entry.reset());
    onClose();
  };

  const hasError =
    isError || isEncounterTypePropInvalid || !!encounterTypesError;

  const renderPadContent = (() => {
    if (hasError)
      return (
        <div className={styles.error}>
          <h3>{t('CONSULTATION_PAD_ERROR_TITLE')}</h3>
          <p>{t('CONSULTATION_PAD_ERROR_BODY')}</p>
        </div>
      );
    return (
      <div className={styles.formList}>
        {activeEntries.map((entry) => (
          <InputControlRenderer
            key={entry.key}
            entry={entry}
            encounterType={resolvedEncounterType!}
            encounterSessionStartContext={encounterSessionStartContext}
          />
        ))}
      </div>
    );
  })();

  const isEditMode = !!editOnlyKey;
  const editChangesExist = useMedicationStore((state) => {
    if (!isEditMode) return true;
    const { selectedMedications: meds, originalEditSnapshots } = state;
    if (meds.some((m) => !m.fhirResourceId)) return true;
    return meds.some((m) => {
      const original = originalEditSnapshots.get(m.id);
      if (!original) return true;
      return (
        m.dosage !== original.dosage ||
        m.dosageUnit?.uuid !== original.dosageUnit?.uuid ||
        m.frequency?.uuid !== original.frequency?.uuid ||
        m.route?.uuid !== original.route?.uuid ||
        m.duration !== original.duration ||
        m.durationUnit?.code !== original.durationUnit?.code ||
        m.instruction?.uuid !== original.instruction?.uuid ||
        m.isPRN !== original.isPRN ||
        m.isSTAT !== original.isSTAT ||
        m.dispenseQuantity !== original.dispenseQuantity ||
        m.dispenseUnit?.uuid !== original.dispenseUnit?.uuid ||
        (m.note ?? '') !== (original.note ?? '') ||
        m.startDate?.toDateString() !== original.startDate?.toDateString()
      );
    });
  });
  const isPrimaryButtonDisabled =
    hasError ||
    !isEncounterDetailsFormReady ||
    isSubmitting ||
    !hasConsultationData ||
    !editChangesExist ||
    editEncounterLoading;
  return (
    <>
      <ActionArea
        data-testid="consultation-pad-action-area"
        title={
          hasError
            ? ''
            : editTitle
              ? t(editTitle)
              : t('CONSULTATION_ACTION_NEW')
        }
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleSubmit}
        isPrimaryButtonDisabled={isPrimaryButtonDisabled}
        hidden={!!viewingForm}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleCancel}
        content={renderPadContent}
      />
      {viewingForm && (
        <ObservationFormsContainer
          onViewingFormChange={setViewingForm}
          viewingForm={viewingForm}
          onRemoveForm={removeForm}
          onFormObservationsChange={updateFormData}
          existingObservations={getFormData(viewingForm.uuid)?.observations}
        />
      )}
    </>
  );
};

export default ConsultationPad;
