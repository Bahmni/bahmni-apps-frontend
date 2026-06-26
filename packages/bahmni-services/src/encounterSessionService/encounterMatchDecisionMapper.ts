import { Encounter } from 'fhir/r4';
import { getActiveVisit } from '../encounterService';
import {
  type MatchReasonCode,
  type EncounterMatchDecision,
  MATCH_REASON_MESSAGES,
} from './constants';
import {
  searchEncounters,
  getEncounterSessionDuration,
} from './encounterSessionService';

export type { MatchReasonCode, EncounterMatchDecision };
export { MATCH_REASON_MESSAGES };

function getReferenceId(reference?: string): string | undefined {
  if (!reference) return undefined;
  const parts = reference.split('/').filter(Boolean);
  const historyIndex = parts.indexOf('_history');
  return historyIndex > 0 ? parts[historyIndex - 1] : parts.pop();
}

function checkLocationMatch(
  encounter: Encounter,
  loginLocationUUID: string | undefined,
): boolean {
  if (!loginLocationUUID) return true; // location unknown — skip check, don't penalise clinician
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

function sortByMostRecent(encounters: Encounter[]): Encounter[] {
  return [...encounters].sort((a, b) => {
    const dateA = new Date(a.period?.start ?? 0).getTime();
    const dateB = new Date(b.period?.start ?? 0).getTime();
    return dateB - dateA;
  });
}

export async function resolveEncounterMatchDecision(
  patientUUID: string,
  practitionerUUID: string,
  locationUUID: string | undefined,
  encounterTypeUUID?: string,
): Promise<EncounterMatchDecision> {
  try {
    // 1. Active visit? → NO → NO_ACTIVE_VISIT
    const activeVisit = await getActiveVisit(patientUUID);
    if (!activeVisit?.id) {
      return { matched: false, encounter: null, reasons: ['NO_ACTIVE_VISIT'] };
    }

    // 2. Get session window
    const sessionDuration = await getEncounterSessionDuration();
    const sessionStartTime = new Date(Date.now() - sessionDuration * 60 * 1000);
    const recentUpdatedParam = `ge${sessionStartTime.toISOString()}`;

    // 3. Two parallel searches:
    //    recentEncounters         — all providers, session window  → detect MATCHED / LOCATION_MISMATCH / PROVIDER_MISMATCH
    //    practitionerAllTimeEncounters — this practitioner, all time → detect SESSION_EXPIRED
    const [recentEncounters, practitionerAllTimeEncounters] = await Promise.all(
      [
        searchEncounters({
          patient: patientUUID,
          _tag: 'encounter',
          _lastUpdated: recentUpdatedParam,
          type: encounterTypeUUID,
        }),
        searchEncounters({
          patient: patientUUID,
          _tag: 'encounter',
          participant: practitionerUUID,
          type: encounterTypeUUID,
        }),
      ],
    );

    // 4. Filter to current visit only
    const recentEncountersInVisit = filterEncountersByVisit(
      recentEncounters,
      activeVisit.id,
    );
    const practitionerEncountersAllTime = sortByMostRecent(
      filterEncountersByVisit(practitionerAllTimeEncounters, activeVisit.id),
    );

    // 5. No encounters at all → NO_ACTIVE_ENCOUNTER
    if (
      recentEncountersInVisit.length === 0 &&
      practitionerEncountersAllTime.length === 0
    ) {
      return {
        matched: false,
        encounter: null,
        reasons: ['NO_ACTIVE_ENCOUNTER'],
      };
    }

    // 6. Split recent encounters by practitioner
    const hasParticipant = (
      e: (typeof recentEncountersInVisit)[0],
      uuid: string,
    ) =>
      e.participant?.some(
        (p) => getReferenceId(p.individual?.reference) === uuid,
      ) ?? false;

    const currentPractitionerRecentEncounters = sortByMostRecent(
      recentEncountersInVisit.filter((e) =>
        hasParticipant(e, practitionerUUID),
      ),
    );
    const otherProvidersRecentEncounters = sortByMostRecent(
      recentEncountersInVisit.filter(
        (e) => !hasParticipant(e, practitionerUUID),
      ),
    );

    // 7. Recent encounters by this practitioner → MATCHED or LOCATION_MISMATCH
    //    When multiple exist, pick the most recent by period.start.
    if (currentPractitionerRecentEncounters.length >= 1) {
      const encounter = currentPractitionerRecentEncounters[0];
      if (checkLocationMatch(encounter, locationUUID)) {
        return { matched: true, encounter, reasons: ['MATCHED'] };
      }
      return { matched: false, encounter, reasons: ['LOCATION_MISMATCH'] };
    }

    // 9. No recent encounter by this practitioner — check other conditions
    const reasons: MatchReasonCode[] = [];
    let primaryEncounter: Encounter | null = null;

    // Other providers actively working → PROVIDER_MISMATCH
    if (otherProvidersRecentEncounters.length > 0) {
      reasons.push('PROVIDER_MISMATCH');
      primaryEncounter = otherProvidersRecentEncounters[0];
    }

    // This practitioner had an encounter outside session window → SESSION_EXPIRED
    if (practitionerEncountersAllTime.length > 0) {
      reasons.push('SESSION_EXPIRED');
      primaryEncounter ??= practitionerEncountersAllTime[0];
    }

    // 10. Add LOCATION_MISMATCH if primary encounter is at a different location
    if (
      primaryEncounter &&
      !checkLocationMatch(primaryEncounter, locationUUID)
    ) {
      reasons.push('LOCATION_MISMATCH');
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

export function canResumeOwnInSessionEncounter(
  decision: EncounterMatchDecision,
): boolean {
  return (
    decision.matched ||
    (decision.reasons.includes('LOCATION_MISMATCH') &&
      !decision.reasons.includes('SESSION_EXPIRED') &&
      !decision.reasons.includes('PROVIDER_MISMATCH'))
  );
}
