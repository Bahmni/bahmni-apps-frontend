import { create } from 'zustand';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';

export interface EncounterDetailsState {
  // Selected values
  selectedLocation: OpenMRSLocation | null;
  selectedEncounterType: Concept | null;
  selectedVisitType: Concept | null;
  encounterParticipants: Provider[]; // Selected participants for the encounter
  consultationDate: Date;

  // Setters
  setSelectedLocation: (location: OpenMRSLocation | null) => void;
  setSelectedEncounterType: (encounterType: Concept | null) => void;
  setSelectedVisitType: (visitType: Concept | null) => void;
  setEncounterParticipants: (participants: Provider[]) => void;
  setConsultationDate: (date: Date) => void;

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

    setSelectedLocation: (location) => set({ selectedLocation: location }),
    setSelectedEncounterType: (encounterType) =>
      set({ selectedEncounterType: encounterType }),
    setSelectedVisitType: (visitType) => set({ selectedVisitType: visitType }),
    setEncounterParticipants: (participants) =>
      set({ encounterParticipants: participants }),
    setConsultationDate: (date) => set({ consultationDate: date }),

    reset: () =>
      set({
        selectedLocation: null,
        selectedEncounterType: null,
        selectedVisitType: null,
        encounterParticipants: [],
        consultationDate: new Date(),
      }),

    getState: () => get(),
  }),
);

export default useEncounterDetailsStore;
