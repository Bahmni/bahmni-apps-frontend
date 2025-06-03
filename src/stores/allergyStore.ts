import { create } from 'zustand';
import { Coding } from 'fhir/r4';
import { AllergenConcept } from '@types/concepts';
import { AllergyInputEntry } from '@types/allergy';

export interface AllergyState {
  selectedAllergies: AllergyInputEntry[];

  addAllergy: (allergy: AllergenConcept) => void;
  removeAllergy: (allergyId: string) => void;
  updateSeverity: (allergyId: string, severity: Coding | null) => void;
  updateReactions: (allergyId: string, reactions: Coding[]) => void;
  validateAllAllergies: () => boolean;
  reset: () => void;

  getState: () => AllergyState;
}

export const useAllergyStore = create<AllergyState>((set, get) => ({
  selectedAllergies: [],

  addAllergy: (allergy: AllergenConcept) => {
    const newAllergy: AllergyInputEntry = {
      id: allergy.uuid,
      display: allergy.display,
      type: allergy.type,
      selectedSeverity: null,
      selectedReactions: [],
      errors: {},
      hasBeenValidated: false,
    };

    set((state) => ({
      selectedAllergies: [...state.selectedAllergies, newAllergy],
    }));
  },

  removeAllergy: (allergyId: string) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.filter(
        (allergy) => allergy.id !== allergyId,
      ),
    }));
  },

  updateSeverity: (allergyId: string, severity: Coding | null) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.id !== allergyId) return allergy;

        const updatedAllergy = {
          ...allergy,
          selectedSeverity: severity,
        };

        if (allergy.hasBeenValidated && severity) {
          updatedAllergy.errors = { ...allergy.errors };
          delete updatedAllergy.errors.severity;
        }

        return updatedAllergy;
      }),
    }));
  },

  updateReactions: (allergyId: string, reactions: Coding[]) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.id !== allergyId) return allergy;

        const updatedAllergy = {
          ...allergy,
          selectedReactions: reactions,
        };

        if (allergy.hasBeenValidated && reactions.length > 0) {
          updatedAllergy.errors = { ...allergy.errors };
          delete updatedAllergy.errors.reactions;
        }

        return updatedAllergy;
      }),
    }));
  },

  validateAllAllergies: () => {
    let isValid = true;

    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        const errors = { ...allergy.errors };

        if (!allergy.selectedSeverity) {
          errors.severity = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.severity;
        }

        if (!allergy.selectedReactions.length) {
          errors.reactions = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.reactions;
        }

        return {
          ...allergy,
          errors,
          hasBeenValidated: true,
        };
      }),
    }));

    return isValid;
  },

  reset: () => {
    set({ selectedAllergies: [] });
  },

  getState: () => get(),
}));

export default useAllergyStore;
