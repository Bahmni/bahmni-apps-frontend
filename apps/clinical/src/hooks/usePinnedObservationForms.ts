import {
  getFormattedError,
  ObservationForm,
} from '@bahmni-frontend/bahmni-services';
import { useState, useEffect } from 'react';
import {
  loadPinnedForms,
  savePinnedForms,
} from '../services/pinnedFormsService';
import useObservationFormsSearch from './useObservationFormsSearch';

export function usePinnedObservationForms() {
  const { forms: availableForms } = useObservationFormsSearch('');
  const [pinnedForms, setPinnedForms] = useState<ObservationForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    const initializePinnedForms = async () => {
      setIsLoading(true);
      setError(null);
      if (availableForms.length === 0) {
        setIsLoading(false);
        return;
      }
      try {
        const pinnedFormNames = await loadPinnedForms();
        const matchedForms = availableForms.filter((form) =>
          pinnedFormNames.includes(form.name),
        );
        setPinnedForms(matchedForms);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
      } finally {
        setIsLoading(false);
      }
    };
    initializePinnedForms();
  }, [availableForms]);

  const updatePinnedForms = async (newPinnedForms: ObservationForm[]) => {
    setPinnedForms(newPinnedForms);
    try {
      await savePinnedForms(newPinnedForms.map((f) => f.name));
    } catch (err) {
      const formattedError = getFormattedError(err);
      setError(formattedError);
    }
  };

  return { pinnedForms, updatePinnedForms, isLoading, error };
}
