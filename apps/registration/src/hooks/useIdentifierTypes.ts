import { getIdentifierTypes, IdentifierTypesResponse } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const IDENTIFIER_TYPES_QUERY_KEY = ['identifierTypes'];

export const useIdentifierTypes = () => {
  return useQuery<IdentifierTypesResponse, Error>({
    queryKey: IDENTIFIER_TYPES_QUERY_KEY,
    queryFn: getIdentifierTypes,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
