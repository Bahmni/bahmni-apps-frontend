import { ActionArea } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  dispatchAuditEvent,
  dispatchConsultationSaved,
  dispatchCDSSResults,
  findActiveEncounterInSession,
  getConfig,
  getEncounterByUuid,
  invokeCDSSRule,
  type CDSSCheckEventDetail,
  type CDSSServerConfig,
  useCDSSCheckListener,
  useTranslation,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, BundleEntry, MedicationRequest } from 'fhir/r4';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  useState,
} from 'react';
import { CDSS_SERVER_CONFIG_URL } from '../../constants/app';
import { ERROR_TITLES } from '../../constants/errors';
import { MEDICATIONS_INPUT_CONTROL_KEY } from '../../constants/medications';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import { useAllergyStore } from '../../stores/allergyStore';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import { useObservationFormsStore } from '../../stores/observationFormsStore';
import { InputControlRenderer } from '../forms';
import { getMedicationRequestStore } from '../forms/medicationRequest/store';
import type { EncounterContext } from '../forms/models';
import ObservationFormsContainer from '../forms/observations/ObservationFormsContainer';
import cdssConfigSchema from './cdssConfigSchema.json';
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
  const preloadedAllergies = encounterSessionStartContext.preloadedAllergies;
  const encounterType = encounterSessionStartContext.encounterType;
  const editOnlyKey = encounterSessionStartContext.editOnly as
    | string
    | undefined;
  const editTitle = encounterSessionStartContext.editTitle as
    | string
    | undefined;
  const editEncounterUuid = encounterSessionStartContext.editEncounterUuid as
    | string
    | undefined;
  const directFormMode = encounterSessionStartContext.directFormMode as
    | boolean
    | undefined;
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldLoadCDSSConfig, setShouldLoadCDSSConfig] = useState(false);
  const pendingCDSSCheckRef = useRef<CDSSCheckEventDetail | null>(null);

  const { clinicalConfig } = useClinicalConfig();
  const registry = useMemo(
    () => loadEncounterInputControls(clinicalConfig?.consultationPad),
    [clinicalConfig],
  );

  const {
    data: cdssServerConfig,
    isLoading: isCdssServerConfigLoading,
    error: cdssServerConfigError,
  } = useQuery({
    queryKey: ['cdssConfig'],
    queryFn: () =>
      getConfig<CDSSServerConfig[]>(CDSS_SERVER_CONFIG_URL, cdssConfigSchema),
    enabled: shouldLoadCDSSConfig,
  });

  useEffect(() => {
    if (cdssServerConfigError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('CDSS_CONFIG_LOAD_ERROR', {
          errorMessage: cdssServerConfigError.message,
        }),
        type: 'error',
      });
      pendingCDSSCheckRef.current = null;
    }
  }, [cdssServerConfigError, addNotification, t]);

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

  const { episodeOfCare, patientId, activeVisitId, activeEpisodeId } =
    useClinicalAppData();

  const { practitioner } = useActivePractitioner();
  const { data: sessionEncounter, status: sessionEncounterStatus } = useQuery({
    queryKey: [
      'activeEncounter',
      patientId,
      practitioner?.uuid,
      selectedEncounterType?.uuid,
    ],
    queryFn: () =>
      findActiveEncounterInSession(
        patientId!,
        practitioner?.uuid,
        undefined,
        selectedEncounterType?.uuid,
      ),
    staleTime: 0,
    enabled: Boolean(
      patientId && practitioner?.uuid && selectedEncounterType?.uuid,
    ),
  });
  const {
    data: editEncounter,
    isLoading: editEncounterLoading,
    error: editEncounterError,
  } = useQuery({
    queryKey: ['encounter', editEncounterUuid],
    queryFn: ({ signal }) => getEncounterByUuid(editEncounterUuid!, { signal }),
    enabled: Boolean(editEncounterUuid),
  });

  useEffect(() => {
    if (editEncounterError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('CONSULTATION_ERROR_GENERIC'),
        type: 'error',
        timeout: 5000,
      });
    }
  }, [editEncounterError, addNotification, t]);

  const activeEncounter = editEncounterUuid
    ? (editEncounter ?? null)
    : sessionEncounter;

  useEffect(() => {
    const periodStart = sessionEncounter?.period?.start;
    if (periodStart) {
      const date = new Date(periodStart);
      useEncounterDetailsStore
        .getState()
        .setConsultationDate(isNaN(date.getTime()) ? new Date() : date);
    } else if (
      sessionEncounterStatus === 'success' ||
      sessionEncounterStatus === 'error'
    ) {
      useEncounterDetailsStore.getState().setConsultationDate(new Date());
    }
  }, [sessionEncounter, sessionEncounterStatus]);

  const encounterForSubmission = activeEncounter;

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

  // Seed medication store with FHIR resources for edit mode
  useEffect(() => {
    const editMedications = encounterSessionStartContext.editMedications as
      | MedicationRequest[]
      | undefined;
    const medStore = getMedicationRequestStore(MEDICATIONS_INPUT_CONTROL_KEY);
    medStore
      .getState()
      .setPendingFhirEdits(editMedications?.length ? editMedications : []);
  }, [encounterSessionStartContext.editMedications]);

  useEffect(() => {
    return () => activeEntries.forEach((entry) => entry.reset());
  }, []);

  useEffect(() => {
    if (preloadedAllergies?.length) {
      useAllergyStore.getState().preloadAllergies(preloadedAllergies);
    }
  }, [preloadedAllergies]);

  const buildComprehensiveCDSSBundle = useCallback((): Bundle => {
    const entries: BundleEntry[] = [];

    activeEntries.forEach((entry) => {
      if (entry.hasData() && entry.createBundleEntries) {
        const ctx: EncounterContext = {
          encounterSubject: {
            reference: `Patient/${encounterSessionStartContext.patientUuid}`,
          },
          encounterReference: activeEncounter?.id ?? '',
          practitionerUUID: practitioner?.uuid ?? '',
          consultationDate: new Date(),
          statDurationInMilliseconds,
        };
        const controlEntries = entry.createBundleEntries(ctx);
        entries.push(...controlEntries);
      }
    });

    return {
      resourceType: 'Bundle',
      type: 'collection',
      entry: entries,
    };
  }, [
    activeEntries,
    encounterSessionStartContext,
    activeEncounter,
    practitioner,
    statDurationInMilliseconds,
  ]);

  const processCDSSCheck = useCallback(
    async (detail: CDSSCheckEventDetail) => {
      const { controlKey, itemId, rules } = detail;

      if (!cdssServerConfig) {
        return;
      }

      const dataBundle = buildComprehensiveCDSSBundle();

      const resolvedVisitId =
        activeVisitId ?? activeEncounter?.partOf?.reference?.split('/')[1];

      const context = {
        patientId: patientId!,
        visitId: resolvedVisitId,
        episodeId: activeEpisodeId ?? undefined,
      };

      const cardPromises = rules.map((rule) =>
        invokeCDSSRule(cdssServerConfig, rule, context, dataBundle).catch(
          () => {
            addNotification({
              title: t('ERROR_DEFAULT_TITLE'),
              message: t('CDSS_RULE_INVOCATION_ERROR', {
                controlKey,
                eventType: rule.event,
              }),
              type: 'error',
            });
            return [];
          },
        ),
      );

      const cardArrays = await Promise.all(cardPromises);
      const cards = cardArrays.flat();

      dispatchCDSSResults({
        cards,
        triggerItemId: itemId,
        controlKey,
      });

      pendingCDSSCheckRef.current = null;
    },
    [
      cdssServerConfig,
      buildComprehensiveCDSSBundle,
      activeEncounter,
      patientId,
      activeVisitId,
      activeEpisodeId,
      addNotification,
      t,
    ],
  );

  // Process pending CDSS check when config becomes available
  useEffect(() => {
    if (
      cdssServerConfig &&
      !isCdssServerConfigLoading &&
      pendingCDSSCheckRef.current
    ) {
      processCDSSCheck(pendingCDSSCheckRef.current);
    }
  }, [cdssServerConfig, isCdssServerConfigLoading, processCDSSCheck]);

  const handleCDSSCheck = useCallback(
    async (detail: CDSSCheckEventDetail) => {
      const { rules } = detail;

      if (!rules || rules.length === 0) return;

      // Store the pending check to trigger config loading
      pendingCDSSCheckRef.current = detail;

      // If config is already loaded and not loading, process immediately
      if (cdssServerConfig && !isCdssServerConfigLoading) {
        await processCDSSCheck(detail);
      } else if (!shouldLoadCDSSConfig) {
        // Trigger config loading
        setShouldLoadCDSSConfig(true);
      }
    },
    [
      cdssServerConfig,
      isCdssServerConfigLoading,
      processCDSSCheck,
      shouldLoadCDSSConfig,
    ],
  );

  useCDSSCheckListener(handleCDSSCheck);

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

    const hasCriticalCDSCards = activeEntries.some(
      (entry) => entry.hasCriticalCDSCards?.() === true,
    );

    if (hasCriticalCDSCards) {
      addNotification({
        title: t('CDSS_CRITICAL_ALERT_TITLE'),
        message: t('CDSS_CRITICAL_ALERT_MESSAGE'),
        type: 'error',
        timeout: 5000,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // If any active entry has a direct submit handler (e.g., $stop operation),
      // call it directly and skip the consultation bundle flow.
      const directSubmitEntries = activeEntries.filter(
        (entry) => entry.hasData() && entry.onDirectSubmit,
      );
      const bundleEntries = activeEntries.filter(
        (entry) => entry.hasData() && !entry.onDirectSubmit,
      );

      for (const entry of directSubmitEntries) {
        await entry.onDirectSubmit!();
      }

      // Skip bundle submission if all data was handled by direct submit
      if (directSubmitEntries.length > 0 && bundleEntries.length === 0) {
        const updatedResources = captureUpdatedResources(activeEntries);
        dispatchConsultationSaved({
          patientUUID: useEncounterDetailsStore.getState().patientUUID ?? '',
          updatedResources,
          updatedConcepts: new Map(),
        });

        addNotification({
          title: t('CONSULTATION_SUBMITTED_SUCCESS_TITLE'),
          message: t('CONSULTATION_SUBMITTED_SUCCESS_MESSAGE'),
          type: 'success',
          timeout: 5000,
        });

        activeEntries.forEach((entry) => entry.reset());
        onClose();
        return;
      }

      const result = await submitConsultation({
        activeEncounter: encounterForSubmission,
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
  const medStore = getMedicationRequestStore(MEDICATIONS_INPUT_CONTROL_KEY);
  const editChangesExist = useSyncExternalStore(
    (cb) => medStore.subscribe(cb),
    () => {
      if (!isEditMode || editOnlyKey !== MEDICATIONS_INPUT_CONTROL_KEY)
        return true;
      return medStore.getState().hasEditChanges();
    },
  );

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
          activeEncounterUuid={activeEncounter?.id ?? null}
          directMode={directFormMode}
          onDirectModeSubmit={directFormMode ? handleSubmit : undefined}
          onDirectModeCancel={directFormMode ? handleCancel : undefined}
          encounterSessionStartContext={encounterSessionStartContext}
        />
      )}
    </>
  );
};

export default ConsultationPad;
