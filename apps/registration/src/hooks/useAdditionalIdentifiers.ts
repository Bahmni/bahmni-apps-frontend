import { getIdentifierTypes, IdentifierTypesResponse } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

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
  const { data: identifierTypes, isLoading } = useIdentifierTypes();

  const hasAdditionalIdentifiers = useMemo(() => {
    if (!identifierTypes) return false;
    return identifierTypes.some((type) => type.primary === false);
  }, [identifierTypes]);

  const shouldShowAdditionalIdentifiers = hasAdditionalIdentifiers;

  return {
    shouldShowAdditionalIdentifiers,
    hasAdditionalIdentifiers,
    identifierTypes,
    isLoading,
  };
};
