import { CANCEL_VACCINATION_INPUT_CONTROL_KEY } from '@bahmni/widgets';
import { MedicationRequest } from 'fhir/r4';
import { create } from 'zustand';
import { StopMedicationConfig } from '../models/medicationConfig';
import { StopReason } from '../services/stopMedicationService';

export interface StopMedicationState {
  stopDate: Date;
  stopReason: StopReason | null;
  note: string;
  medicationToStop: MedicationRequest | null;
  fieldConfig: StopMedicationConfig;
  errors: Record<string, string>;
  inputControlKey: string;

  setStopDate: (date: Date) => void;
  setStopReason: (reason: StopReason | null) => void;
  setNote: (note: string) => void;
  setMedicationToStop: (medication: MedicationRequest | null) => void;
  setFieldConfig: (config: StopMedicationConfig) => void;
  setInputControlKey: (key: string) => void;
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
    inputControlKey: 'stopMedications',

    setStopDate: (date: Date) => {
      set((state) => {
        const errors = { ...state.errors };
        if (date) delete errors.stopDate;
        return { stopDate: date, errors };
      });
    },

    setStopReason: (reason: StopReason | null) => {
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

    setInputControlKey: (key: string) => {
      set({ inputControlKey: key });
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

    validate: () => {
      const state = get();
      if (!state.medicationToStop) return true;

      const isCancelVaccination =
        state.inputControlKey === CANCEL_VACCINATION_INPUT_CONTROL_KEY;
      const errors: Record<string, string> = {};
      const config = state.fieldConfig;
      let isValid = true;

      if (
        config.stopDate?.isVisible !== false &&
        config.stopDate?.isMandatory &&
        !state.stopDate
      ) {
        errors.stopDate = 'STOP_MEDICATION_DATE_REQUIRED';
        isValid = false;
      }

      if (
        config.stopReason?.isVisible !== false &&
        config.stopReason?.isMandatory &&
        !state.stopReason
      ) {
        errors.stopReason = isCancelVaccination
          ? 'CANCEL_VACCINATION_REASON_REQUIRED'
          : 'STOP_MEDICATION_REASON_REQUIRED';
        isValid = false;
      }

      if (
        config.note?.isVisible !== false &&
        config.note?.isMandatory &&
        !state.note
      ) {
        errors.note = 'STOP_MEDICATION_NOTE_REQUIRED';
        isValid = false;
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
        inputControlKey: 'stopMedications',
      });
    },
  }),
);

export default useStopMedicationStore;
