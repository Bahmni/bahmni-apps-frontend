import { Button, Dropdown } from '@bahmni-frontend/bahmni-design-system';
import {
  getVisitTypes,
  useTranslation,
  notificationService,
  createVisit,
  getActiveVisitByPatient,
  getUserLoginLocation,
  getVisitLocationUUID,
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  getRegistrationConfig,
  type VisitData,
  type AuditEventType,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitSave: () => Promise<string | null>;
  patientUuid?: string | null;
}

export const VisitTypeSelector = ({
  onVisitSave,
  patientUuid,
}: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const [visitPayload, setVisitPayload] = useState<VisitData>();

  const {
    data: visitTypes,
    isLoading: isLoadingVisitTypes,
    error: visitTypesError,
  } = useQuery({
    queryKey: ['visitTypes'],
    queryFn: getVisitTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: visitLocationUUID } = useQuery({
    queryKey: ['visitLocationUUID', getUserLoginLocation().uuid],
    queryFn: () => getVisitLocationUUID(getUserLoginLocation().uuid),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: registrationConfig } = useQuery({
    queryKey: ['registrationConfig'],
    queryFn: getRegistrationConfig,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const visitTypesArray = visitTypes?.visitTypes
    ? Object.entries(visitTypes.visitTypes).map(([name, uuid]) => ({
        name,
        uuid,
      }))
    : [];

  const defaultVisitType =
    visitTypesArray.find(
      (vt) => vt.name === registrationConfig?.defaultVisitType,
    ) ?? visitTypesArray[0];

  const createVisitAndLogAudit = async () => {
    const result = await createVisit(visitPayload!);

    if (visitPayload) {
      const visitType = visitTypesArray.find(
        (vt) => vt.uuid === visitPayload.visitType,
      );
      if (visitType) {
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.OPEN_VISIT
            .eventType as AuditEventType,
          patientUuid: visitPayload.patient,
          messageParams: { visitType: visitType.name },
          module: AUDIT_LOG_EVENT_DETAILS.OPEN_VISIT.module,
        });
      }
    }

    return result;
  };

  const { error: createVisitError, isSuccess: isVisitCreated } = useQuery({
    queryKey: ['createVisit', visitPayload],
    queryFn: createVisitAndLogAudit,
    enabled: Boolean(visitPayload),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: activeVisit, error: getVisitError } = useQuery({
    queryKey: [
      'getActiveVisitByPatient',
      visitPayload?.patient,
      isVisitCreated,
    ],
    queryFn: () => getActiveVisitByPatient(visitPayload!.patient),
    enabled: Boolean(visitPayload?.patient) && isVisitCreated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const error = visitTypesError ?? createVisitError ?? getVisitError;

  useEffect(() => {
    if (error) {
      notificationService.showError(
        t('ERROR_DEFAULT_TITLE'),
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  }, [error, t]);

  const handleVisitTypeChange = async (
    selectedItem: { name: string; uuid: string } | null,
  ) => {
    if (!selectedItem) return;

    const currentPatientUUID = patientUuid ?? (await onVisitSave());

    if (currentPatientUUID && visitLocationUUID) {
      setVisitPayload({
        patient: currentPatientUUID,
        visitType: selectedItem.uuid,
        location: visitLocationUUID.uuid,
      });
    }
  };

  const hasActiveVisit = activeVisit?.results && activeVisit.results.length > 0;

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="visit-button"
        kind="primary"
        disabled={isLoadingVisitTypes || visitTypesArray.length === 0}
        onClick={() => handleVisitTypeChange(defaultVisitType)}
      >
        {!isLoadingVisitTypes && defaultVisitType
          ? hasActiveVisit
            ? t('ENTER VISIT DETAILS')
            : t('START_VISIT_TYPE', { visitType: defaultVisitType.name })
          : ''}
      </Button>
      {!hasActiveVisit && (
        <Dropdown
          id="visit-dropdown"
          items={visitTypesArray.filter(
            (vt) => vt.uuid !== defaultVisitType?.uuid,
          )}
          itemToString={(item) =>
            item ? t('START_VISIT_TYPE', { visitType: item.name }) : ''
          }
          onChange={({ selectedItem }) => handleVisitTypeChange(selectedItem)}
          label=""
          type="inline"
          disabled={
            isLoadingVisitTypes ||
            visitTypesArray.length === 0 ||
            hasActiveVisit
          }
          titleText=""
          selectedItem={null}
        />
      )}
    </div>
  );
};
