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
let currentState: EncounterSessionState = { ...INITIAL_STATE };
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeEncounterSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getEncounterSessionSnapshot(): EncounterSessionState {
  return currentState;
}

export function setEncounterSessionState(
  state: Partial<EncounterSessionState>,
): void {
  currentState = { ...currentState, ...state };
  emitChange();
}

export function resetEncounterSession(): void {
  currentState = { ...INITIAL_STATE };
  emitChange();
}

export function useEncounterSessionStore(): EncounterSessionState {
  return useSyncExternalStore(
    subscribeEncounterSession,
    getEncounterSessionSnapshot,
  );
}
