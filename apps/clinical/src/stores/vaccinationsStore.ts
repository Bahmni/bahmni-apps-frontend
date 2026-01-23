import { Medication } from 'fhir/r4';
import { create } from 'zustand';
import { Concept } from '../models/encounterConcepts';
import { DurationUnitOption, MedicationInputEntry } from '../models/medication';
import { Frequency } from '../models/medicationConfig';

export interface VaccinationState {
  selectedVaccinations: MedicationInputEntry[];

  addVaccination: (vaccination: Medication, displayName: string) => void;
  removeVaccination: (vaccinationId: string) => void;
  updateDosage: (vaccinationId: string, dosage: number) => void;
  updateDosageUnit: (vaccinationId: string, unit: Concept) => void;
  updateFrequency: (vaccinationId: string, frequency: Frequency | null) => void;
  updateRoute: (vaccinationId: string, route: Concept) => void;
  updateDuration: (vaccinationId: string, duration: number) => void;
  updateDurationUnit: (
    vaccinationId: string,
    unit: DurationUnitOption | null,
  ) => void;
  updateInstruction: (vaccinationId: string, instruction: Concept) => void;
  updateisPRN: (vaccinationId: string, isPRN: boolean) => void;
  updateisSTAT: (vaccinationId: string, isSTAT: boolean) => void;
  updateStartDate: (vaccinationId: string, date: Date) => void;
  updateDispenseQuantity: (vaccinationId: string, quantity: number) => void;
  updateDispenseUnit: (vaccinationId: string, unit: Concept) => void;
  updateNote: (vaccinationId: string, note: string) => void;
  validateAllVaccinations: () => boolean;

  reset: () => void;
  getState: () => VaccinationState;
}
export const useVaccinationStore = create<VaccinationState>((set, get) => ({
  selectedVaccinations: [],

  addVaccination: (vaccination: Medication, displayName: string) => {
    const newVaccination: MedicationInputEntry = {
      id: vaccination.id!,
      display: displayName,
      medication: vaccination,
      dosage: 0,
      dosageUnit: null,
      frequency: null,
      route: null,
      duration: 0,
      durationUnit: null,
      isSTAT: true,
      isPRN: false,
      startDate: new Date(),
      instruction: null,
      errors: {},
      hasBeenValidated: false,
      dispenseQuantity: 0,
      dispenseUnit: null,
    };

    set((state) => ({
      selectedVaccinations: [newVaccination, ...state.selectedVaccinations],
    }));
  },

  removeVaccination: (vaccinationId: string) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.filter(
        (vaccination) => vaccination.id !== vaccinationId,
      ),
    }));
  },

  updateDosage: (vaccinationId: string, dosage: number) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          dosage: dosage,
        };

        if (vaccination.hasBeenValidated && dosage > 0) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.dosage;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateDosageUnit: (vaccinationId: string, unit: Concept) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          dosageUnit: unit,
        };

        if (vaccination.hasBeenValidated && unit) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.dosageUnit;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateFrequency: (vaccinationId: string, frequency: Frequency | null) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          frequency: frequency,
        };

        if (vaccination.hasBeenValidated && frequency) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.frequency;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateRoute: (vaccinationId: string, route: Concept) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          route: route,
        };

        if (vaccination.hasBeenValidated && route) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.route;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateDuration: (vaccinationId: string, duration: number) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          duration,
        };

        if (vaccination.hasBeenValidated && duration > 0) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.duration;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateDurationUnit: (
    vaccinationId: string,
    unit: DurationUnitOption | null,
  ) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          durationUnit: unit,
        };

        if (vaccination.hasBeenValidated) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.durationUnit;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateInstruction: (vaccinationId: string, instruction: Concept) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        return {
          ...vaccination,
          instruction: instruction,
        };
      }),
    }));
  },

  updateisPRN: (vaccinationId: string, isPRN: boolean) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        return {
          ...vaccination,
          isPRN: isPRN,
        };
      }),
    }));
  },

  updateisSTAT: (vaccinationId: string, isSTAT: boolean) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          isSTAT,
        };
        if (vaccination.hasBeenValidated && isSTAT) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.durationUnit;
          delete updatedVaccination.errors.duration;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateStartDate: (vaccinationId: string, date: Date) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        return {
          ...vaccination,
          startDate: date,
        };
      }),
    }));
  },

  updateDispenseQuantity(vaccinationId: string, quantity: number) {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          dispenseQuantity: quantity,
        };

        if (vaccination.hasBeenValidated && quantity >= 0) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.dispenseQuantity;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateDispenseUnit(vaccinationId: string, unit: Concept) {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        const updatedVaccination = {
          ...vaccination,
          dispenseUnit: unit,
        };

        if (vaccination.hasBeenValidated && unit) {
          updatedVaccination.errors = { ...vaccination.errors };
          delete updatedVaccination.errors.dispenseUnit;
        }

        return updatedVaccination;
      }),
    }));
  },

  updateNote: (vaccinationId: string, note: string) => {
    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        if (vaccination.id !== vaccinationId) return vaccination;

        return {
          ...vaccination,
          note: note,
        };
      }),
    }));
  },

  validateAllVaccinations: () => {
    let isValid = true;

    set((state) => ({
      selectedVaccinations: state.selectedVaccinations.map((vaccination) => {
        const errors = { ...vaccination.errors };

        if (!vaccination.dosage || vaccination.dosage <= 0) {
          errors.dosage = 'INPUT_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.dosage;
        }
        if (!vaccination.dosageUnit) {
          errors.dosageUnit = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.dosageUnit;
        }

        if (!vaccination.frequency) {
          errors.frequency = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.frequency;
        }

        if (!vaccination.route) {
          errors.route = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.route;
        }

        // For vaccinations, duration is not required since STAT is always true
        delete errors.duration;
        delete errors.durationUnit;

        return {
          ...vaccination,
          errors,
          hasBeenValidated: true,
        };
      }),
    }));

    return isValid;
  },

  reset: () => {
    set({ selectedVaccinations: [] });
  },

  getState: () => get(),
}));

export default useVaccinationStore;
