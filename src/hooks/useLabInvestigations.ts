import { useState, useEffect } from 'react';
import { FormattedLabTest } from '../types/labInvestigation';
import {
  getLabTests,
  formatLabTests,
} from '../services/labInvestigationService';
import { usePatientUUID } from './usePatientUUID';

/**
 * Hook to fetch and manage lab investigations for the current patient
 * @returns Object containing lab tests, loading state, and error state
 */
export default function useLabInvestigations() {
  const [labTests, setLabTests] = useState<FormattedLabTest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const patientUUID = usePatientUUID();

  useEffect(() => {
    async function fetchLabInvestigations() {
      if (!patientUUID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsError(false);

      try {
        // Fetch raw lab tests
        const rawLabTests = await getLabTests(patientUUID);

        // Format the lab tests
        const formattedTests = formatLabTests(rawLabTests);

        setLabTests(formattedTests);
      } catch (err) {
        console.error('Error fetching lab investigations:', err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLabInvestigations();
  }, [patientUUID]);

  return { labTests, isLoading, isError };
}
