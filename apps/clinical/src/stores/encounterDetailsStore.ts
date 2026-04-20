import { type Provider, type User } from '@bahmni/services';
import { create } from 'zustand';
import { FhirEncounter } from '../models/encounter';
import { Concept } from '../models/encounterConcepts';
import { OpenMRSLocation } from '../models/location';

export interface EncounterDetailsState {
  selectedLocation: OpenMRSLocation | null;
  selectedEncounterType: Concept | null;
  selectedVisitType: Concept | null;
  encounterParticipants: Provider[];
  consultationDate: Date;
  requestedEncounterType: string | null;
  activeVisit: FhirEncounter | null;
  activeVisitError: Error | null;
  practitioner: Provider | null;
  user: User | null;
  patientUUID: string | null;
  isEncounterDetailsFormReady: boolean;
  isError: boolean;
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
  setIsError: (hasError: boolean) => void;
  setRequestedEncounterType: (encounterType: string | null) => void;
  reset: () => void;
  getState: () => EncounterDetailsState;
}

export const useEncounterDetailsStore = create<EncounterDetailsState>(
  (set, get) => ({
    selectedLocation: null,
    selectedEncounterType: null,
    selectedVisitType: null,
    encounterParticipants: [],
    consultationDate: new Date(),
    requestedEncounterType: null,
    isEncounterDetailsFormReady: false,
    activeVisit: null,
    activeVisitError: null,
    practitioner: null,
    user: null,
    patientUUID: null,
    isError: false,

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

    setIsError: (hasError: boolean) => set({ isError: hasError }),
    setRequestedEncounterType: (encounterType) =>
      set({ requestedEncounterType: encounterType }),

    reset: () =>
      set({
        selectedLocation: null,
        selectedEncounterType: null,
        selectedVisitType: null,
        encounterParticipants: [],
        consultationDate: new Date(),
        requestedEncounterType: null,
        isEncounterDetailsFormReady: false,
        activeVisit: null,
        activeVisitError: null,
        practitioner: null,
        user: null,
        patientUUID: null,
        isError: false,
      }),

    getState: () => get(),
  }),
);

export default useEncounterDetailsStore;
