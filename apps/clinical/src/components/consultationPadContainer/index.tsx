import { ActionArea, InlineNotification, Loading } from '@bahmni/design-system';
import {
  MODULE_LABELS,
  createFhirVisit,
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
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import type { EncounterDetailsMetadata } from '../../providers/clinicalConfig/models';
import { useEncounterDetailsStore } from '../../stores/encounterDetailsStore';
import ConsultationPad from '../consultationPad';
import { ENCOUNTER_DETAILS_INPUT_CONTROL_KEY } from '../consultationPad/constants';
import EncounterDetails from '../forms/encounterDetails/EncounterDetails';
import styles from './styles/ConsultationPadContainer.module.scss';

interface ConsultationPadContainerProps {
  encounterSessionStartContext: EncounterSessionStartContext;
  onClose: () => void;
}

const ConsultationPadContainer: React.FC<ConsultationPadContainerProps> = ({
  encounterSessionStartContext,
  onClose,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const patientUuid = usePatientUUID();
  const { clinicalConfig, isLoading: configLoading } = useClinicalConfig();
  const { encounterConcepts } = useEncounterConcepts();
  const hasAddVisitsPrivilege = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.ADD_VISITS,
  );
  const queryClient = useQueryClient();

  const [visitCreated, setVisitCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creationError, setCreationError] = useState<Error | null>(null);

  const encounterDetailsMetadata = useMemo(() => {
    if (configLoading) return undefined;
    return clinicalConfig?.consultationPad?.inputControls?.find(
      (c) => c.type === ENCOUNTER_DETAILS_INPUT_CONTROL_KEY,
    )?.metadata as EncounterDetailsMetadata | undefined;
  }, [configLoading, clinicalConfig]);

  const allowedVisitTypes = useMemo<string[]>(
    () => encounterDetailsMetadata?.allowedVisitTypes ?? [],
    [encounterDetailsMetadata],
  );

  const defaultEncounterType = encounterDetailsMetadata?.defaultEncounterType;

  const allowedVisitTypeObjects = useMemo(() => {
    if (!encounterConcepts?.visitTypes || allowedVisitTypes.length === 0)
      return [];
    return encounterConcepts.visitTypes.filter((v) =>
      allowedVisitTypes.includes(v.name),
    );
  }, [encounterConcepts?.visitTypes, allowedVisitTypes]);

  const {
    data: activeVisit,
    error: queryError,
    isLoading: queryLoading,
  } = useQuery({
    queryKey: ['activeVisitAtLoginLocation', patientUuid],
    queryFn: () => getActiveVisitAtLoginLocation(patientUuid!),
    enabled: !configLoading && allowedVisitTypes.length > 0,
    retry: false,
  });

  const createVisitAndProceed = useCallback(
    async (visitTypeUuid: string, visitTypeName: string) => {
      setCreating(true);
      setCreationError(null);
      try {
        let loginLocationUuid: string;
        try {
          loginLocationUuid = getUserLoginLocation().uuid;
        } catch (err) {
          throw err instanceof Error
            ? err
            : new Error(t('START_VISIT_ERROR_MESSAGE'));
        }
        const visitLocation = await getVisitLocationUUID(loginLocationUuid);
        await createFhirVisit(patientUuid!, visitLocation.uuid, visitTypeUuid);
        dispatchAuditEvent({
          eventType: 'START_VISIT_IN_ABSENTIA',
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
    [patientUuid, t, queryClient],
  );

  useEffect(() => {
    useEncounterDetailsStore.getState().setConsultationDate(new Date());
  }, []);

  useEffect(() => {
    useEncounterDetailsStore
      .getState()
      .setRequestedEncounterType(defaultEncounterType ?? null);
  }, [defaultEncounterType]);

  const shouldAutoCreate =
    !configLoading &&
    !queryLoading &&
    !queryError &&
    activeVisit === null &&
    hasAddVisitsPrivilege &&
    allowedVisitTypeObjects.length === 1 &&
    !visitCreated &&
    !creating &&
    !creationError;

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

  const handleCancel = useCallback(() => {
    useEncounterDetailsStore.getState().reset();
    onClose();
  }, [onClose]);

  const selectedVisitType = useEncounterDetailsStore(
    (encounterDetails) => encounterDetails.selectedVisitType,
  );
  const selectedEncounterType = useEncounterDetailsStore(
    (encounterDetails) => encounterDetails.selectedEncounterType,
  );

  const handleStart = useCallback(() => {
    if (!selectedVisitType || !selectedEncounterType) return;
    createVisitAndProceed(selectedVisitType.uuid, selectedVisitType.name);
  }, [selectedVisitType, selectedEncounterType, createVisitAndProceed]);

  const bypass = !configLoading && allowedVisitTypes.length === 0;

  const hasActiveVisit =
    !configLoading &&
    !queryLoading &&
    !queryError &&
    allowedVisitTypes.length > 0 &&
    activeVisit !== null &&
    activeVisit !== undefined;

  if (bypass || hasActiveVisit || visitCreated) {
    return (
      <ConsultationPad
        encounterSessionStartContext={encounterSessionStartContext}
        onClose={onClose}
      />
    );
  }

  if (
    configLoading ||
    queryLoading ||
    (activeVisit === null &&
      hasAddVisitsPrivilege &&
      allowedVisitTypeObjects.length === 1 &&
      !creationError) ||
    creating
  ) {
    return (
      <div
        className={styles.loadingWrapper}
        data-testid="consultation-pad-container-loading"
      >
        <Loading description={t('STARTING_VISIT')} withOverlay={false} />
      </div>
    );
  }

  if (
    !configLoading &&
    !queryLoading &&
    !queryError &&
    activeVisit === null &&
    !hasAddVisitsPrivilege
  ) {
    return (
      <ActionArea
        title={t('NEW_CONSULTATION')}
        primaryButtonText={t('CLOSE')}
        onPrimaryButtonClick={onClose}
        secondaryButtonText=""
        isSecondaryButtonDisabled
        content={
          <div className={styles.bannerWrapper}>
            <InlineNotification
              kind="warning"
              title={t('START_VISIT_NO_ACTIVE_VISIT_BANNER')}
              lowContrast
              hideCloseButton
              testId="consultation-pad-container-no-privilege"
            />
          </div>
        }
        ariaLabel={t('NEW_CONSULTATION')}
      />
    );
  }

  if (
    !configLoading &&
    !queryLoading &&
    !queryError &&
    activeVisit === null &&
    hasAddVisitsPrivilege &&
    allowedVisitTypeObjects.length > 1
  ) {
    return (
      <ActionArea
        title={t('NEW_CONSULTATION')}
        primaryButtonText={t('START_VISIT_BUTTON')}
        onPrimaryButtonClick={handleStart}
        isPrimaryButtonDisabled={
          !selectedVisitType || !selectedEncounterType || creating
        }
        secondaryButtonText={t('CANCEL')}
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
              mode="startVisit"
              allowedVisitTypes={allowedVisitTypes}
            />
          </>
        }
        ariaLabel={t('NEW_CONSULTATION')}
      />
    );
  }

  return null;
};

export default ConsultationPadContainer;
