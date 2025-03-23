import { useState, useEffect } from 'react';
import { FhirPatient } from '@types/patient';
import { getPatientById } from '@services/patientService';

interface UsePatientResult {
  patient: FhirPatient | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePatient = (patientUUID: string): UsePatientResult => {
  const [patient, setPatient] = useState<FhirPatient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientById(patientUUID);
      setPatient(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('An unknown error occurred'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientUUID) {
      fetchPatient();
    }
  }, [patientUUID]);

  return { patient, loading, error, refetch: fetchPatient };
};
