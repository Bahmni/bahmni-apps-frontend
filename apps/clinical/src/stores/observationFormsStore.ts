import { ObservationForm, ObservationDataInFormControls } from '@bahmni/services';
import { create } from 'zustand';

export interface ObservationFormData {
  formUuid: string;
  formName: string;
  observations: ObservationDataInFormControls[];
  timestamp: number;
}

export interface ObservationFormsState {
  selectedForms: ObservationForm[];
  formsData: Record<string, ObservationFormData>;
  viewingForm: ObservationForm | null;
  addForm: (form: ObservationForm) => void;
  removeForm: (formUuid: string) => void;
  updateFormData: (
    formUuid: string,
    observations: ObservationDataInFormControls[],
  ) => void;
  getFormData: (formUuid: string) => ObservationDataInFormControls[] | undefined;
  setViewingForm: (form: ObservationForm | null) => void;
  getAllObservations: () => ObservationDataInFormControls[];
  getObservationFormsData: () => Record<string, ObservationDataInFormControls[]>;
  validate: () => boolean;
  reset: () => void;
  getState: () => ObservationFormsState;
}

const validateForm = (form: ObservationForm): boolean => {
  return !!(form?.uuid && form.name && form.uuid.trim().length > 0);
};

const validateFormUuid = (uuid: string): boolean => {
  return typeof uuid === 'string' && uuid.trim().length > 0;
};

export const useObservationFormsStore = create<ObservationFormsState>(
  (set, get) => ({
    selectedForms: [],
    formsData: {},
    viewingForm: null,

    addForm: (form: ObservationForm) => {
      if (!validateForm(form)) {
        return;
      }

      const state = get();
      const isDuplicate = state.selectedForms.some((f) => f.uuid === form.uuid);

      if (isDuplicate) {
        set({ viewingForm: form });
        return;
      }

      set((state) => ({
        selectedForms: [...state.selectedForms, form],
        viewingForm: form,
      }));
    },

    removeForm: (formUuid: string) => {
      if (!validateFormUuid(formUuid)) {
        return;
      }

      set((state) => {
        const selectedForms = state.selectedForms.filter(
          (form) => form.uuid !== formUuid,
        );

        const formsData = { ...state.formsData };
        delete formsData[formUuid];

        const viewingForm =
          state.viewingForm?.uuid === formUuid ? null : state.viewingForm;

        return {
          selectedForms,
          formsData,
          viewingForm,
        };
      });
    },

    updateFormData: (formUuid: string, observations: ObservationDataInFormControls[]) => {
      if (!validateFormUuid(formUuid)) {
        return;
      }

      const state = get();
      const form = state.selectedForms.find((f) => f.uuid === formUuid);

      if (!form) {
        return;
      }

      set((state) => ({
        formsData: {
          ...state.formsData,
          [formUuid]: {
            formUuid,
            formName: form.name,
            observations,
            timestamp: Date.now(),
          },
        },
      }));
    },

    getFormData: (formUuid: string) => {
      if (!validateFormUuid(formUuid)) {
        return undefined;
      }

      const state = get();
      return state.formsData[formUuid]?.observations;
    },

    setViewingForm: (form: ObservationForm | null) => {
      if (form && !validateForm(form)) {
        return;
      }

      set({ viewingForm: form });
    },

    getAllObservations: () => {
      const state = get();
      const allObservations: ObservationDataInFormControls[] = [];

      Object.values(state.formsData).forEach((formData) => {
        allObservations.push(...formData.observations);
      });

      return allObservations;
    },

    getObservationFormsData: () => {
      const state = get();
      const result: Record<string, ObservationDataInFormControls[]> = {};

      Object.entries(state.formsData).forEach(([formUuid, formData]) => {
        result[formUuid] = formData.observations;
      });

      return result;
    },

    validate: () => {
      const state = get();

      for (const form of state.selectedForms) {
        const formData = state.formsData[form.uuid];
        if (!formData || formData.observations.length === 0) {
          return false;
        }
      }

      return true;
    },

    reset: () => {
      set({
        selectedForms: [],
        formsData: {},
        viewingForm: null,
      });
    },

    getState: () => get(),
  }),
);

export default useObservationFormsStore;
