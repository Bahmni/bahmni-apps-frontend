import { generateUUID } from '@bahmni/services';
import { Medication } from 'fhir/r4';
import { create } from 'zustand';
import { Concept } from '../models/encounterConcepts';
import { DurationUnitOption, MedicationInputEntry } from '../models/medication';
import { Frequency } from '../models/medicationConfig';
import { extractDoseForm } from '../utils/fhir/medicationUtilities';

export interface MedicationState {
  selectedMedications: MedicationInputEntry[];
  originalEditSnapshots: Map<string, MedicationInputEntry>;
  hasEditChanges: () => boolean;

  addMedication: (medication: Medication, displayName: string) => void;
  loadMedicationsForEdit: (entries: MedicationInputEntry[]) => void;
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
  updateNote: (medicationId: string, note: string) => void;
  validateAllMedications: () => boolean;

  reset: () => void;
  getState: () => MedicationState;
}
function hasMedicationChanged(
  current: MedicationInputEntry,
  original: MedicationInputEntry,
): boolean {
  return (
    current.dosage !== original.dosage ||
    current.dosageUnit?.uuid !== original.dosageUnit?.uuid ||
    current.frequency?.uuid !== original.frequency?.uuid ||
    current.route?.uuid !== original.route?.uuid ||
    current.duration !== original.duration ||
    current.durationUnit?.code !== original.durationUnit?.code ||
    current.instruction?.uuid !== original.instruction?.uuid ||
    current.isPRN !== original.isPRN ||
    current.isSTAT !== original.isSTAT ||
    current.dispenseQuantity !== original.dispenseQuantity ||
    current.dispenseUnit?.uuid !== original.dispenseUnit?.uuid ||
    (current.note ?? '') !== (original.note ?? '') ||
    current.startDate?.toDateString() !== original.startDate?.toDateString()
  );
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  selectedMedications: [],
  originalEditSnapshots: new Map(),

  hasEditChanges: () => {
    const { selectedMedications, originalEditSnapshots } = get();
    if (selectedMedications.some((m) => !m.fhirResourceId)) return true;
    return selectedMedications.some((m) => {
      const original = originalEditSnapshots.get(m.id);
      if (!original) return true;
      return hasMedicationChanged(m, original);
    });
  },

  addMedication: (medication: Medication, displayName: string) => {
    const doseForm = extractDoseForm(medication, displayName);

    // Use a unique ID combining medication ID and UUID to ensure each entry is distinct
    // This allows adding the same medication multiple times without state conflicts
    const newMedication: MedicationInputEntry = {
      id: `${medication.id!}-${generateUUID()}`,
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
      doseForm: doseForm,
      note: '',
    };

    set((state) => ({
      selectedMedications: [newMedication, ...state.selectedMedications],
    }));
  },

  loadMedicationsForEdit: (entries: MedicationInputEntry[]) => {
    set((state) => {
      const existingIds = new Set(state.selectedMedications.map((m) => m.id));
      const newEntries = entries.filter((e) => !existingIds.has(e.id));
      const updatedSnapshots = new Map(state.originalEditSnapshots);
      for (const entry of newEntries) {
        if (!updatedSnapshots.has(entry.id)) {
          updatedSnapshots.set(entry.id, {
            ...entry,
            startDate: entry.startDate
              ? new Date(entry.startDate.getTime())
              : undefined,
          });
        }
      }
      return {
        selectedMedications: [...state.selectedMedications, ...newEntries],
        originalEditSnapshots: updatedSnapshots,
      };
    });
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

        const updatedMedication = {
          ...medication,
          isSTAT,
        };
        if (medication.hasBeenValidated && isSTAT) {
          updatedMedication.errors = { ...medication.errors };
          delete updatedMedication.errors.durationUnit;
          delete updatedMedication.errors.duration;
        }

        return updatedMedication;
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

  updateNote(medicationId: string, note: string) {
    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        if (medication.id !== medicationId) return medication;

        return {
          ...medication,
          note: note,
        };
      }),
    }));
  },

  validateAllMedications: () => {
    let isValid = true;

    set((state) => ({
      selectedMedications: state.selectedMedications.map((medication) => {
        const errors = { ...medication.errors };
        const isDurationRequired =
          (!medication.isSTAT && medication.isPRN) ||
          (!medication.isPRN && !medication.isSTAT);

        if (!medication.dosage || medication.dosage <= 0) {
          errors.dosage = 'INPUT_VALUE_REQUIRED';
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

        if (
          isDurationRequired &&
          (!medication.duration || medication.duration <= 0)
        ) {
          errors.duration = 'INPUT_VALUE_REQUIRED';
          isValid = false;
        } else {
          delete errors.duration;
        }
        if (isDurationRequired && !medication.durationUnit) {
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
    set({ selectedMedications: [], originalEditSnapshots: new Map() });
  },

  getState: () => get(),
}));

export default useMedicationStore;
