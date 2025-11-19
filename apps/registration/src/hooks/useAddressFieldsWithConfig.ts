import { getOrderedAddressHierarchyLevels } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  useAddressFields,
  type AddressLevel,
  type AddressHierarchyConfig,
  type AddressData,
} from './useAddressFields';
import { useRegistrationConfig } from './useRegistrationConfig';

export function useAddressFieldsWithConfig(initialAddress?: AddressData) {
  const {
    data: addressLevelsFromApi,
    isLoading: isLoadingLevels,
    isError: isErrorLevels,
    error: levelsError,
  } = useQuery({
    queryKey: ['addressHierarchyLevels'],
    queryFn: getOrderedAddressHierarchyLevels,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });

  const { registrationConfig } = useRegistrationConfig();
  const addressHierarchyConfig =
    registrationConfig?.patientInformation?.addressHierarchy;

  const addressLevels: AddressLevel[] = useMemo(() => {
    if (!addressLevelsFromApi || addressLevelsFromApi.length === 0) {
      return [
        {
          addressField: 'address1',
          name: 'House Number / Flat',
          required: false,
        },
        {
          addressField: 'address2',
          name: 'Locality / Sector',
          required: false,
        },
        { addressField: 'stateProvince', name: 'State', required: false },
        { addressField: 'countyDistrict', name: 'District', required: false },
        {
          addressField: 'cityVillage',
          name: 'City / Village',
          required: false,
        },
        { addressField: 'postalCode', name: 'Postal Code', required: false },
      ];
    }

    return addressLevelsFromApi.map((level) => ({
      addressField: level.addressField,
      name: level.name,
      required: level.required,
    }));
  }, [addressLevelsFromApi]);

  const config: AddressHierarchyConfig = useMemo(
    () => ({
      showAddressFieldsTopDown:
        addressHierarchyConfig?.showAddressFieldsTopDown ?? false,
      strictAutocompleteFromLevel:
        addressHierarchyConfig?.strictAutocompleteFromLevel,
    }),
    [addressHierarchyConfig],
  );

  const addressFieldsResult = useAddressFields(
    addressLevels,
    config,
    initialAddress,
  );

  return {
    ...addressFieldsResult,

    isLoadingLevels,
    isErrorLevels,
    levelsError,

    addressLevelsFromApi,
  };
}

export function useAddressHierarchyLevels() {
  const {
    data: addressLevels,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['addressHierarchyLevels'],
    queryFn: getOrderedAddressHierarchyLevels,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });

  return {
    addressLevels: addressLevels ?? [],
    isLoading,
    isError,
    error,
  };
}
