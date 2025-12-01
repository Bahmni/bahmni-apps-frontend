import { getIdentifierTypes, IdentifierTypesResponse } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRegistrationConfig } from './useRegistrationConfig';

export const IDENTIFIER_TYPES_QUERY_KEY = ['identifierTypes'];

export const useIdentifierTypes = () => {
  return useQuery<IdentifierTypesResponse, Error>({
    queryKey: IDENTIFIER_TYPES_QUERY_KEY,
    queryFn: getIdentifierTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 2,
  });
};

export const useAdditionalIdentifiers = () => {
  const { registrationConfig } = useRegistrationConfig();
  const { data: identifierTypes, isLoading } = useIdentifierTypes();

  const isConfigEnabled = useMemo(
    () =>
      registrationConfig?.patientInformation
        ?.showExtraPatientIdentifiersSection ?? true,
    [registrationConfig],
  );

  const hasAdditionalIdentifiers = useMemo(() => {
    if (!identifierTypes) return false;
    return identifierTypes.some((type) => type.primary === false);
  }, [identifierTypes]);

  const shouldShowAdditionalIdentifiers =
    isConfigEnabled && hasAdditionalIdentifiers;

  return {
    shouldShowAdditionalIdentifiers,
    hasAdditionalIdentifiers,
    isConfigEnabled,
    identifierTypes,
    isLoading,
  };
};
