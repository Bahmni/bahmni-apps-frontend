import {
  type ConceptSearch,
  type ConditionInputEntry,
  type DiagnosisInputEntry,
} from '@bahmni/services';
import { Coding } from 'fhir/r4';
import { create } from 'zustand';
import {
  CONDITION_DURATION_FIELD_KEYS,
  CONDITION_DURATION_REQUIRED_ERROR,
  type ConditionDurationField,
} from '../constants/conditions';
import {
  hasConditionDuration,
  isValidConditionDurationValue,
} from '../utils/conditionDuration';

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
   * Updates one duration field (years, months or days) for a specific condition
   * @param conditionId - The ID of the condition to update
   * @param field - The duration field to update
   * @param value - The non-negative integer value, or null to clear it
   */
  updateConditionDuration: (
    conditionId: string,
    field: ConditionDurationField,
    value: number | null,
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
    concept?.conceptUuid &&
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
        conceptSystem: diagnosis.conceptSystem,
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

          if (!hasConditionDuration(condition)) {
            errors.duration = CONDITION_DURATION_REQUIRED_ERROR;
            conditionsValid = false;
          } else {
            delete errors.duration;
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
        conceptSystem: diagnosis.conceptSystem,
        durationYears: null,
        durationMonths: null,
        durationDays: null,
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
      field: ConditionDurationField,
      value: number | null,
    ) => {
      if (!validateDiagnosisId(conditionId)) {
        return;
      }

      const fieldKey = CONDITION_DURATION_FIELD_KEYS[field];
      if (!fieldKey || !isValidConditionDurationValue(field, value)) {
        return;
      }

      set((state) => ({
        selectedConditions: state.selectedConditions.map((condition) => {
          if (condition.id !== conditionId) return condition;

          const updatedCondition = {
            ...condition,
            [fieldKey]: value,
          };

          if (condition.hasBeenValidated) {
            updatedCondition.errors = { ...condition.errors };
            if (hasConditionDuration(updatedCondition)) {
              delete updatedCondition.errors.duration;
            } else {
              updatedCondition.errors.duration =
                CONDITION_DURATION_REQUIRED_ERROR;
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
