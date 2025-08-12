import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { getLocations } from '../services/locationService';
import { OpenMRSLocation } from '../models/location';

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
  const { t } = useTranslation();

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const locations = await getLocations();
      if (!locations || locations.length === 0) {
        setError(new Error(t('ERROR_FETCHING_LOCATIONS_DETAILS')));
        return;
      }
      setLocations(locations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(t('ERROR_FETCHING_LOCATIONS_DETAILS')),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

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
