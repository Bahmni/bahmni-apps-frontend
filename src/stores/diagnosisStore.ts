import { create } from 'zustand';
import { Coding } from 'fhir/r4';
import { ConceptSearch } from '@types/concepts';
import { DiagnosisInputEntry } from '@types/diagnosis';

export interface DiagnosisState {
  selectedDiagnoses: DiagnosisInputEntry[];

  addDiagnosis: (diagnosis: ConceptSearch) => void;
  removeDiagnosis: (diagnosisId: string) => void;
  updateCertainty: (diagnosisId: string, certainty: Coding | null) => void;
  validateAllDiagnoses: () => boolean;
  reset: () => void;

  getState: () => DiagnosisState;
}

export const useDiagnosisStore = create<DiagnosisState>((set, get) => ({
  selectedDiagnoses: [],

  addDiagnosis: (diagnosis: ConceptSearch) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newDiagnosis: DiagnosisInputEntry = {
      id: uniqueId,
      conceptUuid: diagnosis.conceptUuid,
      title: diagnosis.conceptName,
      selectedCertainty: null,
      errors: {},
      hasBeenValidated: false,
    };

    set((state) => ({
      selectedDiagnoses: [...state.selectedDiagnoses, newDiagnosis],
    }));
  },

  removeDiagnosis: (diagnosisId: string) => {
    set((state) => ({
      selectedDiagnoses: state.selectedDiagnoses.filter(
        (diagnosis) => diagnosis.id !== diagnosisId,
      ),
    }));
  },

  updateCertainty: (diagnosisId: string, certainty: Coding | null) => {
    set((state) => ({
      selectedDiagnoses: state.selectedDiagnoses.map((diagnosis) => {
        if (diagnosis.id !== diagnosisId) return diagnosis;

        const updatedDiagnosis = {
          ...diagnosis,
          selectedCertainty: certainty,
        };

        if (diagnosis.hasBeenValidated && certainty) {
          updatedDiagnosis.errors = { ...diagnosis.errors };
          delete updatedDiagnosis.errors.certainty;
        }

        return updatedDiagnosis;
      }),
    }));
  },

  validateAllDiagnoses: () => {
    let isValid = true;

    set((state) => ({
      selectedDiagnoses: state.selectedDiagnoses.map((diagnosis) => {
        const errors = { ...diagnosis.errors };

        if (!diagnosis.selectedCertainty) {
          errors.certainty = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.certainty;
        }

        return {
          ...diagnosis,
          errors,
          hasBeenValidated: true,
        };
      }),
    }));

    return isValid;
  },

  reset: () => {
    set({ selectedDiagnoses: [] });
  },

  getState: () => get(),
}));

export default useDiagnosisStore;
