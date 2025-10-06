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
  const { forms: availableForms, isLoading: isFormsLoading } =
    useObservationFormsSearch('');
  const [pinnedForms, setPinnedForms] = useState<ObservationForm[]>([]);
  const [pinnedFormNames, setPinnedFormNames] = useState<string[] | null>(null);
  const [isPinnedNamesLoading, setIsPinnedNamesLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );

  // Load pinned form names immediately (parallel to forms loading)
  useEffect(() => {
    const loadPinnedFormNames = async () => {
      setIsPinnedNamesLoading(true);
      setError(null);
      try {
        const names = await loadPinnedForms();
        setPinnedFormNames(names);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
        setPinnedFormNames([]); // Set empty array on error to avoid infinite loading
      } finally {
        setIsPinnedNamesLoading(false);
      }
    };
    loadPinnedFormNames();
  }, []);

  // Match pinned form names with available forms when both are ready
  useEffect(() => {
    if (availableForms.length > 0 && pinnedFormNames !== null) {
      if (pinnedFormNames.length > 0) {
        const matchedForms = availableForms.filter((form) =>
          pinnedFormNames.includes(form.name),
        );
        setPinnedForms(matchedForms);
      } else {
        // If no pinned forms, set empty array
        setPinnedForms([]);
      }
    }
  }, [availableForms, pinnedFormNames]);

  // Overall loading state: true if either source is still loading
  const isLoading = isPinnedNamesLoading || isFormsLoading;

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
