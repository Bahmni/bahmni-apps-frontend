import { useSyncExternalStore } from 'react';

export interface EncounterSessionState {
  canEditOrCreate: boolean;
  activeEncounterUuid: string | null;
  activePractitionerUuid: string | null;
  isLoading: boolean;
}

const INITIAL_STATE: EncounterSessionState = {
  canEditOrCreate: false,
  activeEncounterUuid: null,
  activePractitionerUuid: null,
  isLoading: false,
};

type Listener = () => void;

// Use globalThis so the store is shared across separately-bundled packages
// (e.g. @bahmni/clinical-app writes, @bahmni/widgets reads).
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

function emitChange() {
  const { listeners } = getGlobalStore();
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeEncounterSession(listener: Listener): () => void {
  const { listeners } = getGlobalStore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getEncounterSessionSnapshot(): EncounterSessionState {
  return getGlobalStore().state;
}

export function setEncounterSessionState(
  state: Partial<EncounterSessionState>,
): void {
  const store = getGlobalStore();
  store.state = { ...store.state, ...state };
  emitChange();
}

export function resetEncounterSession(): void {
  const store = getGlobalStore();
  store.state = { ...INITIAL_STATE };
  emitChange();
}

export function useEncounterSessionStore(): EncounterSessionState {
  return useSyncExternalStore(
    subscribeEncounterSession,
    getEncounterSessionSnapshot,
  );
}
