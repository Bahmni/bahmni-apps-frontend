import { Encounter } from 'fhir/r4';
import { getActiveVisit } from '../encounterService';
import {
  searchEncounters,
  filterByActiveVisit,
  getEncounterSessionDuration,
} from './encounterSessionService';

/**
 * Reason codes explaining why an encounter match succeeded or failed
 */
export type MatchReasonCode =
  | 'MATCHED'
  | 'NO_ACTIVE_VISIT'
  | 'NO_ACTIVE_ENCOUNTER'
  | 'SESSION_EXPIRED'
  | 'PROVIDER_MISMATCH'
  | 'LOCATION_MISMATCH';

/**
 * Result of encounter match decision with reason
 */
export interface EncounterMatchDecision {
  matched: boolean;
  encounter: Encounter | null;
  reason: MatchReasonCode;
}

/**
 * Human-readable messages for match reason codes
 */
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
};

/**
 * Resolves encounter match decision with diagnostic reasons
 *
 * Decision flow:
 * 1. Check if patient has an active visit (no end_date)
 *    → If not, return NO_ACTIVE_VISIT
 * 2. Search for encounters within session window for this patient + practitioner
 *    → If found and active visit matches, verify location
 *      → If location matches, return MATCHED with encounter
 *      → If location different, return LOCATION_MISMATCH
 * 3. If not found in session, search all-time (no _lastUpdated filter)
 *    → If found, return SESSION_EXPIRED (encounter exists but outside session window)
 * 4. Search without practitioner filter in session window
 *    → If found, return PROVIDER_MISMATCH (another provider's encounter)
 * 5. If no encounters found at all, return NO_ACTIVE_ENCOUNTER
 *
 * @param patientUUID - Patient UUID
 * @param practitionerUUID - Current practitioner UUID (from session/auth context)
 * @param locationUUID - Current login location UUID (from session/auth context)
 * @param encounterTypeUUID - Optional encounter type filter (default: consultation)
 * @returns Promise resolving to EncounterMatchDecision with reason
 */
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
      return {
        matched: false,
        encounter: null,
        reason: 'NO_ACTIVE_VISIT',
      };
    }

    const sessionDuration = await getEncounterSessionDuration();
    const sessionStartTime = new Date(Date.now() - sessionDuration * 60 * 1000);
    const lastUpdatedParam = `ge${sessionStartTime.toISOString()}`;

    // Step 2: Search for encounters within session window (practitioner-specific)
    const inSessionEncounters = await searchEncounters({
      patient: patientUUID,
      _tag: 'encounter',
      _lastUpdated: lastUpdatedParam,
      participant: practitionerUUID,
      type: encounterTypeUUID,
    });

    if (inSessionEncounters.length > 0) {
      // Found encounter(s) within session window for this practitioner
      const matchedEncounter = await filterByActiveVisit(
        inSessionEncounters,
        patientUUID,
      );

      if (matchedEncounter) {
        // Verify location matches
        const encounterLocations = matchedEncounter.location ?? [];
        const locationMatches = encounterLocations.some((loc) => {
          const locUUID = loc.location?.reference?.split('/')[1];
          return locUUID === locationUUID;
        });

        if (locationMatches) {
          return {
            matched: true,
            encounter: matchedEncounter,
            reason: 'MATCHED',
          };
        } else {
          return {
            matched: false,
            encounter: matchedEncounter,
            reason: 'LOCATION_MISMATCH',
          };
        }
      }
    }

    // Step 3: Search all-time (no session window) to check if session expired
    const allTimeEncounters = await searchEncounters({
      patient: patientUUID,
      _tag: 'encounter',
      participant: practitionerUUID,
      type: encounterTypeUUID,
    });

    if (allTimeEncounters.length > 0) {
      const allTimeMatch = await filterByActiveVisit(
        allTimeEncounters,
        patientUUID,
      );

      if (allTimeMatch) {
        return {
          matched: false,
          encounter: allTimeMatch,
          reason: 'SESSION_EXPIRED',
        };
      }
    }

    // Step 4: Search without practitioner filter to check for provider mismatch
    const noPractitionerEncounters = await searchEncounters({
      patient: patientUUID,
      _tag: 'encounter',
      _lastUpdated: lastUpdatedParam,
      type: encounterTypeUUID,
    });

    if (noPractitionerEncounters.length > 0) {
      const noProviderMatch = await filterByActiveVisit(
        noPractitionerEncounters,
        patientUUID,
      );

      if (noProviderMatch) {
        return {
          matched: false,
          encounter: noProviderMatch,
          reason: 'PROVIDER_MISMATCH',
        };
      }
    }

    // Step 5: No encounters found at all
    return {
      matched: false,
      encounter: null,
      reason: 'NO_ACTIVE_ENCOUNTER',
    };
  } catch (error) {
    // On error, default to safe "New Consultation" state
    console.error(
      'Error in resolveEncounterMatchDecision:',
      error instanceof Error ? error.message : error,
    );
    return {
      matched: false,
      encounter: null,
      reason: 'NO_ACTIVE_ENCOUNTER',
    };
  }
}
