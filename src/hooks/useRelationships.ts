import { useState, useEffect, useCallback, useMemo } from 'react';
import { RegistrationService } from '../services/registration/registrationService';
import { useNotification } from './useNotification';
import type {
  Relationship,
  RelationshipType,
  CreateRelationshipRequest,
  RelationshipOptions,
  RelationshipSearchResponse,
} from '../types/registration/relationships';

/**
 * Custom hook for managing patient relationships
 * @param patientUuid - UUID of the patient
 * @param options - Configuration options
 * @returns Relationship management interface
 */
export function useRelationships(
  patientUuid: string,
  options: RelationshipOptions = {}
) {
  const { addNotification } = useNotification();
  const { autoLoad = false, includeInactive = false } = options;

  // State
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typesError, setTypesError] = useState<string | null>(null);

  /**
   * Load patient relationships
   */
  const loadRelationships = useCallback(async () => {
    if (!patientUuid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await RegistrationService.getPatientRelationships(patientUuid);
      setRelationships([...response.results]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to load patient relationships',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientUuid, addNotification]);

  /**
   * Load relationship types
   */
  const loadRelationshipTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    setTypesError(null);

    try {
      const types = await RegistrationService.getRelationshipTypes();
      setRelationshipTypes(types);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTypesError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Failed to load relationship types',
        message: errorMessage,
      });
    } finally {
      setIsLoadingTypes(false);
    }
  }, [addNotification]);

  /**
   * Add a new relationship
   */
  const addRelationship = useCallback(async (
    data: CreateRelationshipRequest
  ): Promise<Relationship | null> => {
    // Validate required fields
    if (!data.personB.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid relationship data',
        message: 'Person B UUID is required',
      });
      return null;
    }

    try {
      const newRelationship = await RegistrationService.createRelationship(data);

      // Refresh relationships list
      await loadRelationships();

      addNotification({
        type: 'success',
        title: 'Relationship added successfully',
        message: '',
      });

      return newRelationship;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addNotification({
        type: 'error',
        title: 'Failed to add relationship',
        message: errorMessage,
      });
      return null;
    }
  }, [loadRelationships, addNotification]);

  /**
   * Remove a relationship
   */
  const removeRelationship = useCallback(async (
    relationshipUuid: string
  ): Promise<boolean> => {
    if (!relationshipUuid.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid relationship UUID',
        message: '',
      });
      return false;
    }

    try {
      await RegistrationService.deleteRelationship(relationshipUuid);

      // Refresh relationships list
      await loadRelationships();

      addNotification({
        type: 'success',
        title: 'Relationship removed successfully',
        message: '',
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addNotification({
        type: 'error',
        title: 'Failed to remove relationship',
        message: errorMessage,
      });
      return false;
    }
  }, [loadRelationships, addNotification]);

  /**
   * Get relationship type by UUID
   */
  const getRelationshipTypeByUuid = useCallback((uuid: string): RelationshipType | undefined => {
    return relationshipTypes.find(type => type.uuid === uuid);
  }, [relationshipTypes]);

  /**
   * Get active relationships (not ended)
   */
  const getActiveRelationships = useCallback((): Relationship[] => {
    return relationships.filter(rel => !rel.endDate);
  }, [relationships]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadRelationships(),
      loadRelationshipTypes(),
    ]);
  }, [loadRelationships, loadRelationshipTypes]);

  // Auto-load data on mount if enabled
  useEffect(() => {
    if (autoLoad && patientUuid) {
      refresh();
    }
  }, [autoLoad, patientUuid, refresh]);

  // Memoized return value for performance
  const returnValue = useMemo(() => ({
    // Data
    relationships,
    relationshipTypes,

    // Loading states
    isLoading,
    isLoadingTypes,

    // Error states
    error,
    typesError,

    // Actions
    loadRelationships,
    loadRelationshipTypes,
    addRelationship,
    removeRelationship,
    refresh,

    // Helper methods
    getRelationshipTypeByUuid,
    getActiveRelationships,
  }), [
    relationships,
    relationshipTypes,
    isLoading,
    isLoadingTypes,
    error,
    typesError,
    loadRelationships,
    loadRelationshipTypes,
    addRelationship,
    removeRelationship,
    refresh,
    getRelationshipTypeByUuid,
    getActiveRelationships,
  ]);

  return returnValue;
}

export default useRelationships;
