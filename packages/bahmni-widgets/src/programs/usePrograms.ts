import { getPatientPrograms, useTranslation } from '@bahmni/services';
import { useState, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { formattedProgram } from './model';
import { mapPrograms } from './utils';

/**
 * Hook to fetch and manage programs for the current patient
 * @returns Object containing programs, loading state, and error state
 */
export default function usePrograms() {
  const [programs, setPrograms] = useState<formattedProgram[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  useEffect(() => {
    async function fetchPrograms() {
      if (!patientUUID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const response = await getPatientPrograms(patientUUID);
        const mappedPrograms = mapPrograms([
          ...response.activePrograms,
          ...response.endedPrograms,
        ]);

        setPrograms(mappedPrograms);
      } catch (error) {
        setHasError(true);
        setPrograms([]);
        addNotification({
          title: t('ERROR_DEFAULT_TITLE'),
          message: error instanceof Error ? error.message : 'An error occurred',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrograms();
  }, [patientUUID, t, addNotification]);

  return { programs, isLoading, hasError };
}
