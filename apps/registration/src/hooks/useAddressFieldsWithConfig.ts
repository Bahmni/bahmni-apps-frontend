import { getOrderedAddressHierarchyLevels } from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  useAddressFields,
  type AddressLevel,
  type AddressHierarchyConfig,
  type AddressData,
} from './useAddressFields';
import { useRegistrationConfig } from './useRegistrationConfig';

/**
 * Enhanced hook that combines dynamic address level fetching with useAddressFields
 *
 * This hook:
 * 1. Fetches address hierarchy levels from backend API
 * 2. Gets configuration from registration config
 * 3. Combines them with useAddressFields hook
 * 4. Returns fully configured address field management
 *
 * @param initialAddress - Optional initial address data
 * @returns Address field management with dynamically loaded levels
 */
export function useAddressFieldsWithConfig(initialAddress?: AddressData) {
  // Fetch address hierarchy levels from backend
  const {
    data: addressLevelsFromApi,
    isLoading: isLoadingLevels,
    isError: isErrorLevels,
    error: levelsError,
  } = useQuery({
    queryKey: ['addressHierarchyLevels'],
    queryFn: getOrderedAddressHierarchyLevels,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 2,
  });

  // Get registration config
  const { registrationConfig } = useRegistrationConfig();
  const addressHierarchyConfig =
    registrationConfig?.patientInformation?.addressHierarchy;

  // Convert API response to AddressLevel format with strict entry flags
  const addressLevels: AddressLevel[] = useMemo(() => {
    if (!addressLevelsFromApi || addressLevelsFromApi.length === 0) {
      // Return default address levels if API fails
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

    // Convert API levels to AddressLevel format
    return addressLevelsFromApi.map((level) => ({
      addressField: level.addressField,
      name: level.name,
      required: level.required,
    }));
  }, [addressLevelsFromApi]);

  // Build address hierarchy configuration
  const config: AddressHierarchyConfig = useMemo(
    () => ({
      showAddressFieldsTopDown:
        addressHierarchyConfig?.showAddressFieldsTopDown ?? false,
      strictAutocompleteFromLevel:
        addressHierarchyConfig?.strictAutocompleteFromLevel,
    }),
    [addressHierarchyConfig],
  );

  // Use the address fields hook with dynamic levels
  const addressFieldsResult = useAddressFields(
    addressLevels,
    config,
    initialAddress,
  );

  return {
    // Pass through all hook results
    ...addressFieldsResult,

    // Add loading and error states for address levels
    isLoadingLevels,
    isErrorLevels,
    levelsError,

    // Expose the raw API data for reference
    addressLevelsFromApi,
  };
}

/**
 * Hook specifically for fetching address hierarchy levels
 * Useful when you only need the levels without the full field management
 */
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
