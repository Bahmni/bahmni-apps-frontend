import {
  Button,
  Dropdown,
  Loading,
} from '@bahmni-frontend/bahmni-design-system';
import {
  getVisitTypes,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CreateVisitRequest } from '../../../../../../packages/bahmni-services/src/patientService/models';
import { createVisit } from '../../../../../../packages/bahmni-services/src/patientService/patientService';
import { getUserLoginLocation } from '../../../../../../packages/bahmni-services/src/userService';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  patientUuid: string;
  onVisitSave: () => boolean;
}

export const VisitTypeSelector = ({
  patientUuid,
  onVisitSave,
}: VisitTypeSelectorProps) => {
  useTranslation();
  const [visitPayload, setVisitPayload] = useState<CreateVisitRequest>();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  console.log('patientUuid', patientUuid);
  const { data: visitTypesFromApi = [], isLoading: isLoadingVisitTypes } =
    useQuery({
      queryKey: ['visitTypes'],
      queryFn: getVisitTypes,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });

  useQuery({
    queryKey: ['createVisit', visitPayload],
    queryFn: () => createVisit(visitPayload!),
    enabled: Boolean(visitPayload),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isNavigating) {
    return <Loading description={t('LOADING_PATIENT_DETAILS')} role="status" />;
  }

  const handleVisitTypeChange = (
    selectedItem: { name: string; uuid: string } | null,
  ) => {
    if (!selectedItem) return;

    if (onVisitSave()) {
      const loginLocation = getUserLoginLocation();
      console.log('patientUuid', patientUuid);
      setVisitPayload({
        patient: patientUuid,
        visitType: selectedItem.uuid,
        location: loginLocation.uuid,
      });
      setIsNavigating(true);
      window.location.href = `/bahmni/registration/index.html#/patient/${patientUuid}/visit`;
    }
  };

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="opd-visit-button"
        kind="primary"
        disabled={isLoadingVisitTypes || visitTypesFromApi.length === 0}
        onClick={() => handleVisitTypeChange(visitTypesFromApi[1])}
      >
        {!isLoadingVisitTypes && visitTypesFromApi.length > 1
          ? `Start ${visitTypesFromApi[1].name} visit`
          : 'Loading...'}
      </Button>

      <Dropdown
        id="opd-visit-dropdown"
        items={visitTypesFromApi.filter((_, index) => index !== 1)}
        itemToString={(item) => (item ? `Start ${item.name} visit` : '')}
        onChange={({ selectedItem }) => handleVisitTypeChange(selectedItem)}
        className={styles.dropdown}
        label=""
        type="inline"
        disabled={isLoadingVisitTypes || visitTypesFromApi.length === 0}
        titleText=""
        selectedItem={null}
      />
    </div>
  );
};
