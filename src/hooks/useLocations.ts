import { useState, useCallback, useEffect } from 'react';
import { useNotification } from './useNotification';
import { getFormattedError } from '@utils/common';
import { getLocations } from '@services/locationService';
import { OpenMRSLocation } from '@types/location';

interface UseLocationsResult {
  locations: OpenMRSLocation[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage locations from the API
 * @returns Object containing locations, loading state, error state, and refetch function
 */
export const useLocations = (): UseLocationsResult => {
  const [locations, setLocations] = useState<OpenMRSLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const locations = await getLocations();
      setLocations(locations);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations: locations,
    loading: loading,
    error: error,
    refetch: fetchLocations,
  };
};
