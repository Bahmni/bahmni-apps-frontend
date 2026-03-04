import {
  getCurrentProvider,
  getCurrentUser,
  Provider,
  User,
  getFormattedError,
} from '@bahmni/services';
import React, {
  ReactNode,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { ActivePractitionerContext } from './ActivePractitionerContext';

interface ActivePractitionerProviderProps {
  children: ReactNode;
}

export const ActivePractitionerProvider: React.FC<
  ActivePractitionerProviderProps
> = ({ children }) => {
  const [practitioner, setPractitioner] = useState<Provider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivePractitioner = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      // Fetch current user
      const currentUser = await getCurrentUser();

      // Check if request was aborted
      if (signal?.aborted) return;

      if (!currentUser) {
        throw new Error('ERROR_FETCHING_USER_DETAILS');
      }
      setUser(currentUser);

      // Fetch current provider
      const currentProvider = await getCurrentProvider(currentUser.uuid);

      // Check if request was aborted
      if (signal?.aborted) return;

      if (!currentProvider) {
        throw new Error('ERROR_FETCHING_PRACTITIONERS_DETAILS');
      }
      setPractitioner(currentProvider);
      setError(null);
    } catch (err) {
      // Don't update state if request was aborted
      if (signal?.aborted) return;

      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      // Don't update state if request was aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    fetchActivePractitioner(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchActivePractitioner]);

  const value = useMemo(
    () => ({
      practitioner,
      user,
      loading,
      error,
      refetch: () => fetchActivePractitioner(),
    }),
    [practitioner, user, loading, error, fetchActivePractitioner],
  );

  return (
    <ActivePractitionerContext.Provider value={value}>
      {children}
    </ActivePractitionerContext.Provider>
  );
};

ActivePractitionerProvider.displayName = 'ActivePractitionerProvider';
