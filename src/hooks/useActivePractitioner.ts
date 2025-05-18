import { useState, useCallback, useEffect } from 'react';
import { FormattedPractitioner } from '@types/practitioner';
import { useNotification } from './useNotification';
import {
  getActivePractitioner,
  formatPractitioner,
} from '@services/practitionerService';
import { getFormattedError } from '@utils/common';

interface useActivePractitionerResult {
  practitioner: FormattedPractitioner | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage the active practitioner's details
 * @returns Object containing practitioner, loading state, error state, and refetch function
 */
export const useActivePractitioner = (): useActivePractitionerResult => {
  const [activePractitioner, setActivePractitioner] =
    useState<FormattedPractitioner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchActivePractitioner = useCallback(async () => {
    try {
      setLoading(true);
      const practitioner = await getActivePractitioner();
      if (!practitioner) {
        setError(new Error('Active Practitioner not found'));
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Active Practitioner not found',
        });
        return;
      }
      const formattedPractitioner = formatPractitioner(practitioner);
      setActivePractitioner(formattedPractitioner);
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
    loading,
    error,
    refetch: fetchActivePractitioner,
  };
};
