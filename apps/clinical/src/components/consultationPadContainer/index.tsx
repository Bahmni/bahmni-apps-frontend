import { ActionArea, InlineNotification, Loading } from '@bahmni/design-system';
import {
  MODULE_LABELS,
  createVisitWithFhirR4,
  dispatchAuditEvent,
  getActiveVisitAtLoginLocation,
  getVisitLocationUUID,
  getUserLoginLocation,
  useTranslation,
} from '@bahmni/services';
import {
  CONSULTATION_PAD_PRIVILEGES,
  useHasPrivilege,
  useNotification,
  usePatientUUID,
} from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { EncounterSessionStartContext } from '../../events/startConsultation';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import { InputControl } from '../../providers/clinicalConfig/models';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import ConsultationPad from '../consultationPad';
import { ENCOUNTER_DETAILS_INPUT_CONTROL_KEY } from '../consultationPad/constants';
import EncounterDetails from '../forms/encounterDetails/EncounterDetails';
import styles from './styles/ConsultationPadContainer.module.scss';

interface ConsultationPadContainerProps {
  encounterSessionStartContext: EncounterSessionStartContext;
  onClose: () => void;
  isActionAreaExpanded?: boolean;
  onToggleActionAreaExpand?: () => void;
}

const ConsultationPadContainer: React.FC<ConsultationPadContainerProps> = ({
  encounterSessionStartContext,
  onClose,
  isActionAreaExpanded,
  onToggleActionAreaExpand,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const patientUuid = usePatientUUID();
  const { activeEpisodeId } = useClinicalAppData();
  const { clinicalConfig, isLoading: configLoading } = useClinicalConfig();
  const { encounterConcepts } = useEncounterConcepts();
  const hasAddVisitsPrivilege = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.ADD_VISITS,
  );

  const queryClient = useQueryClient();

  const [visitCreated, setVisitCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<Error | null>(null);

  const {
    data: activeVisit,
    error: queryError,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ['activeVisitAtLoginLocation', patientUuid],
    queryFn: () => getActiveVisitAtLoginLocation(patientUuid!),
    enabled: !!patientUuid,
    retry: false,
  });

  const allowedVisitTypes = useMemo<string[]>(
    () => clinicalConfig?.consultationPad?.allowedVisitTypes ?? [],
    [clinicalConfig],
  );

  const encounterDetailsControl = useMemo(() => {
    if (configLoading) return undefined;
    const inputControlConfig =
      clinicalConfig?.consultationPad?.inputControls?.find(
        (c) => c.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY,
      );
    return {
      ...inputControlConfig,
      metadata: { ...inputControlConfig?.metadata, allowedVisitTypes },
    } as InputControl;
  }, [configLoading, clinicalConfig, allowedVisitTypes]);

  const defaultEncounterType = encounterDetailsControl?.metadata
    ?.defaultEncounterType as string;

  const allowedVisitTypeObjects = useMemo(() => {
    if (!encounterConcepts?.visitTypes || allowedVisitTypes.length === 0)
      return [];
    return encounterConcepts.visitTypes.filter((v) =>
      allowedVisitTypes.includes(v.name),
    );
  }, [encounterConcepts?.visitTypes, allowedVisitTypes]);

  const isAllowedVisitTypesMissing =
    !configLoading && allowedVisitTypes.length === 0;
  const noActiveVisit = activeVisit === null;
  const shouldAutoCreate =
    noActiveVisit &&
    hasAddVisitsPrivilege &&
    allowedVisitTypeObjects.length === 1;

  const createVisitAndProceed = useCallback(
    async (visitTypeUuid: string, visitTypeName: string) => {
      setCreating(true);
      setCreationError(null);
      try {
        const visitLocation = await getVisitLocationUUID(
          getUserLoginLocation().uuid,
        );
        await createVisitWithFhirR4(
          patientUuid!,
          visitLocation.uuid,
          visitTypeUuid,
          activeEpisodeId ?? undefined,
        );

        dispatchAuditEvent({
          eventType: 'START_VISIT',
          patientUuid: patientUuid!,
          messageParams: { visitType: visitTypeName },
          module: MODULE_LABELS.CLINICAL,
        });
        useEncounterDetailsStore.getState().reset();
        await queryClient.invalidateQueries({
          queryKey: ['activeVisitAtLoginLocation', patientUuid],
        });
        setVisitCreated(true);
      } catch (err) {
        setCreationError(
          err instanceof Error
            ? err
            : new Error(t('START_VISIT_ERROR_MESSAGE')),
        );
      } finally {
        setCreating(false);
      }
    },
    [patientUuid, t, queryClient, activeEpisodeId],
  );

  useEffect(() => {
    useEncounterDetailsStore.getState().setConsultationDate(new Date());
  }, []);

  useEffect(() => {
    useEncounterDetailsStore
      .getState()
      .setRequestedEncounterType(defaultEncounterType ?? null);
  }, [defaultEncounterType]);

  useEffect(() => {
    if (!shouldAutoCreate) return;
    const visitType = allowedVisitTypeObjects[0];
    createVisitAndProceed(visitType.uuid, visitType.name);
  }, [shouldAutoCreate, allowedVisitTypeObjects, createVisitAndProceed]);

  useEffect(() => {
    if (!creationError && !queryError) return;
    addNotification({
      type: 'error',
      title: t('START_VISIT_ERROR_TITLE'),
      message: t('START_VISIT_ERROR_MESSAGE'),
    });
  }, [creationError, queryError, addNotification, t]);

  const selectedVisitType = useEncounterDetailsStore(
    (encounterDetails) => encounterDetails.selectedVisitType,
  );
  const selectedEncounterType = useEncounterDetailsStore(
    (encounterDetails) => encounterDetails.selectedEncounterType,
  );

  const handleCancel = useCallback(() => {
    useEncounterDetailsStore.getState().reset();
    onClose();
  }, [onClose]);

  const handleStart = useCallback(() => {
    if (!selectedVisitType || !selectedEncounterType) return;
    createVisitAndProceed(selectedVisitType.uuid, selectedVisitType.name);
  }, [selectedVisitType, selectedEncounterType, createVisitAndProceed]);

  if (activeVisit || visitCreated) {
    return (
      <ConsultationPad
        encounterSessionStartContext={encounterSessionStartContext}
        onClose={onClose}
        isActionAreaExpanded={isActionAreaExpanded}
        onToggleActionAreaExpand={onToggleActionAreaExpand}
      />
    );
  }

  if (configLoading || queryLoading || creating) {
    return (
      <div
        className={styles.loadingWrapper}
        data-testid="consultation-pad-container-loading"
      >
        <Loading description={t('STARTING_VISIT')} withOverlay={false} />
      </div>
    );
  }

  if (noActiveVisit && (!hasAddVisitsPrivilege || isAllowedVisitTypesMissing)) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CLOSE_BUTTON')}
        onPrimaryButtonClick={onClose}
        content={
          <div className={styles.bannerWrapper}>
            <InlineNotification
              kind="warning"
              title={t('START_VISIT_REQUEST_TO_BE_STARTED')}
              lowContrast
              hideCloseButton
              testId="consultation-pad-container-no-privilege"
            />
          </div>
        }
        ariaLabel={t('CONSULTATION_PAD_TITLE')}
        isExpanded={isActionAreaExpanded}
        onToggleExpand={onToggleActionAreaExpand}
        expandAriaLabel={t('CONSULTATION_PAD_EXPAND_ARIA_LABEL')}
        collapseAriaLabel={t('CONSULTATION_PAD_COLLAPSE_ARIA_LABEL')}
      />
    );
  }

  if (
    noActiveVisit &&
    hasAddVisitsPrivilege &&
    allowedVisitTypeObjects.length > 1
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('START_VISIT_BUTTON')}
        onPrimaryButtonClick={handleStart}
        isPrimaryButtonDisabled={
          !selectedVisitType || !selectedEncounterType || creating
        }
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleCancel}
        content={
          <>
            <div className={styles.bannerWrapper}>
              <InlineNotification
                kind="warning"
                title={t('START_VISIT_NO_ACTIVE_VISIT_BANNER')}
                lowContrast
                hideCloseButton
              />
            </div>
            <EncounterDetails
              encounterSessionStartContext={{
                ...encounterSessionStartContext,
                isVisitActive: false,
              }}
              inputControlConfig={encounterDetailsControl}
            />
          </>
        }
        ariaLabel={t('CONSULTATION_PAD_TITLE')}
        isExpanded={isActionAreaExpanded}
        onToggleExpand={onToggleActionAreaExpand}
        expandAriaLabel={t('CONSULTATION_PAD_EXPAND_ARIA_LABEL')}
        collapseAriaLabel={t('CONSULTATION_PAD_COLLAPSE_ARIA_LABEL')}
      />
    );
  }

  return null;
};

export default ConsultationPadContainer;
