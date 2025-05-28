import { useState, useCallback, useEffect } from 'react';
import { useNotification } from './useNotification';
import { getCurrentProvider } from '@services/providerService';
import { getFormattedError } from '@utils/common';
import { Provider } from '@types/provider';
import { User } from '@types/user';
import { getCurrentUser } from '@services/userService';

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
  const { addNotification } = useNotification();

  const fetchActivePractitioner = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setError(new Error('User not found'));
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'User not found',
        });
        return;
      }
      setActiveUser(user);
      const practitioner = await getCurrentProvider(user.uuid);
      if (!practitioner) {
        setError(new Error('Active Practitioner not found'));
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Active Practitioner not found',
        });
        return;
      }
      setActivePractitioner(practitioner);
      setError(null);
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
