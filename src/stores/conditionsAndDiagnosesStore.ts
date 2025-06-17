import { create } from 'zustand';
import { Coding } from 'fhir/r4';
import { ConceptSearch } from '@types/concepts';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { ConditionInputEntry } from '@types/condition';

/**
 * Interface defining the state and actions for managing conditions and diagnoses
 */
export interface ConditionsAndDiagnosesState {
  selectedDiagnoses: DiagnosisInputEntry[];
  selectedConditions: ConditionInputEntry[];

  /**
   * Adds a new diagnosis to the selected diagnoses list
   * @param diagnosis - The concept search result to add as diagnosis
   */
  addDiagnosis: (diagnosis: ConceptSearch) => void;

  /**
   * Removes a diagnosis from the selected diagnoses list
   * @param diagnosisId - The ID of the diagnosis to remove
   */
  removeDiagnosis: (diagnosisId: string) => void;

  /**
   * Updates the certainty level for a specific diagnosis
   * @param diagnosisId - The ID of the diagnosis to update
   * @param certainty - The certainty coding to set
   */
  updateCertainty: (diagnosisId: string, certainty: Coding | null) => void;

  /**
   * Validates all selected diagnoses and conditions
   * @returns True if all diagnoses and conditions are valid, false otherwise
   */
  validate: () => boolean;

  /**
   * Moves a diagnosis from diagnoses list to conditions list
   * @param diagnosisId - The ID of the diagnosis to mark as condition
   * @returns True if successfully marked as condition, false otherwise
   */
  markAsCondition: (diagnosisId: string) => boolean;

  /**
   * Removes a condition from the selected conditions list
   * @param conditionId - The ID of the condition to remove
   */
  removeCondition: (conditionId: string) => void;

  /**
   * Updates the duration and its unit for a specific condition
   * @param conditionId - The ID of the condition to update
   * @param value - The duration value
   * @param unit - The duration unit (days, months, years)
   */
  updateConditionDuration: (
    conditionId: string,
    value: number | null,
    unit: 'days' | 'months' | 'years' | null,
  ) => void;

  /**
   * Resets the store to its initial state
   */
  reset: () => void;

  /**
   * Gets the current state of the store
   * @returns The current state
   */
  getState: () => ConditionsAndDiagnosesState;
}

/**
 * Validation helper functions
 */
const validateDiagnosisId = (id: string): boolean => {
  return typeof id === 'string' && id.trim().length > 0;
};

const validateConcept = (concept: ConceptSearch): boolean => {
  return !!(
    concept &&
    concept.conceptUuid &&
    concept.conceptName &&
    concept.conceptUuid.trim().length > 0 &&
    concept.conceptName.trim().length > 0
  );
};

export const useConditionsAndDiagnosesStore =
  create<ConditionsAndDiagnosesState>((set, get) => ({
    selectedDiagnoses: [],
    selectedConditions: [],

    addDiagnosis: (diagnosis: ConceptSearch) => {
      // Input validation
      if (!validateConcept(diagnosis)) {
        return;
      }

      // Check for duplicates
      const state = get();
      const isDuplicate = state.selectedDiagnoses.some(
        (d) => d.id === diagnosis.conceptUuid,
      );

      if (isDuplicate) {
        return;
      }

      const newDiagnosis: DiagnosisInputEntry = {
        id: diagnosis.conceptUuid,
        display: diagnosis.conceptName,
        selectedCertainty: null,
        errors: {},
        hasBeenValidated: false,
      };

      set((state) => ({
        selectedDiagnoses: [newDiagnosis, ...state.selectedDiagnoses],
      }));
    },

    removeDiagnosis: (diagnosisId: string) => {
      if (!validateDiagnosisId(diagnosisId)) {
        return;
      }

      set((state) => ({
        selectedDiagnoses: state.selectedDiagnoses.filter(
          (diagnosis) => diagnosis.id !== diagnosisId,
        ),
      }));
    },

    updateCertainty: (diagnosisId: string, certainty: Coding | null) => {
      if (!validateDiagnosisId(diagnosisId)) {
        return;
      }

      set((state) => ({
        selectedDiagnoses: state.selectedDiagnoses.map((diagnosis) => {
          if (diagnosis.id !== diagnosisId) return diagnosis;

          const updatedDiagnosis = {
            ...diagnosis,
            selectedCertainty: certainty,
          };

          if (diagnosis.hasBeenValidated && certainty) {
            updatedDiagnosis.errors = { ...diagnosis.errors };
            delete updatedDiagnosis.errors.certainty;
          }

          return updatedDiagnosis;
        }),
      }));
    },

    validate: () => {
      let diagnosesValid = true;
      let conditionsValid = true;

      set((state) => ({
        selectedDiagnoses: state.selectedDiagnoses.map((diagnosis) => {
          const errors = { ...diagnosis.errors };

          if (!diagnosis.selectedCertainty) {
            errors.certainty = 'DROPDOWN_VALUE_REQUIRED';
            diagnosesValid = false;
          } else {
            delete errors.certainty;
          }

          return {
            ...diagnosis,
            errors,
            hasBeenValidated: true,
          };
        }),
      }));

      set((state) => ({
        selectedConditions: state.selectedConditions.map((condition) => {
          const errors = { ...condition.errors };

          if (!condition.durationValue) {
            errors.durationValue = 'CONDITIONS_DURATION_VALUE_REQUIRED';
            conditionsValid = false;
          } else {
            delete errors.durationValue;
          }

          if (!condition.durationUnit) {
            errors.durationUnit = 'CONDITIONS_DURATION_UNIT_REQUIRED';
            conditionsValid = false;
          } else {
            delete errors.durationUnit;
          }

          return {
            ...condition,
            errors,
            hasBeenValidated: true,
          };
        }),
      }));

      // Return overall validation result
      return diagnosesValid && conditionsValid;
    },

    markAsCondition: (diagnosisId: string) => {
      if (!validateDiagnosisId(diagnosisId)) {
        return false;
      }

      const state = get();
      const existingCondition = state.selectedConditions.find(
        (condition) => condition.id === diagnosisId,
      );

      if (existingCondition) {
        return false;
      }

      const diagnosis = state.selectedDiagnoses.find(
        (d) => d.id === diagnosisId,
      );
      if (!diagnosis) {
        return false;
      }

      const newCondition: ConditionInputEntry = {
        id: diagnosis.id,
        display: diagnosis.display,
        durationValue: null,
        durationUnit: null,
        errors: {},
        hasBeenValidated: false,
      };

      set((state) => ({
        selectedDiagnoses: state.selectedDiagnoses.filter(
          (d) => d.id !== diagnosisId,
        ),
        selectedConditions: [newCondition, ...state.selectedConditions],
      }));

      return true;
    },

    removeCondition: (conditionId: string) => {
      if (!validateDiagnosisId(conditionId)) {
        return;
      }

      set((state) => ({
        selectedConditions: state.selectedConditions.filter(
          (condition) => condition.id !== conditionId,
        ),
      }));
    },

    updateConditionDuration: (
      conditionId: string,
      value: number | null,
      unit: 'days' | 'months' | 'years' | null,
    ) => {
      if (!validateDiagnosisId(conditionId)) {
        return;
      }

      if (
        value !== null &&
        (typeof value !== 'number' || value <= 0 || !Number.isInteger(value))
      ) {
        return;
      }

      const validUnits = ['days', 'months', 'years'];
      if (unit !== null && !validUnits.includes(unit)) {
        return;
      }

      set((state) => ({
        selectedConditions: state.selectedConditions.map((condition) => {
          if (condition.id !== conditionId) return condition;

          const updatedCondition = {
            ...condition,
            durationValue: value,
            durationUnit: unit,
          };

          if (condition.hasBeenValidated) {
            updatedCondition.errors = { ...condition.errors };
            if (value) {
              delete updatedCondition.errors.durationValue;
            }
            if (unit) {
              delete updatedCondition.errors.durationUnit;
            }
          }

          return updatedCondition;
        }),
      }));
    },

    reset: () => {
      set({ selectedDiagnoses: [], selectedConditions: [] });
    },

    getState: () => get(),
  }));

export default useConditionsAndDiagnosesStore;
