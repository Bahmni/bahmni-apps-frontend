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
      const genderKey = `CREATE_PATIENT_GENDER_${gender.toUpperCase()}`;
      return t(genderKey);
    });
  }, [gendersFromApi, t]);

  const getGenderDisplay = (code: string): string => {
    const genderValue = gendersFromApi[code];
    if (!genderValue) return code;
    const genderKey = `CREATE_PATIENT_GENDER_${genderValue.toUpperCase()}`;
    return t(genderKey);
  };

  const getGenderAbbreviation = (gender: string): string => {
    const genderUpper = gender?.trim().toUpperCase();
    const genderMap: Record<string, string> = {
      M: 'PATIENT_SEARCH_GENDER_M',
      MALE: 'PATIENT_SEARCH_GENDER_M',
      F: 'PATIENT_SEARCH_GENDER_F',
      FEMALE: 'PATIENT_SEARCH_GENDER_F',
      O: 'PATIENT_SEARCH_GENDER_O',
      OTHER: 'PATIENT_SEARCH_GENDER_O',
    };

    return genderMap[genderUpper] ? t(genderMap[genderUpper]) : gender;
  };

  return { genders, getGenderDisplay, getGenderAbbreviation };
};
