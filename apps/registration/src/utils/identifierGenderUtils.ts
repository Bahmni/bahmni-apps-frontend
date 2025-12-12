import { getGenders, getIdentifierData } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useIdentifierData = () => {
  const { data: identifierData } = useQuery({
    queryKey: ['identifierData'],
    queryFn: getIdentifierData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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
    identifierPrefixes,
    identifierSources,
    primaryIdentifierType,
  };
};

export const useGenderData = (t: (key: string) => string) => {
  const { data: gendersFromApi = {} } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Map genders to their translated values
  const genders = useMemo(() => {
    return Object.values(gendersFromApi).map((gender) => {
      const genderStr = String(gender || '');
      const genderKey = `CREATE_PATIENT_GENDER_${genderStr.toUpperCase()}`;
      return t(genderKey);
    });
  }, [gendersFromApi, t]);

  const getGenderDisplay = (code: string): string => {
    const genderValue = gendersFromApi[code];
    if (!genderValue) return code;
    const genderStr = String(genderValue);
    const genderKey = `CREATE_PATIENT_GENDER_${genderStr.toUpperCase()}`;
    return t(genderKey);
  };

  return { genders, getGenderDisplay };
};
