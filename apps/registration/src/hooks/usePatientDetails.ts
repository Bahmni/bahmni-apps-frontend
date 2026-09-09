import {
  getPatientById,
  getRelatedPersonsByPatient,
  useTranslation,
  type FhirRelatedPerson,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';
import {
  convertFhirToBasicInfo,
  convertFhirToPersonAttributes,
  convertFhirToAddressData,
  convertFhirToAdditionalIdentifiers,
  extractMetadata,
  extractDobEstimated,
} from '../utils/fhirPatientToFormData';
import { useGenderData } from '../utils/identifierGenderUtils';
import { convertFhirRelatedPersonsToRelationshipData } from '../utils/patientDataConverter';
import { usePersonAttributes } from './usePersonAttributes';

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
  const { personAttributes } = usePersonAttributes();

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
    queryFn: () => getPatientById(patientUuid!),
    enabled: !!patientUuid,
  });

  const { data: relatedPersonsBundle } = useQuery({
    queryKey: ['relatedPersons', patientUuid],
    queryFn: () => getRelatedPersonsByPatient(patientUuid!),
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
    () =>
      patientDetails
        ? convertFhirToBasicInfo(patientDetails, getGenderDisplay)
        : undefined,
    [patientDetails, getGenderDisplay],
  );

  const personAttributesInitialData = useMemo(
    () =>
      patientDetails
        ? convertFhirToPersonAttributes(patientDetails, personAttributes)
        : undefined,
    [patientDetails, personAttributes],
  );

  const addressInitialData = useMemo(
    () =>
      patientDetails ? convertFhirToAddressData(patientDetails) : undefined,
    [patientDetails],
  );

  const additionalIdentifiersInitialData = useMemo(
    () =>
      patientDetails
        ? convertFhirToAdditionalIdentifiers(patientDetails)
        : undefined,
    [patientDetails],
  );

  const initialDobEstimated = useMemo(
    () => (patientDetails ? extractDobEstimated(patientDetails) : false),
    [patientDetails],
  );

  const relationshipsInitialData = useMemo<RelationshipData[] | undefined>(
    () =>
      relatedPersonsBundle
        ? convertFhirRelatedPersonsToRelationshipData(
            (relatedPersonsBundle.entry ?? [])
              .filter((e): e is { resource: FhirRelatedPerson } => !!e.resource)
              .map((e) => e.resource),
          )
        : undefined,
    [relatedPersonsBundle],
  );

  useEffect(() => {
    if (patientDetails) {
      setMetadata(extractMetadata(patientDetails, t));
    }
  }, [patientDetails, t]);

  return {
    patientDetails,
    isLoading,
    profileInitialData,
    personAttributesInitialData,
    addressInitialData,
    additionalIdentifiersInitialData,
    initialDobEstimated,
    relationshipsInitialData,
    metadata,
  };
};
