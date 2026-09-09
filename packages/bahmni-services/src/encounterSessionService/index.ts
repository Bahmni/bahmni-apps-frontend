export {
  findActiveEncounterInSession,
  searchEncounters,
  getEncounterSessionDuration,
} from './encounterSessionService';
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
