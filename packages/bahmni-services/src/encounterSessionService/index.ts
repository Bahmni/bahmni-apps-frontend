export { findActiveEncounterInSession, searchEncounters } from './encounterSessionService';
export { CONSULTATION_ENCOUNTER_TYPE_UUID } from './constants';
export {
  resolveEncounterMatchDecision,
  canResumeOwnInSessionEncounter,
  type EncounterMatchDecision,
  type MatchReasonCode,
  MATCH_REASON_MESSAGES,
} from './encounterMatchDecisionMapper';
export {
  useEncounterSessionStore,
  setEncounterSessionDecision,
  setEncounterSessionLoading,
  resetEncounterSession,
  subscribeEncounterSession,
  getEncounterSessionSnapshot,
  type EncounterSessionState,
} from './encounterSessionStore';
