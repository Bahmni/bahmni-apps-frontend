import { create } from 'zustand';
import { FhirPatient as Patient } from '@/types/patient';

interface PatientState {
  patient: Patient | null;
  setPatient: (patient: Patient | null) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  patient: null,
  setPatient: (patient) => set({ patient }),
}));
