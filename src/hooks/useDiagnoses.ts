import { useState, useEffect } from 'react';
import { FormattedDiagnosis, DiagnosesByDate } from '@/types/diagnosis';
import {
  getDiagnoses,
  formatDiagnoses,
  groupDiagnosesByDateAndRecorder,
} from '@/services/diagnosisService';
import { usePatientUUID } from './usePatientUUID';

/**
 * Hook to fetch and manage diagnoses for the current patient
 * @returns Object containing diagnoses, loading state, and error state
 */
export default function useDiagnoses() {
  const [diagnoses, setDiagnoses] = useState<FormattedDiagnosis[]>([]);
  const [diagnosesByDate, setDiagnosesByDate] = useState<DiagnosesByDate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const patientUUID = usePatientUUID();

  useEffect(() => {
    async function fetchDiagnoses() {
      if (!patientUUID) {
        console.log('No patientUUID available');
        setIsLoading(false);
        return;
      }

      console.log('Fetching diagnoses for patient:', patientUUID);

      setIsLoading(true);
      setIsError(false);

      try {
        // Fetch raw diagnoses
        const rawDiagnoses = await getDiagnoses(patientUUID);
        console.log('Raw Diagnoses:', rawDiagnoses);
        console.log('Raw Diagnoses length:', rawDiagnoses.length);
        
        // Format the diagnoses
        const formattedDiagnoses = formatDiagnoses(rawDiagnoses);
        console.log('Formatted Diagnoses:', formattedDiagnoses);
        console.log('Formatted Diagnoses length:', formattedDiagnoses.length);
        setDiagnoses(formattedDiagnoses);

        // Group diagnoses by date and recorder
        const groupedDiagnoses = groupDiagnosesByDateAndRecorder(formattedDiagnoses);
        console.log('Grouped Diagnoses:', groupedDiagnoses);
        console.log('Grouped Diagnoses length:', groupedDiagnoses.length);
        setDiagnosesByDate(groupedDiagnoses);
      } catch (err) {
        console.error('Error fetching diagnoses:', err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiagnoses();
  }, [patientUUID]);

  return { diagnoses, diagnosesByDate, isLoading, isError };
}
