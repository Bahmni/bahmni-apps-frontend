import { useState, useEffect } from 'react';
import { LabTestsByDate, FormattedLabTest } from '../types/labInvestigation';
import { getPatientLabTestsByDate } from '../services/labInvestigationService';
import { usePatientUUID } from './usePatientUUID';

/**
 * Hook to fetch and manage lab investigations for the current patient
 * @returns Object containing lab investigations, formatted lab tests, and loading state
 */
export default function useLabInvestigations() {
  const [labInvestigations, setLabInvestigations] = useState<LabTestsByDate[]>(
    [],
  );
  const [formattedLabTests, setFormattedLabTests] = useState<
    FormattedLabTest[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const patientUUID = usePatientUUID();

  useEffect(() => {
    async function fetchLabInvestigations() {
      if (!patientUUID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const labTests = await getPatientLabTestsByDate(patientUUID);
        setLabInvestigations(labTests);

        // Extract all formatted tests from the grouped structure
        const allFormattedTests = labTests.flatMap(
          (dateGroup) => dateGroup.tests,
        );
        setFormattedLabTests(allFormattedTests);
      } catch (error) {
        console.error('Error fetching lab investigations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLabInvestigations();
  }, [patientUUID]);

  return { labInvestigations, formattedLabTests, isLoading };
}
