import {
  getTelecomAttributeTypeMap,
  type TelecomAttributeTypeMapping,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetches the admin-configured fhir2Extension.telecomAttributeTypeMap global property, used to
 * resolve Patient.telecom ContactPoints back to person attribute names.
 */
export const useTelecomAttributeTypeMap = (): {
  telecomAttributeTypeMap: TelecomAttributeTypeMapping[];
  isLoading: boolean;
} => {
  const { data, isLoading } = useQuery({
    queryKey: ['telecomAttributeTypeMap'],
    queryFn: getTelecomAttributeTypeMap,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  return { telecomAttributeTypeMap: data ?? [], isLoading };
};
