import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  User,
  getFormattedError,
  useTranslation,
} from '@bahmni/services';
import { useState, useCallback, useEffect } from 'react';

interface useActivePractitionerResult {
  practitioner: Provider | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface useActivePractitionerOptions {
  /** Optional pre-fetched user to avoid redundant API calls */
  user?: User | null;
}

/**
 * Custom hook to fetch and manage the active practitioner's details
 * @param options - Optional configuration including pre-fetched user
 * @returns Object containing practitioner, loading state, error state, and refetch function
 */
export const useActivePractitioner = (
  options?: useActivePractitionerOptions,
): useActivePractitionerResult => {
  const [activePractitioner, setActivePractitioner] = useState<Provider | null>(
    null,
  );
  const [activeUser, setActiveUser] = useState<User | null>(
    options?.user ?? null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();
  const userUuid = options?.user?.uuid;

  const fetchActivePractitioner = useCallback(async () => {
    try {
      setLoading(true);

      // Use provided user or fetch if not available

      const user = options?.user ?? (await getCurrentUser());

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
  }, [options?.user, t]);

  useEffect(() => {
    fetchActivePractitioner();
  }, [fetchActivePractitioner, userUuid]); // Depend on UUID only

  return {
    practitioner: activePractitioner,
    user: activeUser,
    loading,
    error,
    refetch: fetchActivePractitioner,
  };
};
