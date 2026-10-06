import { create } from 'zustand';

export interface DispositionType {
  value: string;
  label: string;
}

export interface DispositionState {
  selectedType: DispositionType | null;
  date: Date | null;
  notes: string;
  errors: Record<string, string>;

  setSelectedType: (type: DispositionType | null) => void;
  setDate: (date: Date | null) => void;
  setNotes: (notes: string) => void;

  /**
   * Validates the current selection. Type is mandatory; Done is blocked
   * without it (AC #9).
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

  validate: () => {
    const state = get();
    const errors = { ...state.errors };
    let isValid = true;

    if (!state.selectedType) {
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
    set({ selectedType: null, date: null, notes: '', errors: {} });
  },
}));

export default useDispositionStore;
