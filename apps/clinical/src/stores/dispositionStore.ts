import { create } from 'zustand';

export interface DispositionType {
  value: string;
  label: string;
  conceptUuid?: string;
}

export interface DispositionState {
  selectedType: DispositionType | null;
  date: Date | null;
  notes: string;
  errors: Record<string, string>;
  isTypeRequired: boolean;

  setSelectedType: (type: DispositionType | null) => void;
  setDate: (date: Date | null) => void;
  setNotes: (notes: string) => void;

  /**
   * Driven by standard-config's `attributes: [{ name: "type", required }]`
   * entry for the disposition input control, not hardcoded here.
   */
  setTypeRequired: (required: boolean) => void;

  /**
   * Validates the current selection. Whether Type is mandatory comes from
   * config via setTypeRequired (defaults to required).
   */
  validate: () => boolean;

  /**
   * Returns true when the user has made any selection, used by the
   * consultation pad to decide whether to include this control while
   * capturing updated resources.
   */
  hasData: () => boolean;

  reset: () => void;
}

export const useDispositionStore = create<DispositionState>((set, get) => ({
  selectedType: null,
  date: null,
  notes: '',
  errors: {},
  isTypeRequired: true,

  setSelectedType: (type: DispositionType | null) => {
    set((state) => {
      const errors = { ...state.errors };
      if (type) delete errors.type;
      return { selectedType: type, notes: '', errors };
    });
  },

  setDate: (date: Date | null) => {
    set({ date });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  setTypeRequired: (required: boolean) => {
    set({ isTypeRequired: required });
  },

  validate: () => {
    const state = get();
    const errors = { ...state.errors };
    let isValid = true;

    if (state.isTypeRequired && !state.selectedType) {
      errors.type = 'DROPDOWN_VALUE_REQUIRED';
      isValid = false;
    } else {
      delete errors.type;
    }

    set({ errors });
    return isValid;
  },

  hasData: () => {
    const state = get();
    return !!state.selectedType;
  },

  reset: () => {
    set((state) => ({
      selectedType: null,
      date: null,
      notes: '',
      errors: {},
      isTypeRequired: state.isTypeRequired,
    }));
  },
}));

export default useDispositionStore;
