import { getVisitTypes, type VisitType } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const useVisitTypes = () => {
  const { data: visitTypes, isLoading } = useQuery({
    queryKey: ['visitTypes'],
    queryFn: getVisitTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const visitTypesArray: VisitType[] = visitTypes?.visitTypes
    ? Object.entries(visitTypes.visitTypes).map(([name, uuid]) => ({
        name,
        uuid: uuid as string,
      }))
    : [];

  return {
    visitTypes: visitTypesArray,
    isLoading,
    rawData: visitTypes,
  };
};
