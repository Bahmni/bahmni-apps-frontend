import { ActionArea } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  dispatchAuditEvent,
  dispatchConsultationSaved,
  useTranslation,
  invokeCDSSRule,
  getConfig,
  type CDSSServerConfig,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, BundleEntry } from 'fhir/r4';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
} from 'react';
import { CDSS_SERVER_CONFIG_URL } from '../../constants/app';
import { ERROR_TITLES } from '../../constants/errors';
import {
  dispatchCDSSResults,
  useCDSSCheckListener,
  type CDSSCheckEventDetail,
} from '../../events/cdssEvents';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import { useAllergyStore } from '../../stores/allergyStore';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import { useObservationFormsStore } from '../../stores/observationFormsStore';
import { InputControlRenderer } from '../forms';
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
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const editOnlyKey = encounterSessionStartContext.editOnly;
  const editTitle = encounterSessionStartContext.editTitle;

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
  const { activeEncounter, matchReason } = useEncounterSession({
    practitioner,
    encounterTypeUUID: selectedEncounterType?.uuid,
  });

  // Only resume the existing encounter on an exact MATCHED case.
  // SESSION_EXPIRED, LOCATION_MISMATCH, PROVIDER_MISMATCH all silently create a new encounter.
  const encounterForSubmission = matchReason.includes('MATCHED')
    ? activeEncounter
    : null;

  const { episodeOfCare, patientId, activeVisitId, activeEpisodeId } =
    useClinicalAppData();

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

  const handleCDSSCheck = useCallback(
    async (detail: CDSSCheckEventDetail) => {
      const { controlKey, itemId, event: eventType } = detail;

      if (isCdssServerConfigLoading || !cdssServerConfig) {
        return;
      }

      const entry = activeEntries.find((e) => e.key === controlKey);
      if (!entry) return;

      const cdssRules =
        entry.inputControlConfig?.cdss?.filter(
          (rule) => rule.event === eventType,
        ) ?? [];
      if (cdssRules.length === 0) return;

      const dataBundle = buildComprehensiveCDSSBundle();

      const resolvedPatientId = patientId;

      const resolvedVisitId =
        activeVisitId ?? activeEncounter?.partOf?.reference?.split('/')[1];

      const resolvedEpisodeId = activeEpisodeId;

      const context = {
        patientId: resolvedPatientId as string,
        visitId: resolvedVisitId as string | undefined,
        episodeId: resolvedEpisodeId as string | undefined,
      };

      const cardPromises = cdssRules.map((rule) =>
        invokeCDSSRule(cdssServerConfig, rule, context, dataBundle).catch(
          (error) => {
            addNotification({
              title: t('ERROR_DEFAULT_TITLE'),
              message: t('CDSS_RULE_INVOCATION_ERROR', {
                controlKey,
                eventType,
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
    },
    [
      cdssServerConfig,
      isCdssServerConfigLoading,
      activeEntries,
      buildComprehensiveCDSSBundle,
      activeEncounter,
      patientId,
      activeVisitId,
      activeEpisodeId,
      addNotification,
      t,
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

  const enablePrimaryButton = useMemo(
    () =>
      hasError ||
      !isEncounterDetailsFormReady ||
      isSubmitting ||
      !hasConsultationData,
    [hasError, isEncounterDetailsFormReady, isSubmitting, hasConsultationData],
  );
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
        isPrimaryButtonDisabled={enablePrimaryButton}
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
