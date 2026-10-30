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
  isDateRequired: boolean;
  isNotesRequired: boolean;
  activeOrderByType: Record<string, boolean>;

  setSelectedType: (type: DispositionType | null) => void;
  setDate: (date: Date | null) => void;
  setNotes: (notes: string) => void;
  setHasActiveOrder: (type: string, hasActiveOrder: boolean) => void;

  /**
   * Driven by standard-config's `attributes: [{ name: "type", required }]`
   * entry for the disposition input control, not hardcoded here.
   */
  setTypeRequired: (required: boolean) => void;
  setDateRequired: (required: boolean) => void;
  setNotesRequired: (required: boolean) => void;

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
  isDateRequired: false,
  isNotesRequired: false,
  activeOrderByType: {},

  setSelectedType: (type: DispositionType | null) => {
    set((state) => {
      const errors = { ...state.errors };
      if (type) delete errors.type;
      return { selectedType: type, notes: '', errors };
    });
  },

  setHasActiveOrder: (type: string, hasActiveOrder: boolean) => {
    set((state) => ({
      activeOrderByType: { ...state.activeOrderByType, [type]: hasActiveOrder },
    }));
  },

  setDate: (date: Date | null) => {
    set((state) => {
      const errors = { ...state.errors };
      if (date) delete errors.date;
      return { date, errors };
    });
  },

  setNotes: (notes: string) => {
    set((state) => {
      const errors = { ...state.errors };
      if (notes.trim()) delete errors.notes;
      return { notes, errors };
    });
  },

  setTypeRequired: (required: boolean) => {
    set({ isTypeRequired: required });
  },

  setDateRequired: (required: boolean) => {
    set({ isDateRequired: required });
  },

  setNotesRequired: (required: boolean) => {
    set({ isNotesRequired: required });
  },

  validate: () => {
    const state = get();
    const errors = { ...state.errors };
    let isValid = true;

    const activeOrderErrorKeyByType: Record<string, string> = {
      ADMIT: 'DISPOSITION_ACTIVE_ADMIT_ORDER_EXISTS',
      DISCHARGE: 'DISPOSITION_ACTIVE_DISCHARGE_ORDER_EXISTS',
    };

    if (state.isTypeRequired && !state.selectedType) {
      errors.type = 'DROPDOWN_VALUE_REQUIRED';
      isValid = false;
    } else if (
      state.selectedType &&
      activeOrderErrorKeyByType[state.selectedType.value] &&
      state.activeOrderByType[state.selectedType.value]
    ) {
      errors.type = activeOrderErrorKeyByType[state.selectedType.value];
      isValid = false;
    } else {
      delete errors.type;
    }

    if (state.isDateRequired && !state.date) {
      errors.date = 'DISPOSITION_DATE_REQUIRED';
      isValid = false;
    } else {
      delete errors.date;
    }

    if (state.isNotesRequired && !state.notes.trim()) {
      errors.notes = 'DISPOSITION_NOTES_REQUIRED';
      isValid = false;
    } else {
      delete errors.notes;
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
      isDateRequired: state.isDateRequired,
      isNotesRequired: state.isNotesRequired,
    }));
  },
}));

export default useDispositionStore;
