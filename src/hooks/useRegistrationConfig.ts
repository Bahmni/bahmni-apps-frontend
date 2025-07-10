import { useState, useCallback, useEffect } from 'react';
import {
  PatientIdentifierType,
  PersonAttributeType,
  AddressLevel,
} from '../types/registration';
import { RegistrationService } from '../services/registration/registrationService';
import { useNotification } from './useNotification';

/**
 * Registration Configuration Hook
 * Provides registration configuration data including identifier types,
 * person attribute types, locations, and address hierarchy
 */

interface UseRegistrationConfigState {
  identifierTypes: PatientIdentifierType[];
  personAttributeTypes: PersonAttributeType[];
  locations: Array<{ uuid: string; display: string }>;
  addressHierarchy: AddressLevel[];
  isLoading: boolean;
  error: string | null;
}

interface UseRegistrationConfigActions {
  refreshConfig: () => Promise<void>;
  refreshIdentifierTypes: () => Promise<void>;
  refreshPersonAttributeTypes: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshAddressHierarchy: () => Promise<void>;
  getIdentifierTypeByUuid: (uuid: string) => PatientIdentifierType | undefined;
  getPersonAttributeTypeByUuid: (uuid: string) => PersonAttributeType | undefined;
  getLocationByUuid: (uuid: string) => { uuid: string; display: string } | undefined;
  getRequiredIdentifierTypes: () => PatientIdentifierType[];
  getRequiredPersonAttributeTypes: () => PersonAttributeType[];
  clearError: () => void;
}

interface UseRegistrationConfigReturn extends UseRegistrationConfigState, UseRegistrationConfigActions {}

interface UseRegistrationConfigOptions {
  autoLoad?: boolean;
}

/**
 * Custom hook for managing registration configuration data
 * @param options - Configuration options for the hook
 * @returns Registration configuration state and actions
 */
export const useRegistrationConfig = (
  options: UseRegistrationConfigOptions = {},
): UseRegistrationConfigReturn => {
  const { autoLoad = true } = options;
  const notification = useNotification();

  // State management
  const [identifierTypes, setIdentifierTypes] = useState<PatientIdentifierType[]>([]);
  const [personAttributeTypes, setPersonAttributeTypes] = useState<PersonAttributeType[]>([]);
  const [locations, setLocations] = useState<Array<{ uuid: string; display: string }>>([]);
  const [addressHierarchy, setAddressHierarchy] = useState<AddressLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load identifier types
  const loadIdentifierTypes = useCallback(async (): Promise<void> => {
    try {
      const data = await RegistrationService.getPatientIdentifierTypes();
      setIdentifierTypes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load identifier types';
      throw new Error(errorMessage);
    }
  }, []);

  // Load person attribute types
  const loadPersonAttributeTypes = useCallback(async (): Promise<void> => {
    try {
      const data = await RegistrationService.getPersonAttributeTypes();
      setPersonAttributeTypes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load person attribute types';
      throw new Error(errorMessage);
    }
  }, []);

  // Load locations
  const loadLocations = useCallback(async (): Promise<void> => {
    try {
      const data = await RegistrationService.getLocations();
      setLocations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
      throw new Error(errorMessage);
    }
  }, []);

  // Load address hierarchy
  const loadAddressHierarchy = useCallback(async (): Promise<void> => {
    try {
      const data = await RegistrationService.getAddressHierarchy();
      setAddressHierarchy(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load address hierarchy';
      throw new Error(errorMessage);
    }
  }, []);

  // Load all configuration data
  const loadAllConfig = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadIdentifierTypes(),
        loadPersonAttributeTypes(),
        loadLocations(),
        loadAddressHierarchy(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to load registration configuration',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadIdentifierTypes, loadPersonAttributeTypes, loadLocations, loadAddressHierarchy, notification]);

  // Refresh all configuration data
  const refreshConfig = useCallback(async (): Promise<void> => {
    await loadAllConfig();
  }, [loadAllConfig]);

  // Refresh identifier types only
  const refreshIdentifierTypes = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await loadIdentifierTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh identifier types';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to refresh identifier types',
        message: errorMessage,
      });
    }
  }, [loadIdentifierTypes, notification]);

  // Refresh person attribute types only
  const refreshPersonAttributeTypes = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await loadPersonAttributeTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh person attribute types';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to refresh person attribute types',
        message: errorMessage,
      });
    }
  }, [loadPersonAttributeTypes, notification]);

  // Refresh locations only
  const refreshLocations = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await loadLocations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh locations';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to refresh locations',
        message: errorMessage,
      });
    }
  }, [loadLocations, notification]);

  // Refresh address hierarchy only
  const refreshAddressHierarchy = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await loadAddressHierarchy();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh address hierarchy';
      setError(errorMessage);
      notification.addNotification({
        type: 'error',
        title: 'Failed to refresh address hierarchy',
        message: errorMessage,
      });
    }
  }, [loadAddressHierarchy, notification]);

  // Get identifier type by UUID
  const getIdentifierTypeByUuid = useCallback((uuid: string): PatientIdentifierType | undefined => {
    return identifierTypes.find(type => type.uuid === uuid);
  }, [identifierTypes]);

  // Get person attribute type by UUID
  const getPersonAttributeTypeByUuid = useCallback((uuid: string): PersonAttributeType | undefined => {
    return personAttributeTypes.find(type => type.uuid === uuid);
  }, [personAttributeTypes]);

  // Get location by UUID
  const getLocationByUuid = useCallback((uuid: string): { uuid: string; display: string } | undefined => {
    return locations.find(location => location.uuid === uuid);
  }, [locations]);

  // Get required identifier types
  const getRequiredIdentifierTypes = useCallback((): PatientIdentifierType[] => {
    return identifierTypes.filter(type => type.required);
  }, [identifierTypes]);

  // Get required person attribute types
  const getRequiredPersonAttributeTypes = useCallback((): PersonAttributeType[] => {
    return personAttributeTypes.filter(type => type.required);
  }, [personAttributeTypes]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load configuration on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      loadAllConfig();
    }
  }, [autoLoad, loadAllConfig]);

  return {
    // State
    identifierTypes,
    personAttributeTypes,
    locations,
    addressHierarchy,
    isLoading,
    error,

    // Actions
    refreshConfig,
    refreshIdentifierTypes,
    refreshPersonAttributeTypes,
    refreshLocations,
    refreshAddressHierarchy,
    getIdentifierTypeByUuid,
    getPersonAttributeTypeByUuid,
    getLocationByUuid,
    getRequiredIdentifierTypes,
    getRequiredPersonAttributeTypes,
    clearError,
  };
};

export default useRegistrationConfig;
