import {
  Button,
  Dropdown,
  Loading,
} from '@bahmni-frontend/bahmni-design-system';
import {
  getVisitTypes,
  useTranslation,
  notificationService,
  createVisit,
  getUserLoginLocation,
  type CreateVisitRequest,
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
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

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

  const { error: createVisitError, isSuccess: isVisitCreated } = useQuery({
    queryKey: ['createVisit', visitPayload],
    queryFn: () => createVisit(visitPayload!),
    enabled: Boolean(visitPayload),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const error = visitTypesError ?? createVisitError;

  useEffect(() => {
    if (error) {
      notificationService.showError(
        t('ERROR_DEFAULT_TITLE'),
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
    if (isVisitCreated && visitPayload) {
      setIsNavigating(false);
      window.location.href = `/bahmni/registration/index.html#/patient/${visitPayload.patient}/visit`;
    }
  }, [error, isVisitCreated, visitPayload, t]);

  const handleVisitTypeChange = async (
    selectedItem: { name: string; uuid: string } | null,
  ) => {
    if (!selectedItem) return;

    const patientUuid = await onVisitSave();
    if (patientUuid) {
      const loginLocation = getUserLoginLocation();
      setIsNavigating(true);
      setVisitPayload({
        patient: patientUuid,
        visitType: selectedItem.uuid,
        location: loginLocation.uuid,
      });
    }
  };

  if (isNavigating) {
    return <Loading description={t('LOADING_PATIENT_DETAILS')} role="status" />;
  }

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="visit-button"
        kind="primary"
        disabled={isLoadingVisitTypes || visitTypesFromApi.length === 0}
        onClick={() => handleVisitTypeChange(visitTypesFromApi[1])}
      >
        {!isLoadingVisitTypes && visitTypesFromApi.length > 1
          ? `Start ${visitTypesFromApi[1].name} visit`
          : 'Loading...'}
      </Button>

      <Dropdown
        id="visit-dropdown"
        items={visitTypesFromApi.filter((_, index) => index !== 1)}
        itemToString={(item) => (item ? `Start ${item.name} visit` : '')}
        onChange={({ selectedItem }) => handleVisitTypeChange(selectedItem)}
        label=""
        type="inline"
        disabled={isLoadingVisitTypes || visitTypesFromApi.length === 0}
        titleText=""
        selectedItem={null}
      />
    </div>
  );
};
