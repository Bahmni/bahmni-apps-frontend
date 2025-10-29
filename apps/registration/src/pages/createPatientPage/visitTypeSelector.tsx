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
  type CreateVisitRequest,
  type AuditEventType,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitSave: () => Promise<string | null>;
}

export const VisitTypeSelector = ({ onVisitSave }: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const [visitPayload, setVisitPayload] = useState<CreateVisitRequest>();
  const [patientUUID, setPatientUUID] = useState<string | null>(null);
  const {
    data: visitTypesFromApi = [],
    isLoading: isLoadingVisitTypes,
    error: visitTypesError,
  } = useQuery({
    queryKey: ['visitTypes'],
    queryFn: getVisitTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: visitLocationUUID } = useQuery({
    queryKey: ['visitLocationUUID'],
    queryFn: () => getVisitLocationUUID(getUserLoginLocation().uuid),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createVisitAndLogAudit = async () => {
    const result = await createVisit(visitPayload!);

    if (visitPayload) {
      const visitType = visitTypesFromApi.find(
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

  const { data: visitStarted, error: getVisitError } = useQuery({
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

    const path = window.location.pathname;
    const parts = path.split('/');
    const patientIndex = parts.indexOf('patient');
    const uuidFromUrl = patientIndex !== -1 ? parts[patientIndex + 1] : null;

    if (!patientUUID && visitLocationUUID) {
      if (uuidFromUrl) {
        setVisitPayload({
          patient: uuidFromUrl,
          visitType: selectedItem.uuid,
          location: visitLocationUUID.uuid,
        });
        setPatientUUID(uuidFromUrl);
      } else {
        const newPatientUuid = await onVisitSave();
        if (newPatientUuid && visitLocationUUID) {
          setVisitPayload({
            patient: newPatientUuid,
            visitType: selectedItem.uuid,
            location: visitLocationUUID.uuid,
          });
        }
        setPatientUUID(newPatientUuid);
      }
    }
  };

  const hasActiveVisit =
    visitStarted?.results && visitStarted.results.length > 0;

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="visit-button"
        kind="primary"
        disabled={isLoadingVisitTypes || visitTypesFromApi.length === 0}
        onClick={() => handleVisitTypeChange(visitTypesFromApi[1])}
      >
        {!isLoadingVisitTypes && visitTypesFromApi.length > 1
          ? hasActiveVisit
            ? t('ENTER VISIT DETAILS')
            : t('START_VISIT_TYPE', { visitType: visitTypesFromApi[1].name })
          : ''}
      </Button>
      {!hasActiveVisit && (
        <Dropdown
          id="visit-dropdown"
          items={visitTypesFromApi.filter((_, index) => index !== 1)}
          itemToString={(item) =>
            item ? t('START_VISIT_TYPE', { visitType: item.name }) : ''
          }
          onChange={({ selectedItem }) => handleVisitTypeChange(selectedItem)}
          label=""
          type="inline"
          disabled={
            isLoadingVisitTypes ||
            visitTypesFromApi.length === 0 ||
            hasActiveVisit
          }
          titleText=""
          selectedItem={null}
        />
      )}
    </div>
  );
};
