import { useState, useEffect } from 'react';
import {
  getPatientLabInvestigations,
  FormattedLabTest,
} from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from '../hooks/usePatientUUID';

/**
 * Hook to fetch and manage lab investigations for the current patient
 * @returns Object containing lab tests, loading state, and error state
 */
export default function useLabInvestigations() {
  const [labTests, setLabTests] = useState<FormattedLabTest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const patientUUID = usePatientUUID();

  useEffect(() => {
    async function fetchLabInvestigations() {
      if (!patientUUID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const formattedTests = await getPatientLabInvestigations(patientUUID);

        setLabTests(formattedTests);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLabInvestigations();
  }, [patientUUID]);

  return { labTests, isLoading, hasError };
}
