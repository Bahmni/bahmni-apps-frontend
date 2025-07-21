import { useState, useEffect } from 'react';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { findActiveEncounterInSession } from '@services/encounterSessionService';
import { FhirEncounter } from '../types/encounter';

interface UseEncounterSessionReturn {
  hasActiveSession: boolean;
  activeEncounter: FhirEncounter | null;
  isPractitionerMatch: boolean;
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
  const [isPractitionerMatch, setIsPractitionerMatch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Start with false to not block UI
  const [error, setError] = useState<string | null>(null);

  const patientUUID = usePatientUUID();
  const { practitioner } = useActivePractitioner();
  

  const fetchSessionState = async () => {
    if (!patientUUID) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setIsLoading(false);
      return;
    }

    // Get practitioner UUID for session filtering
    const practitionerUUID = practitioner?.uuid;
    
    // Only proceed if we have a practitioner UUID
    if (!practitionerUUID) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use setTimeout to make this async and not block the UI
    setTimeout(async () => {
      try {
        // Try to find active encounter, but with timeout
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 5000); // 5 second timeout
        });

        // Find active encounter for current patient and practitioner (server-side filtering)
        const encounterPromise = findActiveEncounterInSession(patientUUID, practitionerUUID);
        
        try {
          const encounter = await Promise.race([encounterPromise, timeoutPromise]);
          const sessionExists = encounter !== null;

          // Since server filters by practitioner, if we get an encounter, it belongs to current practitioner
          const practitionerMatches = sessionExists;

          // Set session state
          setHasActiveSession(sessionExists);
          setActiveEncounter(encounter);
          setIsPractitionerMatch(practitionerMatches);

        } catch (sessionError) {
          // Default to "New Consultation" if session check fails
          setHasActiveSession(false);
          setActiveEncounter(null);
          setIsPractitionerMatch(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        // Default to "New Consultation" (safer) on error
        setHasActiveSession(false);
        setActiveEncounter(null);
        setIsPractitionerMatch(false);
      } finally {
        setIsLoading(false);
      }
    }, 0); // Execute immediately but asynchronously
  };

  useEffect(() => {
    // Reset state when practitioner changes to prevent stale data
    if (practitioner?.uuid) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setError(null);
    }
    
    fetchSessionState();
  }, [patientUUID, practitioner?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    hasActiveSession,
    activeEncounter,
    isPractitionerMatch,
    isLoading,
    error,
    refetch: fetchSessionState
  };
}
