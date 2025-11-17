import { getMedicationConfig } from '@bahmni/services';
import { useState, useEffect } from 'react';
import { MedicationConfig } from '../models/medicationConfig';
import { fetchMedicationOrdersMetadata } from '../services/medicationService';

interface UseMedicationConfigResult {
  medicationConfig: MedicationConfig | null;
  loading: boolean;
  error: Error | null;
}

export const useMedicationConfig = (): UseMedicationConfigResult => {
  const [medicationConfig, setMedicationConfig] =
    useState<MedicationConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMedicationConfig = async () => {
    try {
      setLoading(true);
      const medicationOrdersMetadataResponse =
        await fetchMedicationOrdersMetadata();
      const medicationJSONConfig = await getMedicationConfig();
      if (!medicationJSONConfig || !medicationOrdersMetadataResponse) {
        throw new Error('Failed to fetch medication configuration data');
      }
      setMedicationConfig({
        ...medicationOrdersMetadataResponse,
        ...medicationJSONConfig,
      });
      setLoading(false);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMedicationConfig();
  }, []);

  return {
    medicationConfig,
    loading,
    error,
  };
};

export default useMedicationConfig;
