/**
 * Encounter Session Store
 *
 * A vanilla-JS singleton store (no Zustand dependency) that implements the
 * pub/sub pattern compatible with React's useSyncExternalStore.
 *
 * PatientHeader writes the decision once via setDecision(); widgets read via
 * useEncounterSessionStore() — zero additional FHIR calls per widget.
 *
 * Uses globalThis so the store is shared across separately-bundled packages
 * (e.g. @bahmni/clinical-app writes, @bahmni/widgets reads).
 */
import type { Encounter } from 'fhir/r4';
import { useSyncExternalStore } from 'react';
import type { MatchReasonCode } from './constants';

export interface EncounterSessionState {
  matchReasons: MatchReasonCode[];
  activeEncounter: Encounter | null;
  /** true when button should be shown (MATCHED | LOCATION_MISMATCH | PROVIDER_MISMATCH) */
  canEditOrCreate: boolean;
  isLoading: boolean;
}

type Listener = () => void;

const INITIAL_STATE: EncounterSessionState = {
  matchReasons: [],
  activeEncounter: null,
  canEditOrCreate: false,
  isLoading: false,
};

const EDIT_ELIGIBLE_REASONS: MatchReasonCode[] = [
  'MATCHED',
  'SESSION_EXPIRED',
  'LOCATION_MISMATCH',
  'PROVIDER_MISMATCH',
];

const GLOBAL_KEY = '__bahmni_encounter_session__';

interface GlobalStore {
  state: EncounterSessionState;
  listeners: Set<Listener>;
}

function getGlobalStore(): GlobalStore {
  const g = globalThis as Record<string, unknown>;
  g[GLOBAL_KEY] ??= {
    state: { ...INITIAL_STATE },
    listeners: new Set<Listener>(),
  };
  return g[GLOBAL_KEY] as GlobalStore;
}

function notify() {
  const { listeners } = getGlobalStore();
  listeners.forEach((l) => l());
}

/** Subscribe to store changes — compatible with useSyncExternalStore. */
export function subscribeEncounterSession(listener: Listener): () => void {
  const { listeners } = getGlobalStore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read current snapshot — compatible with useSyncExternalStore. */
export function getEncounterSessionSnapshot(): EncounterSessionState {
  return getGlobalStore().state;
}

/** Write encounter match decision into the store (called by PatientHeader). */
export function setEncounterSessionDecision(decision: {
  reasons: MatchReasonCode[];
  encounter: Encounter | null;
}): void {
  const canEditOrCreate = decision.reasons.some((r) =>
    EDIT_ELIGIBLE_REASONS.includes(r),
  );
  const store = getGlobalStore();
  store.state = {
    matchReasons: decision.reasons,
    activeEncounter: decision.encounter,
    canEditOrCreate,
    isLoading: false,
  };
  notify();
}

/** Mark as loading while encounter session is being resolved. */
export function setEncounterSessionLoading(isLoading: boolean): void {
  const store = getGlobalStore();
  store.state = { ...store.state, isLoading };
  notify();
}

/** Reset to initial state — called by PatientHeader on patient UUID change. */
export function resetEncounterSession(): void {
  const store = getGlobalStore();
  store.state = { ...INITIAL_STATE };
  notify();
}

/**
 * React hook that subscribes to the encounter session store and returns
 * the current state, re-rendering on every store update.
 */
export function useEncounterSessionStore(): EncounterSessionState {
  return useSyncExternalStore(
    subscribeEncounterSession,
    getEncounterSessionSnapshot,
  );
}
