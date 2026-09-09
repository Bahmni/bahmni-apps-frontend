import { renderHook, act } from '@testing-library/react';
import type { Encounter } from 'fhir/r4';
import {
  useEncounterSessionStore,
  setEncounterSessionDecision,
  setEncounterSessionLoading,
  resetEncounterSession,
  getEncounterSessionSnapshot,
  subscribeEncounterSession,
} from '../encounterSessionStore';

const mockEncounter = {
  resourceType: 'Encounter',
  id: 'enc-123',
  status: 'in-progress',
} as Encounter;

/**
 * Reset store to initial state before each test so tests are isolated.
 */
beforeEach(() => {
  resetEncounterSession();
});

describe('getEncounterSessionSnapshot', () => {
  it('returns initial state by default', () => {
    const state = getEncounterSessionSnapshot();
    expect(state).toEqual({
      matchReasons: [],
      activeEncounter: null,
      canEditOrCreate: false,
      isLoading: false,
    });
  });
});

describe('setEncounterSessionDecision', () => {
  it('sets MATCHED reason and canEditOrCreate=true', () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    const state = getEncounterSessionSnapshot();
    expect(state.matchReasons).toEqual(['MATCHED']);
    expect(state.activeEncounter).toEqual(mockEncounter);
    expect(state.canEditOrCreate).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('sets LOCATION_MISMATCH and canEditOrCreate=true (AC 4)', () => {
    setEncounterSessionDecision({
      reasons: ['LOCATION_MISMATCH'],
      encounter: mockEncounter,
    });
    const state = getEncounterSessionSnapshot();
    expect(state.canEditOrCreate).toBe(true);
  });

  it('sets PROVIDER_MISMATCH and canEditOrCreate=true (AC 4)', () => {
    setEncounterSessionDecision({
      reasons: ['PROVIDER_MISMATCH'],
      encounter: mockEncounter,
    });
    const state = getEncounterSessionSnapshot();
    expect(state.canEditOrCreate).toBe(true);
  });

  it('sets NO_ACTIVE_ENCOUNTER and canEditOrCreate=false', () => {
    setEncounterSessionDecision({
      reasons: ['NO_ACTIVE_ENCOUNTER'],
      encounter: null,
    });
    const state = getEncounterSessionSnapshot();
    expect(state.canEditOrCreate).toBe(false);
    expect(state.activeEncounter).toBeNull();
  });

  it('sets NO_ACTIVE_VISIT and canEditOrCreate=false', () => {
    setEncounterSessionDecision({
      reasons: ['NO_ACTIVE_VISIT'],
      encounter: null,
    });
    expect(getEncounterSessionSnapshot().canEditOrCreate).toBe(false);
  });

  it('sets SESSION_EXPIRED and canEditOrCreate=false (expired session disables edit)', () => {
    setEncounterSessionDecision({
      reasons: ['SESSION_EXPIRED'],
      encounter: mockEncounter,
    });
    expect(getEncounterSessionSnapshot().canEditOrCreate).toBe(false);
  });

  it('notifies subscribers when decision is set', () => {
    const listener = jest.fn();
    const unsub = subscribeEncounterSession(listener);
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });
});

describe('setEncounterSessionLoading', () => {
  it('sets isLoading=true without resetting other state', () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    setEncounterSessionLoading(true);
    const state = getEncounterSessionSnapshot();
    expect(state.isLoading).toBe(true);
    expect(state.canEditOrCreate).toBe(true); // preserved
  });

  it('sets isLoading=false', () => {
    setEncounterSessionLoading(false);
    expect(getEncounterSessionSnapshot().isLoading).toBe(false);
  });
});

describe('resetEncounterSession', () => {
  it('resets store to initial state', () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    resetEncounterSession();
    const state = getEncounterSessionSnapshot();
    expect(state).toEqual({
      matchReasons: [],
      activeEncounter: null,
      canEditOrCreate: false,
      isLoading: false,
    });
  });

  it('notifies subscribers on reset', () => {
    const listener = jest.fn();
    const unsub = subscribeEncounterSession(listener);
    resetEncounterSession();
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });
});

describe('subscribeEncounterSession', () => {
  it('returns an unsubscribe function that stops notifications', () => {
    const listener = jest.fn();
    const unsub = subscribeEncounterSession(listener);
    unsub();
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('useEncounterSessionStore hook', () => {
  it('returns the current store state', () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    const { result } = renderHook(() => useEncounterSessionStore());
    expect(result.current.canEditOrCreate).toBe(true);
    expect(result.current.matchReasons).toEqual(['MATCHED']);
    expect(result.current.activeEncounter).toEqual(mockEncounter);
  });

  it('re-renders when store state changes', () => {
    const { result } = renderHook(() => useEncounterSessionStore());
    expect(result.current.canEditOrCreate).toBe(false);

    act(() => {
      setEncounterSessionDecision({
        reasons: ['MATCHED'],
        encounter: mockEncounter,
      });
    });

    expect(result.current.canEditOrCreate).toBe(true);
  });

  it('reflects reset', () => {
    setEncounterSessionDecision({
      reasons: ['MATCHED'],
      encounter: mockEncounter,
    });
    const { result } = renderHook(() => useEncounterSessionStore());
    expect(result.current.canEditOrCreate).toBe(true);

    act(() => {
      resetEncounterSession();
    });

    expect(result.current.canEditOrCreate).toBe(false);
    expect(result.current.activeEncounter).toBeNull();
  });
});
