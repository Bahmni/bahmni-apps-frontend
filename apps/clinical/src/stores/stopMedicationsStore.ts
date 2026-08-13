import { MedicationRequest } from 'fhir/r4';
import { create } from 'zustand';
import { StopMedicationConfig } from '../models/medicationConfig';

export interface StopMedicationState {
  stopDate: Date;
  stopReason: string | null;
  note: string;
  medicationToStop: MedicationRequest | null;
  fieldConfig: StopMedicationConfig;
  errors: Record<string, string>;
  isCancelVaccination: boolean;

  setStopDate: (date: Date) => void;
  setStopReason: (reason: string | null) => void;
  setNote: (note: string) => void;
  setMedicationToStop: (medication: MedicationRequest | null) => void;
  setFieldConfig: (config: StopMedicationConfig) => void;
  setIsCancelVaccination: (value: boolean) => void;
  validate: () => boolean;
  hasData: () => boolean;
  reset: () => void;
}

const DEFAULT_FIELD_CONFIG: StopMedicationConfig = {
  stopDate: { isVisible: true, isMandatory: true },
  stopReason: { isVisible: true, isMandatory: true },
  note: { isVisible: true, isMandatory: false },
};

export const useStopMedicationStore = create<StopMedicationState>(
  (set, get) => ({
    stopDate: new Date(),
    stopReason: null,
    note: '',
    medicationToStop: null,
    fieldConfig: DEFAULT_FIELD_CONFIG,
    errors: {},
    isCancelVaccination: false,

    setStopDate: (date: Date) => {
      set((state) => {
        const errors = { ...state.errors };
        if (date) delete errors.stopDate;
        return { stopDate: date, errors };
      });
    },

    setStopReason: (reason: string | null) => {
      set((state) => {
        const errors = { ...state.errors };
        if (reason) delete errors.stopReason;
        return { stopReason: reason, errors };
      });
    },

    setNote: (note: string) => {
      set((state) => {
        const errors = { ...state.errors };
        if (note) delete errors.note;
        return { note, errors };
      });
    },

    setMedicationToStop: (medication: MedicationRequest | null) => {
      set({ medicationToStop: medication });
    },

    setFieldConfig: (config: StopMedicationConfig) => {
      set({
        fieldConfig: {
          stopDate: { ...DEFAULT_FIELD_CONFIG.stopDate, ...config.stopDate },
          stopReason: {
            ...DEFAULT_FIELD_CONFIG.stopReason,
            ...config.stopReason,
          },
          note: { ...DEFAULT_FIELD_CONFIG.note, ...config.note },
        },
      });
    },

    setIsCancelVaccination: (value: boolean) => {
      set({ isCancelVaccination: value });
    },

    validate: () => {
      const state = get();
      // Nothing to validate if no medication is being stopped
      if (!state.medicationToStop) return true;

      const errors: Record<string, string> = {};
      const cfg = state.fieldConfig;
      let isValid = true;

      if (cfg.stopDate?.isVisible !== false && cfg.stopDate?.isMandatory) {
        if (!state.stopDate) {
          errors.stopDate = 'STOP_MEDICATION_DATE_REQUIRED';
          isValid = false;
        }
      }

      if (cfg.stopReason?.isVisible !== false && cfg.stopReason?.isMandatory) {
        if (!state.stopReason) {
          errors.stopReason = 'STOP_MEDICATION_REASON_REQUIRED';
          isValid = false;
        }
      }

      if (cfg.note?.isVisible !== false && cfg.note?.isMandatory) {
        if (!state.note) {
          errors.note = 'STOP_MEDICATION_NOTE_REQUIRED';
          isValid = false;
        }
      }

      set({ errors });
      return isValid;
    },

    hasData: () => {
      const state = get();
      return state.medicationToStop !== null;
    },

    reset: () => {
      set({
        stopDate: new Date(),
        stopReason: null,
        note: '',
        medicationToStop: null,
        fieldConfig: DEFAULT_FIELD_CONFIG,
        errors: {},
        isCancelVaccination: false,
      });
    },
  }),
);

export default useStopMedicationStore;
