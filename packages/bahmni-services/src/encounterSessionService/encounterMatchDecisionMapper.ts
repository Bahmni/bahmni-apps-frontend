import { Encounter } from 'fhir/r4';
import { getActiveVisit } from '../encounterService';
import {
  searchEncounters,
  getEncounterSessionDuration,
} from './encounterSessionService';

export type MatchReasonCode =
  | 'MATCHED'
  | 'NO_ACTIVE_VISIT'
  | 'NO_ACTIVE_ENCOUNTER'
  | 'SESSION_EXPIRED'
  | 'PROVIDER_MISMATCH'
  | 'LOCATION_MISMATCH'
  | 'MULTIPLE_ENCOUNTERS_FOUND';

export interface EncounterMatchDecision {
  matched: boolean;
  encounter: Encounter | null;
  reasons: MatchReasonCode[];
}

export const MATCH_REASON_MESSAGES: Record<MatchReasonCode, string> = {
  MATCHED: 'Encounter matched - resuming previous consultation',
  NO_ACTIVE_VISIT: 'No active visit found for this patient',
  NO_ACTIVE_ENCOUNTER:
    'No consultation found for this patient in the active visit',
  SESSION_EXPIRED:
    'Your previous session has expired - starting a new consultation',
  PROVIDER_MISMATCH:
    'Another provider started a consultation - this will create a new one',
  LOCATION_MISMATCH:
    'You started an encounter at a different location - this will create a new one',
  MULTIPLE_ENCOUNTERS_FOUND:
    'Multiple active consultations found - please contact administrator',
};

function checkLocationMatch(
  encounter: Encounter,
  loginLocationUUID: string,
): boolean {
  const encounterLocations = encounter.location ?? [];
  return encounterLocations.some(
    (loc) => loc.location?.reference?.split('/')[1] === loginLocationUUID,
  );
}

function filterEncountersByVisit(
  encounters: Encounter[],
  visitId: string,
): Encounter[] {
  return encounters.filter(
    (enc) => enc.partOf?.reference?.split('/')[1] === visitId,
  );
}

export async function resolveEncounterMatchDecision(
  patientUUID: string,
  practitionerUUID: string,
  locationUUID: string,
  encounterTypeUUID?: string,
): Promise<EncounterMatchDecision> {
  try {
    // Step 1: Check if patient has an active visit
    const activeVisit = await getActiveVisit(patientUUID);
    if (!activeVisit) {
      return { matched: false, encounter: null, reasons: ['NO_ACTIVE_VISIT'] };
    }

    const activeVisitId = activeVisit.id!;
    const sessionDuration = await getEncounterSessionDuration();
    const sessionStartTime = new Date(Date.now() - sessionDuration * 60 * 1000);
    const lastUpdatedParam = `ge${sessionStartTime.toISOString()}`;

    // Step 2: Run all searches in parallel to collect all findings
    const [inSessionOwn, allTimeOwn, inSessionAny] = await Promise.all([
      searchEncounters({
        patient: patientUUID,
        _tag: 'encounter',
        _lastUpdated: lastUpdatedParam,
        participant: practitionerUUID,
        type: encounterTypeUUID,
      }),
      searchEncounters({
        patient: patientUUID,
        _tag: 'encounter',
        participant: practitionerUUID,
        type: encounterTypeUUID,
      }),
      searchEncounters({
        patient: patientUUID,
        _tag: 'encounter',
        _lastUpdated: lastUpdatedParam,
        type: encounterTypeUUID,
      }),
    ]);

    // Filter all results to only encounters belonging to the active visit
    const inSessionOwnInVisit = filterEncountersByVisit(inSessionOwn, activeVisitId);
    const allTimeOwnInVisit = filterEncountersByVisit(allTimeOwn, activeVisitId);
    const inSessionAnyInVisit = filterEncountersByVisit(inSessionAny, activeVisitId);

    // Derive distinct encounter groups
    const inSessionOwnIds = new Set(inSessionOwnInVisit.map((e) => e.id));

    // SESSION_EXPIRED = found all-time for this practitioner but NOT in-session
    const sessionExpiredEncounters = allTimeOwnInVisit.filter(
      (e) => !inSessionOwnIds.has(e.id),
    );

    // PROVIDER_MISMATCH = found in-session for any provider but NOT this practitioner
    const otherProviderEncounters = inSessionAnyInVisit.filter(
      (e) => !inSessionOwnIds.has(e.id),
    );

    // Build reasons array
    const reasons: MatchReasonCode[] = [];
    let primaryEncounter: Encounter | null = null;

    // Check in-session encounters for this practitioner
    if (inSessionOwnInVisit.length > 1) {
      // Multiple active encounters found — error state, return immediately
      return {
        matched: false,
        encounter: inSessionOwnInVisit[0],
        reasons: ['MULTIPLE_ENCOUNTERS_FOUND'],
      };
    } else if (inSessionOwnInVisit.length === 1) {
      const locationMatches = checkLocationMatch(
        inSessionOwnInVisit[0],
        locationUUID,
      );
      if (locationMatches) {
        return {
          matched: true,
          encounter: inSessionOwnInVisit[0],
          reasons: ['MATCHED'],
        };
      }
      reasons.push('LOCATION_MISMATCH');
      primaryEncounter = inSessionOwnInVisit[0];
    }

    // Check SESSION_EXPIRED (encounter exists but outside session window)
    if (sessionExpiredEncounters.length > 0) {
      reasons.push('SESSION_EXPIRED');
      if (!reasons.includes('LOCATION_MISMATCH')) {
        const locationMatches = checkLocationMatch(
          sessionExpiredEncounters[0],
          locationUUID,
        );
        if (!locationMatches) reasons.push('LOCATION_MISMATCH');
      }
      if (!primaryEncounter) primaryEncounter = sessionExpiredEncounters[0];
    }

    // Check PROVIDER_MISMATCH (another provider's in-session encounter)
    if (otherProviderEncounters.length > 0) {
      reasons.push('PROVIDER_MISMATCH');
      if (!reasons.includes('LOCATION_MISMATCH')) {
        const locationMatches = checkLocationMatch(
          otherProviderEncounters[0],
          locationUUID,
        );
        if (!locationMatches) reasons.push('LOCATION_MISMATCH');
      }
      if (!primaryEncounter) primaryEncounter = otherProviderEncounters[0];
    }

    if (reasons.length === 0) {
      return {
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      };
    }

    return { matched: false, encounter: primaryEncounter, reasons };
  } catch (error) {
    console.error(
      'Error in resolveEncounterMatchDecision:',
      error instanceof Error ? error.message : error,
    );
    return {
      matched: false,
      encounter: null,
      reasons: ['NO_ACTIVE_ENCOUNTER'],
    };
  }
}
