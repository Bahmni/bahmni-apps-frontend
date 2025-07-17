import { useState, useEffect } from 'react';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { hasActiveEncounterSession, findActiveEncounterInSession } from '@services/encounterSessionService';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
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
/**
 * Checks if an encounter belongs to the specified practitioner
 * @param encounter - The encounter to check
 * @param practitionerUUID - The practitioner UUID to match against
 * @returns boolean indicating if the encounter belongs to the practitioner
 */
function doesEncounterBelongToPractitioner(
  encounter: FhirEncounter | null,
  practitionerUUID: string | undefined
): boolean {
  if (!encounter || !practitionerUUID) {
    return false;
  }

  return encounter.participant?.some(participant => {
    const individual = participant.individual;
    if (!individual?.reference) {
      return false;
    }

    const practitionerRef = individual.reference;

    // Check multiple possible formats
    const refMatch = (
      practitionerRef === `Practitioner/${practitionerUUID}` ||
      practitionerRef === practitionerUUID ||
      practitionerRef.endsWith(`/${practitionerUUID}`) ||
      practitionerRef.split('/').pop() === practitionerUUID
    );

    // Check identifier if available
    const identifierMatch = individual.identifier?.value === practitionerUUID;

    return refMatch || identifierMatch;
  }) || false;
}

export function useEncounterSession(): UseEncounterSessionReturn {
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [activeEncounter, setActiveEncounter] = useState<FhirEncounter | null>(null);
  const [isPractitionerMatch, setIsPractitionerMatch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const patientUUID = usePatientUUID();
  const { practitioner } = useEncounterDetailsStore();

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
      
      // Get practitioner UUID for session filtering
      const practitionerUUID = practitioner?.uuid;
      
      // First, check for any active session without practitioner filtering
      const [anySessionExists, anyEncounter] = await Promise.all([
        hasActiveEncounterSession(patientUUID),
        findActiveEncounterInSession(patientUUID)
      ]);
      
      // Check if the encounter belongs to the current practitioner
      const practitionerMatches = doesEncounterBelongToPractitioner(anyEncounter, practitionerUUID);
      
      // Set session state - hasActiveSession is true if ANY encounter exists within duration
      setHasActiveSession(anySessionExists);
      setActiveEncounter(anyEncounter);
      setIsPractitionerMatch(practitionerMatches);
    } catch (err) {
      console.error('Error fetching encounter session state:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      // Default to "New Consultation" (safer) on error
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionState();
  }, [patientUUID, practitioner?.uuid]);

  return {
    hasActiveSession,
    activeEncounter,
    isPractitionerMatch,
    isLoading,
    error,
    refetch: fetchSessionState
  };
}
