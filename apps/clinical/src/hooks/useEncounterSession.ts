import {
  Provider,
  resolveEncounterMatchDecision,
  canResumeOwnInSessionEncounter,
  MatchReasonCode,
  getUserLoginLocation,
  getEncounterSessionSnapshot,
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchReason, setMatchReason] = useState<MatchReasonCode[]>([]);

  const patientUUID = usePatientUUID();
  const practitionerUUID = practitioner?.uuid;

  const fetchSessionState = async (signal: { ignored: boolean }) => {
    if (!patientUUID || !practitionerUUID || !encounterTypeUUID) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason([]);
      setError(null);
      return;
    }

    // Resolve login location inside the fetch so it reads a fresh value each call
    let loginLocationUUID: string | undefined;
    try {
      loginLocationUUID = getUserLoginLocation().uuid;
    } catch {
      // location cookie unavailable — location check will be skipped in mapper
    }

    // Seed immediately from the global store when it already reflects a MATCHED
    // session. This lets the consultation pad inherit an encounter created by a
    // dashboard widget action (e.g. mark-condition-inactive) without waiting for
    // the OpenMRS FHIR search index to catch up to the freshly created encounter.
    const storeState = getEncounterSessionSnapshot();
    if (
      storeState.matchReasons.includes('MATCHED') &&
      storeState.activeEncounter?.id &&
      storeState.activeEncounter.subject?.reference?.endsWith(patientUUID) &&
      !signal.ignored
    ) {
      setHasActiveSession(true);
      setActiveEncounter(storeState.activeEncounter);
      setIsPractitionerMatch(true);
      setMatchReason(storeState.matchReasons);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const decision = await resolveEncounterMatchDecision(
        patientUUID,
        practitionerUUID,
        loginLocationUUID,
        encounterTypeUUID,
      );

      if (signal.ignored) return;

      const isResumableSession = canResumeOwnInSessionEncounter(decision);

      setHasActiveSession(isResumableSession);
      setActiveEncounter(decision.encounter);
      setIsPractitionerMatch(isResumableSession);
      setMatchReason(decision.reasons);
    } catch (err) {
      if (signal.ignored) return;
      setError(
        err instanceof Error ? err.message : 'Failed to load encounter session',
      );
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason(['NO_ACTIVE_ENCOUNTER']);
    } finally {
      if (!signal.ignored) setIsLoading(false);
    }
  };

  useEffect(() => {
    const signal = { ignored: false };

    if (practitioner?.uuid) {
      setHasActiveSession(false);
      setActiveEncounter(null);
      setIsPractitionerMatch(false);
      setMatchReason([]);
      setError(null);
    }
    fetchSessionState(signal);

    return () => {
      signal.ignored = true;
    };
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
    refetch: () => fetchSessionState({ ignored: false }),
  };
}
