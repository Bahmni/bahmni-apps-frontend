/**
 * Patient Form Wizard Context
 * Manages wizard state, navigation, and validation across all steps
 */
import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { PatientFormData } from '../../../types/registration';

// Wizard step definitions
export const WIZARD_STEPS = [
  { id: 'demographics', label: 'Demographics', order: 1 },
  { id: 'identifiers', label: 'Identifiers', order: 2 },
  { id: 'address', label: 'Address', order: 3 },
  { id: 'attributes', label: 'Attributes', order: 4 },
  { id: 'photo', label: 'Photo', order: 5 },
  { id: 'summary', label: 'Summary', order: 6 },
] as const;

export type WizardStepId = typeof WIZARD_STEPS[number]['id'];

export interface WizardStepValidation {
  isValid: boolean;
  errors: string[];
  isComplete: boolean;
}

export interface WizardState {
  currentStep: WizardStepId;
  completedSteps: Set<WizardStepId>;
  stepValidations: Record<WizardStepId, WizardStepValidation>;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
}

export interface WizardActions {
  goToStep: (stepId: WizardStepId) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  markStepCompleted: (stepId: WizardStepId) => void;
  setStepValidation: (stepId: WizardStepId, validation: WizardStepValidation) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  resetWizard: () => void;
}

export interface WizardContextValue {
  state: WizardState;
  actions: WizardActions;
  canGoToStep: (stepId: WizardStepId) => boolean;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
  getCurrentStepIndex: () => number;
  getTotalSteps: () => number;
  getProgressPercentage: () => number;
  getStepInfo: (stepId: WizardStepId) => typeof WIZARD_STEPS[number] | undefined;
}

const PatientFormWizardContext = createContext<WizardContextValue | null>(null);

export interface PatientFormWizardProviderProps {
  children: React.ReactNode;
  initialStep?: WizardStepId;
  mode?: 'create' | 'edit';
  initialData?: Partial<PatientFormData>;
}

export const PatientFormWizardProvider: React.FC<PatientFormWizardProviderProps> = ({
  children,
  initialStep = 'demographics',
  mode = 'create',
  initialData,
}) => {
  const [state, setState] = useState<WizardState>({
    currentStep: initialStep,
    completedSteps: new Set(),
    stepValidations: {
      demographics: { isValid: false, errors: [], isComplete: false },
      identifiers: { isValid: false, errors: [], isComplete: false },
      address: { isValid: false, errors: [], isComplete: false },
      attributes: { isValid: false, errors: [], isComplete: false },
      photo: { isValid: true, errors: [], isComplete: false }, // Photo is optional
      summary: { isValid: false, errors: [], isComplete: false },
    },
    isSubmitting: false,
    hasUnsavedChanges: false,
  });

  const getCurrentStepIndex = useCallback(() => {
    return WIZARD_STEPS.findIndex(step => step.id === state.currentStep);
  }, [state.currentStep]);

  const getTotalSteps = useCallback(() => {
    return WIZARD_STEPS.length;
  }, []);

  const getProgressPercentage = useCallback(() => {
    const completedCount = state.completedSteps.size;
    const totalSteps = getTotalSteps();
    return Math.round((completedCount / totalSteps) * 100);
  }, [state.completedSteps, getTotalSteps]);

  const getStepInfo = useCallback((stepId: WizardStepId) => {
    return WIZARD_STEPS.find(step => step.id === stepId);
  }, []);

  const canGoToStep = useCallback((stepId: WizardStepId) => {
    const targetStep = getStepInfo(stepId);
    if (!targetStep) return false;

    const currentStepIndex = getCurrentStepIndex();
    const targetStepIndex = targetStep.order - 1;

    // Can always go to previous steps
    if (targetStepIndex <= currentStepIndex) return true;

    // Can only go to next step if all previous steps are completed
    for (let i = 0; i < targetStepIndex; i++) {
      const stepId = WIZARD_STEPS[i].id;
      if (!state.completedSteps.has(stepId)) return false;
    }

    return true;
  }, [state.completedSteps, getCurrentStepIndex, getStepInfo]);

  const canGoNext = useCallback(() => {
    const currentStepIndex = getCurrentStepIndex();
    if (currentStepIndex >= WIZARD_STEPS.length - 1) return false;

    const currentStepId = WIZARD_STEPS[currentStepIndex].id;
    return state.stepValidations[currentStepId].isValid;
  }, [getCurrentStepIndex, state.stepValidations]);

  const canGoPrevious = useCallback(() => {
    const currentStepIndex = getCurrentStepIndex();
    return currentStepIndex > 0;
  }, [getCurrentStepIndex]);

  const goToStep = useCallback((stepId: WizardStepId) => {
    if (!canGoToStep(stepId)) return;

    setState(prev => ({
      ...prev,
      currentStep: stepId,
    }));
  }, [canGoToStep]);

  const goToNextStep = useCallback(() => {
    if (!canGoNext()) return;

    const currentStepIndex = getCurrentStepIndex();
    const nextStep = WIZARD_STEPS[currentStepIndex + 1];
    if (nextStep) {
      goToStep(nextStep.id);
    }
  }, [canGoNext, getCurrentStepIndex, goToStep]);

  const goToPreviousStep = useCallback(() => {
    if (!canGoPrevious()) return;

    const currentStepIndex = getCurrentStepIndex();
    const previousStep = WIZARD_STEPS[currentStepIndex - 1];
    if (previousStep) {
      goToStep(previousStep.id);
    }
  }, [canGoPrevious, getCurrentStepIndex, goToStep]);

  const markStepCompleted = useCallback((stepId: WizardStepId) => {
    setState(prev => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(stepId);
      return {
        ...prev,
        completedSteps: newCompletedSteps,
      };
    });
  }, []);

  const setStepValidation = useCallback((stepId: WizardStepId, validation: WizardStepValidation) => {
    setState(prev => ({
      ...prev,
      stepValidations: {
        ...prev.stepValidations,
        [stepId]: validation,
      },
    }));

    // Auto-mark step as completed if it's valid and complete
    if (validation.isValid && validation.isComplete) {
      markStepCompleted(stepId);
    }
  }, [markStepCompleted]);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting,
    }));
  }, []);

  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
    }));
  }, []);

  const resetWizard = useCallback(() => {
    setState({
      currentStep: initialStep,
      completedSteps: new Set(),
      stepValidations: {
        demographics: { isValid: false, errors: [], isComplete: false },
        identifiers: { isValid: false, errors: [], isComplete: false },
        address: { isValid: false, errors: [], isComplete: false },
        attributes: { isValid: false, errors: [], isComplete: false },
        photo: { isValid: true, errors: [], isComplete: false },
        summary: { isValid: false, errors: [], isComplete: false },
      },
      isSubmitting: false,
      hasUnsavedChanges: false,
    });
  }, [initialStep]);

  const actions = useMemo<WizardActions>(() => ({
    goToStep,
    goToNextStep,
    goToPreviousStep,
    markStepCompleted,
    setStepValidation,
    setSubmitting,
    setUnsavedChanges,
    resetWizard,
  }), [
    goToStep,
    goToNextStep,
    goToPreviousStep,
    markStepCompleted,
    setStepValidation,
    setSubmitting,
    setUnsavedChanges,
    resetWizard,
  ]);

  const contextValue = useMemo<WizardContextValue>(() => ({
    state,
    actions,
    canGoToStep,
    canGoNext,
    canGoPrevious,
    getCurrentStepIndex,
    getTotalSteps,
    getProgressPercentage,
    getStepInfo,
  }), [
    state,
    actions,
    canGoToStep,
    canGoNext,
    canGoPrevious,
    getCurrentStepIndex,
    getTotalSteps,
    getProgressPercentage,
    getStepInfo,
  ]);

  return (
    <PatientFormWizardContext.Provider value={contextValue}>
      {children}
    </PatientFormWizardContext.Provider>
  );
};

export const usePatientFormWizard = (): WizardContextValue => {
  const context = useContext(PatientFormWizardContext);
  if (!context) {
    throw new Error('usePatientFormWizard must be used within a PatientFormWizardProvider');
  }
  return context;
};
