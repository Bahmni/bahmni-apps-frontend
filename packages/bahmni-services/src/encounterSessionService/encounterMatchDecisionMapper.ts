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
  MATCHED: 'ENCOUNTER_MATCH_REASON_MATCHED',
  NO_ACTIVE_VISIT: 'ENCOUNTER_MATCH_REASON_NO_ACTIVE_VISIT',
  NO_ACTIVE_ENCOUNTER: 'ENCOUNTER_MATCH_REASON_NO_ACTIVE_ENCOUNTER',
  SESSION_EXPIRED: 'ENCOUNTER_MATCH_REASON_SESSION_EXPIRED',
  PROVIDER_MISMATCH: 'ENCOUNTER_MATCH_REASON_PROVIDER_MISMATCH',
  LOCATION_MISMATCH: 'ENCOUNTER_MATCH_REASON_LOCATION_MISMATCH',
  MULTIPLE_ENCOUNTERS_FOUND: 'ENCOUNTER_MATCH_REASON_MULTIPLE_FOUND',
};

function getReferenceId(reference?: string): string | undefined {
  if (!reference) return undefined;
  return reference.split('/').filter(Boolean).pop();
}

function checkLocationMatch(
  encounter: Encounter,
  loginLocationUUID: string,
): boolean {
  const encounterLocations = encounter.location ?? [];
  return encounterLocations.some(
    (loc) => getReferenceId(loc.location?.reference) === loginLocationUUID,
  );
}

function filterEncountersByVisit(
  encounters: Encounter[],
  visitId: string,
): Encounter[] {
  return encounters.filter(
    (enc) => getReferenceId(enc.partOf?.reference) === visitId,
  );
}

export async function resolveEncounterMatchDecision(
  patientUUID: string,
  practitionerUUID: string,
  locationUUID: string,
  encounterTypeUUID?: string,
): Promise<EncounterMatchDecision> {
  try {
    const activeVisit = await getActiveVisit(patientUUID);
    if (!activeVisit) {
      return { matched: false, encounter: null, reasons: ['NO_ACTIVE_VISIT'] };
    }

    const activeVisitId = activeVisit.id;
    if (!activeVisitId) {
      return {
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      };
    }

    const sessionDuration = await getEncounterSessionDuration();
    const sessionStartTime = new Date(Date.now() - sessionDuration * 60 * 1000);
    const lastUpdatedParam = `ge${sessionStartTime.toISOString()}`;

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

    const inSessionOwnInVisit = filterEncountersByVisit(
      inSessionOwn,
      activeVisitId,
    );
    const allTimeOwnInVisit = filterEncountersByVisit(
      allTimeOwn,
      activeVisitId,
    );
    const inSessionAnyInVisit = filterEncountersByVisit(
      inSessionAny,
      activeVisitId,
    );

    const inSessionOwnIds = new Set(inSessionOwnInVisit.map((e) => e.id));

    // SESSION_EXPIRED = found all-time for this practitioner but NOT in-session,
    // only relevant when no in-session encounter exists for this practitioner
    const sessionExpiredEncounters =
      inSessionOwnInVisit.length === 0
        ? allTimeOwnInVisit.filter((e) => !inSessionOwnIds.has(e.id))
        : [];

    // PROVIDER_MISMATCH = found in-session for any provider but NOT this practitioner
    const otherProviderEncounters = inSessionAnyInVisit.filter(
      (e) => !inSessionOwnIds.has(e.id),
    );

    const reasons: MatchReasonCode[] = [];
    let primaryEncounter: Encounter | null = null;

    if (inSessionOwnInVisit.length > 1) {
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

    if (sessionExpiredEncounters.length > 0) {
      reasons.push('SESSION_EXPIRED');
      if (!reasons.includes('LOCATION_MISMATCH')) {
        const locationMatches = checkLocationMatch(
          sessionExpiredEncounters[0],
          locationUUID,
        );
        if (!locationMatches) reasons.push('LOCATION_MISMATCH');
      }
      primaryEncounter ??= sessionExpiredEncounters[0];
    }

    if (otherProviderEncounters.length > 0) {
      reasons.push('PROVIDER_MISMATCH');
      if (!reasons.includes('LOCATION_MISMATCH')) {
        const locationMatches = checkLocationMatch(
          otherProviderEncounters[0],
          locationUUID,
        );
        if (!locationMatches) reasons.push('LOCATION_MISMATCH');
      }
      primaryEncounter ??= otherProviderEncounters[0];
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
    // eslint-disable-next-line no-console
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

export function isOwnInSessionEncounter(
  decision: EncounterMatchDecision,
): boolean {
  return (
    decision.matched ||
    (decision.reasons.includes('LOCATION_MISMATCH') &&
      !decision.reasons.includes('SESSION_EXPIRED') &&
      !decision.reasons.includes('PROVIDER_MISMATCH'))
  );
}
