import { create } from 'zustand';
import { FhirEncounter } from '@types/encounter';
import { Concept } from '@types/encounterConcepts';
import { OpenMRSLocation } from '@types/location';
import { Provider } from '@types/provider';
import { User } from '@types/user';

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

  // Patient management
  patientUUID: string | null;

  // Form readiness state
  isEncounterDetailsFormReady: boolean;

  // Error state
  hasError: boolean;

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
  setPatientUUID: (patientUUID: string | null) => void;
  setHasError: (hasError: boolean) => void;

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
    patientUUID: null,
    hasError: false,

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
    setPatientUUID: (patientUUID) => set({ patientUUID: patientUUID }),

    setHasError: (hasError: boolean) => set({ hasError }),

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
        patientUUID: null,
        hasError: false,
      }),

    getState: () => get(),
  }),
);

export default useEncounterDetailsStore;
