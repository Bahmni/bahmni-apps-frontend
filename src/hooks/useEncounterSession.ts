import { useState, useEffect } from 'react';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { hasActiveEncounterSession, findActiveEncounterInSession } from '@services/encounterSessionService';
import { FhirEncounter } from '../types/encounter';

interface UseEncounterSessionReturn {
  hasActiveSession: boolean;
  activeEncounter: FhirEncounter | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage encounter session state
 * Determines if there's an active encounter session for the current patient
 * @returns Object containing session state and utilities
 */
export function useEncounterSession(): UseEncounterSessionReturn {
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [activeEncounter, setActiveEncounter] = useState<FhirEncounter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const patientUUID = usePatientUUID();

  const fetchSessionState = async () => {
    if (!patientUUID) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's an active session and get the encounter
      const [sessionExists, encounter] = await Promise.all([
        hasActiveEncounterSession(patientUUID),
        findActiveEncounterInSession(patientUUID)
      ]);
      
      setHasActiveSession(sessionExists);
      setActiveEncounter(encounter);
    } catch (err) {
      console.error('Error fetching encounter session state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setHasActiveSession(false);
      setActiveEncounter(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionState();
  }, [patientUUID]);

  return {
    hasActiveSession,
    activeEncounter,
    isLoading,
    error,
    refetch: fetchSessionState
  };
}
