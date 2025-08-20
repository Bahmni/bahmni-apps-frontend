import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  User,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';

interface useActivePractitionerResult {
  practitioner: Provider | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage the active practitioner's details
 * @returns Object containing practitioner, loading state, error state, and refetch function
 */
export const useActivePractitioner = (): useActivePractitionerResult => {
  const [activePractitioner, setActivePractitioner] = useState<Provider | null>(
    null,
  );
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();

  const fetchActivePractitioner = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setError(new Error(t('ERROR_FETCHING_USER_DETAILS')));
        return;
      }
      setActiveUser(user);
      const practitioner = await getCurrentProvider(user.uuid);
      if (!practitioner) {
        setError(new Error(t('ERROR_FETCHING_PRACTITIONERS_DETAILS')));
        return;
      }
      setActivePractitioner(practitioner);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchActivePractitioner();
  }, [fetchActivePractitioner]);

  return {
    practitioner: activePractitioner,
    user: activeUser,
    loading,
    error,
    refetch: fetchActivePractitioner,
  };
};
