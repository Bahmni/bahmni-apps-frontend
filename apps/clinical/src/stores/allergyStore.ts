import { isNonCodedAllergen } from '@bahmni/services';
import { Coding } from 'fhir/r4';
import { create } from 'zustand';
import { AllergyInputEntry, AllergenConcept } from '../models/allergy';

export interface AllergyState {
  selectedAllergies: AllergyInputEntry[];

  addAllergy: (allergy: AllergenConcept) => void;
  preloadAllergies: (entries: AllergyInputEntry[]) => void;
  /** All keyed by entryId (unique per record) — never by the allergen concept id. */
  removeAllergy: (entryId: string) => void;
  updateSeverity: (entryId: string, severity: Coding | null) => void;
  updateReactions: (entryId: string, reactions: Coding[]) => void;
  updateNote: (entryId: string, note: string) => void;
  updateNonCodedAllergen: (entryId: string, name: string) => void;
  /** Records the backend-assigned resource UUID after a successful REST save, so a retry updates instead of re-creating. */
  setResourceId: (entryId: string, resourceId: string) => void;
  validateAllAllergies: () => boolean;
  reset: () => void;

  getState: () => AllergyState;
}

export const useAllergyStore = create<AllergyState>((set, get) => ({
  selectedAllergies: [],

  preloadAllergies: (entries: AllergyInputEntry[]) => {
    set({
      selectedAllergies: entries.map((e) => ({ ...e, isModified: false })),
    });
  },

  addAllergy: (allergy: AllergenConcept) => {
    const newAllergy: AllergyInputEntry = {
      id: allergy.uuid,
      entryId: crypto.randomUUID(),
      display: allergy.display,
      type: allergy.type ?? '',
      selectedSeverity: null,
      selectedReactions: [],
      errors: {},
      hasBeenValidated: false,
    };

    set((state) => ({
      selectedAllergies: [newAllergy, ...state.selectedAllergies],
    }));
  },

  removeAllergy: (entryId: string) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.filter(
        (allergy) => allergy.entryId !== entryId,
      ),
    }));
  },

  updateSeverity: (entryId: string, severity: Coding | null) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.entryId !== entryId) return allergy;

        const updatedAllergy = {
          ...allergy,
          selectedSeverity: severity,
          isModified: true,
        };

        if (allergy.hasBeenValidated && severity) {
          updatedAllergy.errors = { ...allergy.errors };
          delete updatedAllergy.errors.severity;
        }

        return updatedAllergy;
      }),
    }));
  },

  updateReactions: (entryId: string, reactions: Coding[]) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.entryId !== entryId) return allergy;

        const updatedAllergy = {
          ...allergy,
          selectedReactions: reactions,
          isModified: true,
        };

        if (allergy.hasBeenValidated && reactions.length > 0) {
          updatedAllergy.errors = { ...allergy.errors };
          delete updatedAllergy.errors.reactions;
        }

        return updatedAllergy;
      }),
    }));
  },

  updateNote: (entryId: string, note: string) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.entryId !== entryId) return allergy;
        const updatedAllergy = {
          ...allergy,
          note,
          isModified: true,
        };
        return updatedAllergy;
      }),
    }));
  },

  updateNonCodedAllergen: (entryId: string, name: string) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) => {
        if (allergy.entryId !== entryId) return allergy;

        const updatedAllergy = {
          ...allergy,
          nonCodedAllergen: name,
          isModified: true,
        };

        if (allergy.hasBeenValidated && name.trim()) {
          updatedAllergy.errors = { ...allergy.errors };
          delete updatedAllergy.errors.nonCodedAllergen;
        }

        return updatedAllergy;
      }),
    }));
  },

  setResourceId: (entryId: string, resourceId: string) => {
    set((state) => ({
      selectedAllergies: state.selectedAllergies.map((allergy) =>
        allergy.entryId === entryId ? { ...allergy, resourceId } : allergy,
      ),
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

        // OpenMRS rejects a non-coded allergy with no free-text allergen name
        // (allergyapi.allergen.nonCodedAllergen.required), so block it here
        // rather than letting the save fail server-side.
        if (
          isNonCodedAllergen(allergy.id) &&
          !allergy.nonCodedAllergen?.trim()
        ) {
          errors.nonCodedAllergen = 'INPUT_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.nonCodedAllergen;
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
