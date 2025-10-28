import {
  getIdentifierData,
  getGenders,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const usePatientIdentifiers = () => {
  const { t } = useTranslation();

  // Fetch all identifier type data in a single optimized query
  const { data: identifierData } = useQuery({
    queryKey: ['identifierData'],
    queryFn: getIdentifierData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: gendersFromApi = [] } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Map genders to their translated values
  const genders = useMemo(() => {
    return gendersFromApi.map((gender) => {
      const genderKey = `CREATE_PATIENT_GENDER_${gender.toUpperCase()}`;
      return t(genderKey);
    });
  }, [gendersFromApi, t]);

  const identifierPrefixes = useMemo(
    () => identifierData?.prefixes ?? [],
    [identifierData?.prefixes],
  );

  const identifierSources = useMemo(
    () => identifierData?.sourcesByPrefix,
    [identifierData?.sourcesByPrefix],
  );

  const primaryIdentifierType = useMemo(
    () => identifierData?.primaryIdentifierTypeUuid,
    [identifierData?.primaryIdentifierTypeUuid],
  );

  return {
    genders,
    identifierPrefixes,
    identifierSources,
    primaryIdentifierType,
  };
};
