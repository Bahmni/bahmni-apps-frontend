import { create } from 'zustand';
import { MedicationConcept, MedicationInputEntry } from '../types/medication';
import { DEFAULT_MEDICATION_VALUES, FREQUENCY_OPTIONS, DURATION_UNIT_OPTIONS } from '../constants/medications';

export interface MedicationState {
  selectedMedications: MedicationInputEntry[];

  addMedication: (medication: MedicationConcept) => void;
  removeMedication: (medicationId: string) => void;
  updateDosage: (medicationId: string, dosage: number, unit: string) => void;
  updateFrequency: (medicationId: string, frequency: string) => void;
  updateRoute: (medicationId: string, route: string) => void;
  updateDuration: (medicationId: string, duration: number, unit: string) => void;
  updateTiming: (medicationId: string, timing: string) => void;
  updateFlags: (medicationId: string, isSTAT: boolean, isPRN: boolean) => void;
  updateStartDate: (medicationId: string, date: string) => void;
  updateInstructions: (medicationId: string, instructions: string) => void;
  calculateTotalQuantity: (medicationId: string) => number;
  validateAllMedications: () => boolean;
  reset: () => void;

  getState: () => MedicationState;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  selectedMedications: [],

  addMedication: (medication: MedicationConcept) => {
    const newMedication: MedicationInputEntry = {
      id: medication.uuid,
      display: medication.display,
      strength: medication.strength,
      dosageForm: medication.dosageForm,
      dosage: DEFAULT_MEDICATION_VALUES.dosage,
      dosageUnit: DEFAULT_MEDICATION_VALUES.dosageUnit,
      frequency: DEFAULT_MEDICATION_VALUES.frequency,
      timing: DEFAULT_MEDICATION_VALUES.timing,
      route: DEFAULT_MEDICATION_VALUES.route,
      duration: DEFAULT_MEDICATION_VALUES.duration,
      durationUnit: DEFAULT_MEDICATION_VALUES.durationUnit,
      isSTAT: DEFAULT_MEDICATION_VALUES.isSTAT,
      isPRN: DEFAULT_MEDICATION_VALUES.isPRN,
      startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      instructions: '',
      errors: {},
      hasBeenValidated: false,
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

  updateDosage: (medicationId: string, dosage: number, unit: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          dosage,
          dosageUnit: unit,
        };

        if (medication.hasBeenValidated && dosage > 0) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.dosage;
        }

        return updatedMedication;
      }),
    }));
  },

  updateFrequency: (medicationId: string, frequency: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          frequency,
        };

        if (medication.hasBeenValidated && frequency) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.frequency;
        }

        return updatedMedication;
      }),
    }));
  },

  updateRoute: (medicationId: string, route: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          route,
        };

        if (medication.hasBeenValidated && route) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.route;
        }

        return updatedMedication;
      }),
    }));
  },

  updateDuration: (medicationId: string, duration: number, unit: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        const updatedMedication = {
          ...medication,
          duration,
          durationUnit: unit,
        };

        if (medication.hasBeenValidated && duration > 0) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.duration;
        }

        return updatedMedication;
      }),
    }));
  },

  updateTiming: (medicationId: string, timing: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          timing,
        };
      }),
    }));
  },

  updateFlags: (medicationId: string, isSTAT: boolean, isPRN: boolean) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          isSTAT,
          isPRN,
        };
      }),
    }));
  },

  updateStartDate: (medicationId: string, date: string) => {
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

  updateInstructions: (medicationId: string, instructions: string) => {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          instructions,
        };
      }),
    }));
  },

  calculateTotalQuantity: (medicationId: string) => {
    const state = get();
    const medication = state.selectedMedications.find(m => m.id === medicationId);
    
    if (!medication) return 0;

    const frequencyOption = FREQUENCY_OPTIONS.find(f => f.code === medication.frequency);
    const durationOption = DURATION_UNIT_OPTIONS.find(d => d.code === medication.durationUnit);
    
    if (!frequencyOption || !durationOption) return 0;

    const timesPerDay = frequencyOption.timesPerDay;
    const totalDays = medication.duration * durationOption.daysMultiplier;
    
    return Math.ceil(medication.dosage * timesPerDay * totalDays);
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

        if (!medication.frequency) {
          errors.frequency = 'MEDICATION_FREQUENCY_REQUIRED';
          isValid = false;
        } else {
          delete errors.frequency;
        }

        if (!medication.route) {
          errors.route = 'MEDICATION_ROUTE_REQUIRED';
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
