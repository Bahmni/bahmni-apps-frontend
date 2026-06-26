import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const ENCOUNTER_SEARCH_URL = OPENMRS_FHIR_R4 + '/Encounter';
//TODO: chnage URL to use bahmni config api
export const ENCOUNTER_SESSION_DURATION_GP_URL =
  OPENMRS_REST_V1 + '/systemsetting/bahmni.encountersession.duration';
export type MatchReasonCode =
  | 'MATCHED'
  | 'NO_ACTIVE_VISIT'
  | 'NO_ACTIVE_ENCOUNTER'
  | 'SESSION_EXPIRED'
  | 'PROVIDER_MISMATCH'
  | 'LOCATION_MISMATCH';

export interface EncounterMatchDecision {
  matched: boolean;
  encounter: import('fhir/r4').Encounter | null;
  reasons: MatchReasonCode[];
}

export const MATCH_REASON_MESSAGES: Record<MatchReasonCode, string> = {
  MATCHED: 'ENCOUNTER_MATCH_REASON_MATCHED',
  NO_ACTIVE_VISIT: 'ENCOUNTER_MATCH_REASON_NO_ACTIVE_VISIT',
  NO_ACTIVE_ENCOUNTER: 'ENCOUNTER_MATCH_REASON_NO_ACTIVE_ENCOUNTER',
  SESSION_EXPIRED: 'ENCOUNTER_MATCH_REASON_SESSION_EXPIRED',
  PROVIDER_MISMATCH: 'ENCOUNTER_MATCH_REASON_PROVIDER_MISMATCH',
  LOCATION_MISMATCH: 'ENCOUNTER_MATCH_REASON_LOCATION_MISMATCH',
};
