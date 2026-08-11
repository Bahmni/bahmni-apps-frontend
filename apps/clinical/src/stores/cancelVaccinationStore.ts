import { MedicationRequest } from 'fhir/r4';
import { create } from 'zustand';

export interface CancelVaccinationFieldConfig {
  isVisible?: boolean;
  isMandatory?: boolean;
}

export interface CancelVaccinationConfig {
  cancellationReason?: CancelVaccinationFieldConfig;
  note?: CancelVaccinationFieldConfig;
}

export interface CancelVaccinationState {
  cancellationReason: string | null;
  note: string;
  medicationToCancel: MedicationRequest | null;
  fieldConfig: CancelVaccinationConfig;
  errors: Record<string, string>;

  setCancellationReason: (reason: string | null) => void;
  setNote: (note: string) => void;
  setMedicationToCancel: (medication: MedicationRequest | null) => void;
  setFieldConfig: (config: CancelVaccinationConfig) => void;
  validate: () => boolean;
  hasData: () => boolean;
  reset: () => void;
}

const DEFAULT_FIELD_CONFIG: CancelVaccinationConfig = {
  cancellationReason: { isVisible: true, isMandatory: true },
  note: { isVisible: true, isMandatory: false },
};

export const useCancelVaccinationStore = create<CancelVaccinationState>(
  (set, get) => ({
    cancellationReason: null,
    note: '',
    medicationToCancel: null,
    fieldConfig: DEFAULT_FIELD_CONFIG,
    errors: {},

    setCancellationReason: (reason: string | null) => {
      set((state) => {
        const errors = { ...state.errors };
        if (reason) delete errors.cancellationReason;
        return { cancellationReason: reason, errors };
      });
    },

    setNote: (note: string) => {
      set((state) => {
        const errors = { ...state.errors };
        if (note) delete errors.note;
        return { note, errors };
      });
    },

    setMedicationToCancel: (medication: MedicationRequest | null) => {
      set({ medicationToCancel: medication });
    },

    setFieldConfig: (config: CancelVaccinationConfig) => {
      set({
        fieldConfig: {
          cancellationReason: {
            ...DEFAULT_FIELD_CONFIG.cancellationReason,
            ...config.cancellationReason,
          },
          note: { ...DEFAULT_FIELD_CONFIG.note, ...config.note },
        },
      });
    },

    validate: () => {
      const state = get();
      if (!state.medicationToCancel) return true;

      const errors: Record<string, string> = {};
      const cfg = state.fieldConfig;
      let isValid = true;

      if (
        cfg.cancellationReason?.isVisible !== false &&
        cfg.cancellationReason?.isMandatory
      ) {
        if (!state.cancellationReason) {
          errors.cancellationReason =
            'CANCEL_VACCINATION_REASON_REQUIRED';
          isValid = false;
        }
      }

      if (cfg.note?.isVisible !== false && cfg.note?.isMandatory) {
        if (!state.note) {
          errors.note = 'CANCEL_VACCINATION_NOTE_REQUIRED';
          isValid = false;
        }
      }

      set({ errors });
      return isValid;
    },

    hasData: () => {
      const state = get();
      return state.medicationToCancel !== null;
    },

    reset: () => {
      set({
        cancellationReason: null,
        note: '',
        medicationToCancel: null,
        fieldConfig: DEFAULT_FIELD_CONFIG,
        errors: {},
      });
    },
  }),
);

export default useCancelVaccinationStore;
