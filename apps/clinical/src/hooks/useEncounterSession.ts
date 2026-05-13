import {
  Provider,
  resolveEncounterMatchDecision,
  isOwnInSessionEncounter,
  MatchReasonCode,
  getUserLoginLocation,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { Encounter } from 'fhir/r4';
import { useEffect, useState } from 'react';

export interface UseEncounterSessionOptions {
  practitioner: Provider | null;
  encounterTypeUUID?: string;
}

export interface UseEncounterSessionReturn {
  hasActiveSession: boolean;
  activeEncounter: Encounter | null;
  isPractitionerMatch: boolean;
  matchReason: MatchReasonCode[];
  editActiveEncounter: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEncounterSession(
  options: UseEncounterSessionOptions,
): UseEncounterSessionReturn {
  const { practitioner, encounterTypeUUID } = options;

  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [activeEncounter, setActiveEncounter] = useState<Encounter | null>(
    null,
  );
  const [isPractitionerMatch, setIsPractitionerMatch] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [matchReason, setMatchReason] = useState<MatchReasonCode[]>([]);

  const patientUUID = usePatientUUID();
  const practitionerUUID = practitioner?.uuid;

  let locationUUID = '';
  try {
    locationUUID = getUserLoginLocation().uuid;
  } catch {
    // location cookie unavailable
  }

  const fetchSessionState = async () => {
    if (!patientUUID || !practitionerUUID || !encounterTypeUUID) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const decision = await resolveEncounterMatchDecision(
        patientUUID,
        practitionerUUID,
        locationUUID,
        encounterTypeUUID,
      );

      const sessionExists = isOwnInSessionEncounter(decision);

      setHasActiveSession(sessionExists);
      setActiveEncounter(decision.encounter);
      setIsPractitionerMatch(sessionExists);
      setMatchReason(decision.reasons);
    } catch {
      setError(null);
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason(['NO_ACTIVE_ENCOUNTER']);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (practitioner?.uuid) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason([]);
      setError(null);
    }
    fetchSessionState();
  }, [patientUUID, practitioner?.uuid, encounterTypeUUID]); // eslint-disable-line react-hooks/exhaustive-deps

  const editActiveEncounter = hasActiveSession && isPractitionerMatch;

  return {
    hasActiveSession,
    activeEncounter,
    isPractitionerMatch,
    matchReason,
    editActiveEncounter,
    isLoading,
    error,
    refetch: fetchSessionState,
  };
}
