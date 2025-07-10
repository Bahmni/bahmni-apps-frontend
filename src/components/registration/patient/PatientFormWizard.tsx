/**
 * Patient Form Wizard
 * Multi-step form wizard for patient creation and editing
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatientForm } from '../../../hooks/usePatientForm';
import { useNotification } from '../../../hooks/useNotification';
import {
  PatientFormWizardProvider,
  usePatientFormWizard,
  WIZARD_STEPS,
  WizardStepId,
} from './PatientFormWizardContext';
import { PatientFormData } from '../../../types/registration';
import './PatientFormWizard.module.scss';

// Step components (will be created)
const PatientDemographicsForm = React.lazy(
  () => import('./PatientDemographicsForm'),
);
const IdentifierForm = React.lazy(() => import('./IdentifierForm'));
const AddressForm = React.lazy(() => import('./AddressForm'));
const PersonAttributesForm = React.lazy(() => import('./PersonAttributesForm'));
const PatientPhotoCapture = React.lazy(() => import('./PatientPhotoCapture'));
const FormSummary = React.lazy(() => import('./FormSummary'));

interface PatientFormWizardProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<PatientFormData>;
  onSuccess?: (patient: any) => void;
  onCancel?: () => void;
}

const PatientFormWizardContent: React.FC<PatientFormWizardProps> = ({
  mode = 'create',
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [showExitModal, setShowExitModal] = useState(false);

  const wizard = usePatientFormWizard();
  const {
    state: wizardState,
    actions: wizardActions,
    canGoNext,
    canGoPrevious,
    getProgressPercentage,
    getStepInfo,
  } = wizard;

  const {
    formData,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    submitForm,
    resetForm,
    updateField,
    submitError,
  } = usePatientForm({
    mode,
    initialData,
  });

  // Handle wizard step changes
  const handleStepClick = useCallback(
    (stepId: WizardStepId) => {
      if (wizardState.hasUnsavedChanges) {
        // Could show a confirmation dialog here
      }
      wizardActions.goToStep(stepId);
    },
    [wizardState.hasUnsavedChanges, wizardActions],
  );

  const handleNext = useCallback(() => {
    wizardActions.goToNextStep();
  }, [wizardActions]);

  const handlePrevious = useCallback(() => {
    wizardActions.goToPreviousStep();
  }, [wizardActions]);

  const handleSubmit = useCallback(async () => {
    try {
      wizardActions.setSubmitting(true);
      await submitForm();
    } finally {
      wizardActions.setSubmitting(false);
    }
  }, [submitForm, wizardActions]);

  const handleCancel = useCallback(() => {
    if (wizardState.hasUnsavedChanges || isDirty) {
      setShowExitModal(true);
    } else {
      onCancel?.();
    }
  }, [wizardState.hasUnsavedChanges, isDirty, onCancel]);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    wizardActions.resetWizard();
    resetForm();
    onCancel?.();
  }, [wizardActions, resetForm, onCancel]);

  // Update wizard state when form changes
  useEffect(() => {
    wizardActions.setUnsavedChanges(isDirty);
  }, [isDirty, wizardActions]);

  // Render current step content
  const renderStepContent = useCallback(() => {
    const stepProps = {
      formData,
      errors,
      updateField,
      wizard,
    };

    switch (wizardState.currentStep) {
      case 'demographics':
        return <PatientDemographicsForm {...stepProps} />;
      case 'identifiers':
        return <IdentifierForm {...stepProps} />;
      case 'address':
        return <AddressForm {...stepProps} />;
      case 'attributes':
        return <PersonAttributesForm {...stepProps} />;
      case 'photo':
        return <PatientPhotoCapture {...stepProps} />;
      case 'summary':
        return <FormSummary {...stepProps} />;
      default:
        return null;
    }
  }, [wizardState.currentStep, formData, errors, updateField, wizard]);

  const currentStepInfo = getStepInfo(wizardState.currentStep);
  const progressPercentage = getProgressPercentage();

  return (
    <div className="patient-form-wizard">
      {/* Header */}
      <div className="patient-form-wizard__header">
        <h1 className="patient-form-wizard__title">
          {mode === 'create'
            ? t('registration.patient.form.title.create')
            : t('registration.patient.form.title.edit')}
        </h1>

        {/* Progress Bar */}
        <div className="patient-form-wizard__progress">
          <div className="patient-form-wizard__progress-bar">
            <div
              className="patient-form-wizard__progress-fill"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('registration.patient.form.progress', {
                percentage: progressPercentage,
              })}
            />
          </div>
          <span className="patient-form-wizard__progress-text">
            {t('registration.patient.form.progress', {
              percentage: progressPercentage,
            })}
          </span>
        </div>

        {/* Step Navigation */}
        <nav
          className="patient-form-wizard__nav"
          role="navigation"
          aria-label={t('registration.patient.form.stepNavigation')}
        >
          <ol className="patient-form-wizard__steps">
            {WIZARD_STEPS.map((step) => {
              const isActive = step.id === wizardState.currentStep;
              const isCompleted = wizardState.completedSteps.has(step.id);
              const isClickable = wizard.canGoToStep(step.id);

              return (
                <li
                  key={step.id}
                  className={`patient-form-wizard__step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <button
                    type="button"
                    className="patient-form-wizard__step-button"
                    disabled={!isClickable}
                    onClick={() => handleStepClick(step.id)}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className="patient-form-wizard__step-number">
                      {step.order}
                    </span>
                    <span className="patient-form-wizard__step-label">
                      {t(`registration.patient.form.steps.${step.id}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Current Step Content */}
      <div className="patient-form-wizard__content">
        <div className="patient-form-wizard__step-content">
          <h2 className="patient-form-wizard__step-title">
            {currentStepInfo &&
              t(`registration.patient.form.steps.${currentStepInfo.id}`)}
          </h2>

          <React.Suspense
            fallback={
              <div className="patient-form-wizard__loading">
                {t('common.loading')}
              </div>
            }
          >
            {renderStepContent()}
          </React.Suspense>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="patient-form-wizard__footer">
        <div className="patient-form-wizard__actions">
          <button
            type="button"
            className="patient-form-wizard__button patient-form-wizard__button--secondary"
            onClick={handleCancel}
            disabled={wizardState.isSubmitting}
          >
            {t('common.cancel')}
          </button>

          <div className="patient-form-wizard__nav-buttons">
            <button
              type="button"
              className="patient-form-wizard__button patient-form-wizard__button--secondary"
              onClick={handlePrevious}
              disabled={!canGoPrevious() || wizardState.isSubmitting}
            >
              {t('common.previous')}
            </button>

            {wizardState.currentStep === 'summary' ? (
              <button
                type="button"
                className="patient-form-wizard__button patient-form-wizard__button--primary"
                onClick={handleSubmit}
                disabled={!isValid || wizardState.isSubmitting}
              >
                {wizardState.isSubmitting
                  ? t('common.saving')
                  : mode === 'create'
                    ? t('registration.patient.form.create')
                    : t('registration.patient.form.update')}
              </button>
            ) : (
              <button
                type="button"
                className="patient-form-wizard__button patient-form-wizard__button--primary"
                onClick={handleNext}
                disabled={!canGoNext() || wizardState.isSubmitting}
              >
                {t('common.next')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div
          className="patient-form-wizard__modal-overlay"
          onClick={() => setShowExitModal(false)}
        >
          <div
            className="patient-form-wizard__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="patient-form-wizard__modal-header">
              <h3>{t('registration.patient.form.exitConfirmation.title')}</h3>
            </div>
            <div className="patient-form-wizard__modal-body">
              <p>{t('registration.patient.form.exitConfirmation.message')}</p>
            </div>
            <div className="patient-form-wizard__modal-actions">
              <button
                type="button"
                className="patient-form-wizard__button patient-form-wizard__button--secondary"
                onClick={() => setShowExitModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="patient-form-wizard__button patient-form-wizard__button--danger"
                onClick={handleConfirmExit}
              >
                {t('registration.patient.form.exitConfirmation.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PatientFormWizard: React.FC<PatientFormWizardProps> = (props) => {
  return (
    <PatientFormWizardProvider
      mode={props.mode}
      initialData={props.initialData}
    >
      <PatientFormWizardContent {...props} />
    </PatientFormWizardProvider>
  );
};

export default PatientFormWizard;
