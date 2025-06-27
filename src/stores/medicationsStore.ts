import { create } from 'zustand';
import { DurationUnitOption, MedicationInputEntry } from '../types/medication';
import { Medication } from 'fhir/r4';
import { Concept } from '@types/encounterConcepts';
import { Frequency } from '@types/medicationConfig';

export interface MedicationState {
  selectedMedications: MedicationInputEntry[];

  addMedication: (medication: Medication, displayName: string) => void;
  removeMedication: (medicationId: string) => void;
  updateDosage: (medicationId: string, dosage: number) => void;
  updateDosageUnit: (medicationId: string, unit: Concept) => void;
  updateFrequency: (medicationId: string, frequency: Frequency | null) => void;
  updateRoute: (medicationId: string, route: Concept) => void;
  updateDuration: (medicationId: string, duration: number) => void;
  updateDurationUnit: (
    medicationId: string,
    unit: DurationUnitOption | null,
  ) => void;
  updateInstruction: (medicationId: string, instruction: Concept) => void;
  updateisPRN: (medicationId: string, isPRN: boolean) => void;
  updateisSTAT: (medicationId: string, isSTAT: boolean) => void;
  updateStartDate: (medicationId: string, date: Date) => void;
  updateDispenseQuantity: (medicationId: string, quantity: number) => void;
  updateDispenseUnit: (medicationId: string, unit: Concept) => void;
  validateAllMedications: () => boolean;

  reset: () => void;
  getState: () => MedicationState;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  selectedMedications: [],

  addMedication: (medication: Medication, displayName: string) => {
    const newMedication: MedicationInputEntry = {
      id: medication.id!,
      display: displayName,
      medication: medication,
      dosage: 0,
      dosageUnit: null,
      frequency: null,
      route: null,
      duration: 0,
      durationUnit: null,
      isSTAT: false,
      isPRN: false,
      startDate: new Date(),
      instruction: null,
      errors: {},
      hasBeenValidated: false,
      dispenseQuantity: 0,
      dispenseUnit: null,
    };

    set((state) => ({
      selectedMedications: [newMedication, ...state.selectedMedications],
    }));
  },

  removeMedication: (medicationId: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.filter(
        (medication) => medication.id !== medicationId,
      ),
    }));
  },

  updateDosage: (medicationId: string, dosage: number) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          dosage: dosage,
        };

        if (medication.hasBeenValidated && dosage > 0) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.dosage;
        }

        return updatedMedication;
      }),
    }));
  },

  updateDosageUnit: (medicationId: string, unit: Concept) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          dosageUnit: unit,
        };

        if (medication.hasBeenValidated && unit) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.dosageUnit;
        }

        return updatedMedication;
      }),
    }));
  },

  updateFrequency: (medicationId: string, frequency: Frequency | null) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          frequency: frequency,
        };

        if (medication.hasBeenValidated && frequency) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.frequency;
        }

        return updatedMedication;
      }),
    }));
  },

  updateRoute: (medicationId: string, route: Concept) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          route: route,
        };

        if (medication.hasBeenValidated && route) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.route;
        }

        return updatedMedication;
      }),
    }));
  },

  updateDuration: (medicationId: string, duration: number) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          duration,
        };

        if (medication.hasBeenValidated && duration > 0) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.duration;
        }

        return updatedMedication;
      }),
    }));
  },

  updateDurationUnit: (
    medicationId: string,
    unit: DurationUnitOption | null,
  ) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          durationUnit: unit,
        };

        if (medication.hasBeenValidated) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.durationUnit;
        }

        return updatedMedication;
      }),
    }));
  },

  updateInstruction: (medicationId: string, instruction: Concept) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          instruction: instruction,
        };
      }),
    }));
  },

  updateisPRN: (medicationId: string, isPRN: boolean) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          isPRN: isPRN,
        };
      }),
    }));
  },

  updateisSTAT: (medicationId: string, isSTAT: boolean) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          isSTAT: isSTAT,
        };
      }),
    }));
  },

  updateStartDate: (medicationId: string, date: Date) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          startDate: date,
        };
      }),
    }));
  },

  updateDispenseQuantity(medicationId: string, quantity: number) {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          dispenseQuantity: quantity,
        };

        if (medication.hasBeenValidated && quantity >= 0) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.dispenseQuantity;
        }

        return updatedMedication;
      }),
    }));
  },

  updateDispenseUnit(medicationId: string, unit: Concept) {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          dispenseUnit: unit,
        };

        if (medication.hasBeenValidated && unit) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.dispenseUnit;
        }

        return updatedMedication;
      }),
    }));
  },

  validateAllMedications: () => {
    let isValid = true;

    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        const errors = { ...medication.errors };

        if (!medication.dosage || medication.dosage <= 0) {
          errors.dosage = 'MEDICATION_DOSAGE_REQUIRED';
          isValid = false;
        } else {
          delete errors.dosage;
        }
        if (!medication.dosageUnit) {
          errors.dosageUnit = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.dosageUnit;
        }

        if (!medication.frequency) {
          errors.frequency = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.frequency;
        }

        if (!medication.route) {
          errors.route = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.route;
        }

        if (!medication.duration || medication.duration <= 0) {
          errors.duration = 'MEDICATION_DURATION_REQUIRED';
          isValid = false;
        } else {
          delete errors.duration;
        }
        if (!medication.durationUnit) {
          errors.durationUnit = 'DROPDOWN_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.durationUnit;
        }

        return {
          ...medication,
          errors,
          hasBeenValidated: true,
        };
      }),
    }));

    return isValid;
  },

  reset: () => {
    set({ selectedMedications: [] });
  },

  getState: () => get(),
}));

export default useMedicationStore;
