import {
  getPatientProfile,
  formatDate,
  REGISTRATION_DATE_FORMAT,
  useTranslation,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useGenderData } from '../utils/identifierGenderUtils';
import {
  convertToBasicInfoData,
  convertToPersonAttributesData,
  convertToAddressData,
  convertToAdditionalIdentifiersData,
  convertToRelationshipsData,
} from '../utils/patientDataConverter';

interface UsePatientDetailsProps {
  patientUuid: string | undefined;
}

interface PatientMetadata {
  patientUuid: string;
  patientIdentifier: string;
  patientName: string;
  registerDate: string;
}

export const usePatientDetails = ({ patientUuid }: UsePatientDetailsProps) => {
  const { t } = useTranslation();
  const { getGenderDisplay } = useGenderData(t);
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const [metadata, setMetadata] = useState<PatientMetadata>({
    patientUuid: '',
    patientIdentifier: '',
    patientName: '',
    registerDate: '',
  });

  const {
    data: patientDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['formattedPatient', patientUuid],
    queryFn: () => getPatientProfile(patientUuid!),
    enabled: !!patientUuid,
  });

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: t('ERROR_LOADING_PATIENT_DETAILS'),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [error, t, addNotification]);

  const profileInitialData = useMemo(
    () => convertToBasicInfoData(patientDetails, getGenderDisplay),
    [patientDetails, getGenderDisplay],
  );

  const personAttributesInitialData = useMemo(
    () => convertToPersonAttributesData(patientDetails),
    [patientDetails],
  );

  const addressInitialData = useMemo(
    () => convertToAddressData(patientDetails),
    [patientDetails],
  );

  const additionalIdentifiersInitialData = useMemo(
    () => convertToAdditionalIdentifiersData(patientDetails),
    [patientDetails],
  );

  const relationshipsInitialData = useMemo(
    () => convertToRelationshipsData(patientDetails),
    [patientDetails],
  );

  const initialDobEstimated = useMemo(
    () => patientDetails?.patient?.person?.birthdateEstimated ?? false,
    [patientDetails],
  );

  useEffect(() => {
    if (patientDetails) {
      const dateCreated = patientDetails.patient?.auditInfo?.dateCreated;
      let formattedDate = '';

      if (dateCreated) {
        const result = formatDate(dateCreated, t, REGISTRATION_DATE_FORMAT);
        if (!result.error) {
          formattedDate = result.formattedResult;
        }
      }

      setMetadata({
        patientUuid: patientDetails.patient.uuid,
        patientIdentifier:
          patientDetails.patient.identifiers[0]?.identifier ?? '',
        patientName: patientDetails.patient.person.display ?? '',
        registerDate: formattedDate,
      });
    }
  }, [patientDetails, patientUuid, queryClient, t]);

  return {
    patientDetails,
    isLoading,
    profileInitialData,
    personAttributesInitialData,
    addressInitialData,
    additionalIdentifiersInitialData,
    relationshipsInitialData,
    initialDobEstimated,
    metadata,
  };
};
