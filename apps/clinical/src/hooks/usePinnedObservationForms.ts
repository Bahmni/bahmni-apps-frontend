import {
  getFormattedError,
  ObservationForm,
} from '@bahmni-frontend/bahmni-services';
import { useState, useEffect, useRef } from 'react';
import {
  loadPinnedForms,
  savePinnedForms,
} from '../services/pinnedFormsService';
import useObservationFormsSearch from './useObservationFormsSearch';

export function usePinnedObservationForms() {
  const { forms: availableForms, isLoading: isFormsLoading } =
    useObservationFormsSearch('');
  const [pinnedForms, setPinnedForms] = useState<ObservationForm[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const availableFormsRef = useRef<ObservationForm[]>([]);

  // Keep ref updated with latest forms
  useEffect(() => {
    availableFormsRef.current = availableForms;
  }, [availableForms]);

  // Load pinned forms on mount - single source of truth
  // Only runs ONCE when forms finish loading
  useEffect(() => {
    const loadPinnedFormsData = async () => {
      setError(null);
      try {
        const names = await loadPinnedForms();
        const currentForms = availableFormsRef.current;
        if (names.length > 0 && currentForms.length > 0) {
          const matchedForms = currentForms.filter((form) =>
            names.includes(form.name),
          );
          setPinnedForms(matchedForms);
        } else {
          setPinnedForms([]);
        }
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
        setPinnedForms([]);
      } finally {
        setIsInitialLoadComplete(true);
      }
    };

    // Only load ONCE when forms finish loading
    if (!isFormsLoading && !isInitialLoadComplete) {
      loadPinnedFormsData();
    }
  }, [isFormsLoading, isInitialLoadComplete]);

  const updatePinnedForms = async (newPinnedForms: ObservationForm[]) => {
    // Update local state immediately (optimistic UI)
    setPinnedForms(newPinnedForms);
    try {
      // Save to backend asynchronously
      await savePinnedForms(newPinnedForms.map((f) => f.name));
    } catch (err) {
      const formattedError = getFormattedError(err);
      setError(formattedError);
      // Could optionally revert the optimistic update here on error
    }
  };

  const isLoading = isFormsLoading || !isInitialLoadComplete;

  return { pinnedForms, updatePinnedForms, isLoading, error };
}
