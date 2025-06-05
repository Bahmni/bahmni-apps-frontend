import { create } from 'zustand';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';
import { FhirEncounter } from '@types/encounter';
import { User } from '@types/user';

export interface EncounterDetailsErrors {
  location?: Error | null;
  encounterType?: Error | null;
  visitType?: Error | null;
  participants?: Error | null;
  consultationDate?: Error | null;
  general?: Error | null;
}

export interface EncounterDetailsState {
  // Selected values
  selectedLocation: OpenMRSLocation | null;
  selectedEncounterType: Concept | null;
  selectedVisitType: Concept | null;
  encounterParticipants: Provider[]; // Selected participants for the encounter
  consultationDate: Date;

  // Active visit management
  activeVisit: FhirEncounter | null;
  activeVisitError: Error | null;

  // Practitioner and user management
  practitioner: Provider | null;
  user: User | null;

  // Form readiness state
  isEncounterDetailsFormReady: boolean;

  // Error state
  errors: EncounterDetailsErrors;

  // Setters
  setSelectedLocation: (location: OpenMRSLocation | null) => void;
  setSelectedEncounterType: (encounterType: Concept | null) => void;
  setSelectedVisitType: (visitType: Concept | null) => void;
  setEncounterParticipants: (participants: Provider[]) => void;
  setConsultationDate: (date: Date) => void;
  setEncounterDetailsFormReady: (ready: boolean) => void;
  setActiveVisit: (visit: FhirEncounter | null) => void;
  setActiveVisitError: (error: Error | null) => void;
  setPractitioner: (practitioner: Provider | null) => void;
  setUser: (user: User | null) => void;
  setErrors: (errors: Partial<EncounterDetailsErrors>) => void;

  // Reset
  reset: () => void;

  // Get state for testing
  getState: () => EncounterDetailsState;
}

export const useEncounterDetailsStore = create<EncounterDetailsState>(
  (set, get) => ({
    selectedLocation: null,
    selectedEncounterType: null,
    selectedVisitType: null,
    encounterParticipants: [],
    consultationDate: new Date(),
    isEncounterDetailsFormReady: false,
    activeVisit: null,
    activeVisitError: null,
    practitioner: null,
    user: null,
    errors: {},

    setSelectedLocation: (location) => set({ selectedLocation: location }),
    setSelectedEncounterType: (encounterType) =>
      set({ selectedEncounterType: encounterType }),
    setSelectedVisitType: (visitType) => set({ selectedVisitType: visitType }),
    setEncounterParticipants: (participants) =>
      set({ encounterParticipants: participants }),
    setConsultationDate: (date) => set({ consultationDate: date }),
    setEncounterDetailsFormReady: (ready) =>
      set({ isEncounterDetailsFormReady: ready }),
    setActiveVisit: (visit) => set({ activeVisit: visit }),
    setActiveVisitError: (error) => set({ activeVisitError: error }),
    setPractitioner: (practitioner) => set({ practitioner: practitioner }),
    setUser: (user) => set({ user: user }),

    setErrors: (errors: Partial<EncounterDetailsErrors>) =>
      set((state) => ({
        errors: { ...state.errors, ...errors },
      })),

    reset: () =>
      set({
        selectedLocation: null,
        selectedEncounterType: null,
        selectedVisitType: null,
        encounterParticipants: [],
        consultationDate: new Date(),
        isEncounterDetailsFormReady: false,
        activeVisit: null,
        activeVisitError: null,
        practitioner: null,
        user: null,
        errors: {},
      }),

    getState: () => get(),
  }),
);

export default useEncounterDetailsStore;
