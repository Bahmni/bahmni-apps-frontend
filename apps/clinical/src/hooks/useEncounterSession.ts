import { useEffect, useState } from 'react';
import { Encounter } from 'fhir/r4';
import {
  Provider,
  resolveEncounterMatchDecision,
  EncounterMatchDecision,
  MatchReasonCode,
  getUserLoginLocation,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';

export interface UseEncounterSessionOptions {
  practitioner: Provider | null;
  encounterTypeUUID?: string;
}

export interface UseEncounterSessionReturn {
  hasActiveSession: boolean;
  activeEncounter: Encounter | null;
  isPractitionerMatch: boolean;
  matchReason: MatchReasonCode | null;
  editActiveEncounter: boolean;
  canEditEncounter: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEncounterSession(
  options: UseEncounterSessionOptions,
): UseEncounterSessionReturn {
  const { practitioner, encounterTypeUUID } = options;
  const [matchDecision, setMatchDecision] = useState<EncounterMatchDecision | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setMatchDecision(null);
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
      setMatchDecision(decision);
    } catch {
      setError(null);
      setMatchDecision({
        matched: false,
        encounter: null,
        reason: 'NO_ACTIVE_ENCOUNTER',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (practitioner?.uuid) {
      setMatchDecision(null);
      setError(null);
    }
    fetchSessionState();
  }, [patientUUID, practitioner?.uuid, encounterTypeUUID]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = {
    hasActiveSession: matchDecision?.matched ?? false,
    activeEncounter: matchDecision?.encounter ?? null,
    isPractitionerMatch:
      matchDecision?.reason === 'MATCHED' ||
      matchDecision?.reason === 'SESSION_EXPIRED' ||
      matchDecision?.reason === 'LOCATION_MISMATCH',
    matchReason: matchDecision?.reason ?? null,
    editActiveEncounter:
      matchDecision?.reason === 'MATCHED' ||
      matchDecision?.reason === 'LOCATION_MISMATCH',
    canEditEncounter:
      matchDecision?.reason === 'MATCHED' ||
      matchDecision?.reason === 'LOCATION_MISMATCH' ||
      matchDecision?.reason === 'PROVIDER_MISMATCH',
    isLoading,
    error,
    refetch: fetchSessionState,
  };

  // TODO: remove before merge
  console.log('[useEncounterSession]', {
    patientUUID,
    practitionerUUID,
    locationUUID,
    encounterTypeUUID,
    matchReason: result.matchReason,
    hasActiveSession: result.hasActiveSession,
    editActiveEncounter: result.editActiveEncounter,
    canEditEncounter: result.canEditEncounter,
    isPractitionerMatch: result.isPractitionerMatch,
    encounterId: result.activeEncounter?.id ?? null,
    isLoading: result.isLoading,
  });

  return result;
}
