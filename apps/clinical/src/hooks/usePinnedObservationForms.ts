import { getFormattedError, ObservationForm } from '@bahmni/services';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadPinnedForms,
  savePinnedForms,
} from '../services/pinnedFormsService';

interface UsePinnedObservationFormsOptions {
  /** User UUID required for loading and saving pinned forms */
  userUuid?: string | null;
  /** Whether available forms are currently loading */
  isFormsLoading?: boolean;
}
export function usePinnedObservationForms(
  availableForms: ObservationForm[],
  options?: UsePinnedObservationFormsOptions,
) {
  const { userUuid, isFormsLoading = false } = options ?? {};
  const [pinnedForms, setPinnedForms] = useState<ObservationForm[]>([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const availableFormsRef = useRef<ObservationForm[]>([]);
  const loadedForUserRef = useRef<string | null>(null);

  // Keep ref updated with latest forms
  useEffect(() => {
    availableFormsRef.current = availableForms;
  }, [availableForms]);

  // Reset initialization when userUuid changes
  useEffect(() => {
    if (userUuid !== loadedForUserRef.current) {
      setIsInitialLoadComplete(false);
      setPinnedForms([]);
      setError(null);
      loadedForUserRef.current = null;
    }
  }, [userUuid]);

  // Load pinned forms on mount - single source of truth
  // Only runs ONCE when forms finish loading
  useEffect(() => {
    const loadPinnedFormsData = async () => {
      if (!userUuid) {
        setIsInitialLoadComplete(true);
        loadedForUserRef.current = null;
        return;
      }

      setError(null);
      try {
        const names = await loadPinnedForms(userUuid);
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
        loadedForUserRef.current = userUuid;
      }
    };

    // Skip if already loaded or still loading forms
    if (isInitialLoadComplete || isFormsLoading) {
      return;
    }

    // Handle case when forms loading is complete
    if (!userUuid) {
      // No user - complete initialization without loading
      setIsInitialLoadComplete(true);
      loadedForUserRef.current = null;
    } else if (availableForms.length > 0) {
      // Forms available - load pinned forms
      loadPinnedFormsData();
    } else {
      // Forms loaded but empty - complete initialization
      setIsInitialLoadComplete(true);
      setPinnedForms([]);
      loadedForUserRef.current = userUuid;
    }
  }, [availableForms.length, isInitialLoadComplete, userUuid, isFormsLoading]);

  const updatePinnedForms = useCallback(
    async (newPinnedForms: ObservationForm[]) => {
      if (!userUuid) {
        const error = {
          title: 'Unable to save pinned forms',
          message:
            'User information is not available. Please try logging in again.',
        };
        setError(error);
        return;
      }

      // Update local state immediately (optimistic UI)
      setPinnedForms(newPinnedForms);
      try {
        // Save to backend asynchronously
        await savePinnedForms(
          userUuid,
          newPinnedForms.map((f) => f.name),
        );
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(formattedError);
        // Could optionally revert the optimistic update here on error
      }
    },
    [userUuid],
  );

  const isLoading = !isInitialLoadComplete;

  return { pinnedForms, updatePinnedForms, isLoading, error };
}
