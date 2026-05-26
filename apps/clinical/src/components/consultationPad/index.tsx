import { ActionArea } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  type AuditEventType,
  dispatchAuditEvent,
  dispatchConsultationSaved,
  useTranslation,
  invokeCDSSRule,
  type CDSSEventDetail,
} from '@bahmni/services';
import { useActivePractitioner, useNotification } from '@bahmni/widgets';
import type { Bundle, BundleEntry } from 'fhir/r4';
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
import { useObservationFormsStore } from '../../stores/observationFormsStore';
import { InputControlRenderer } from '../forms';
import type { EncounterContext } from '../forms/models';
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

  const activeEntries = useMemo(
    () => getActiveEntries(registry, resolvedEncounterType!),
    [registry, resolvedEncounterType],
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
  const { activeEncounter } = useEncounterSession({
    practitioner,
    encounterTypeUUID: selectedEncounterType?.uuid,
  });
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

  useEffect(() => {
    const handleCDSSEvent = async (event: Event) => {
      const customEvent = event as CustomEvent<CDSSEventDetail>;
      const { controlKey, itemId, event: eventType } = customEvent.detail;

      const entry = activeEntries.find((e) => e.key === controlKey);
      if (!entry) return;

      const cdssRules =
        entry.inputControlConfig?.cdss?.filter(
          (rule) => rule.event === eventType,
        ) ?? [];
      if (cdssRules.length === 0) return;

      const dataBundle = buildComprehensiveCDSSBundle();

      // Build base context from available data
      const patientId =
        encounterSessionStartContext.patientUuid ||
        activeEncounter?.subject?.reference?.split('/')[1];

      const visitId =
        encounterSessionStartContext.visitUuid ||
        activeEncounter?.partOf?.reference?.split('/')[1];

      const episodeId =
        encounterSessionStartContext.episodeUuid ||
        (episodeOfCareUuids.length > 0 ? episodeOfCareUuids[0] : undefined);

      const context = {
        patientId: patientId as string,
        visitId: visitId as string | undefined,
        episodeId: episodeId as string | undefined,
      };
      const cardPromises = cdssRules.map((rule) =>
        invokeCDSSRule(rule, context, dataBundle).catch((error) => {
          console.error(`CDSS rule failed for ${rule.service}:`, error);
          return [];
        }),
      );

      const cardArrays = await Promise.all(cardPromises);
      const cards = cardArrays.flat();

      // Broadcast CDSS results - input controls will self-identify their cards
      const resultsEvent = new CustomEvent('cdss-results', {
        detail: {
          cards,
          triggerItemId: itemId, // Hint for which item triggered this check
          controlKey,
        },
      });
      globalThis.dispatchEvent(resultsEvent);
    };

    window.addEventListener('cdss-check', handleCDSSEvent);
    return () => window.removeEventListener('cdss-check', handleCDSSEvent);
  }, [activeEntries, buildComprehensiveCDSSBundle, encounterSessionStartContext]);

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
        {registry.map((entry) => (
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
        title={hasError ? '' : t('CONSULTATION_ACTION_NEW')}
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
