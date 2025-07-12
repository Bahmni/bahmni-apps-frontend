/**
 * Patient Form Wizard
 * Multi-step form wizard for patient creation and editing
 * Migrated to use Carbon Design System components exclusively
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Column,
  ProgressBar,
  Button,
  Modal,
  ModalBody,
  Loading,
} from '@carbon/react';
import { usePatientForm } from '../../../hooks/usePatientForm';
import { useNotification } from '../../../hooks/useNotification';
import {
  PatientFormWizardProvider,
  usePatientFormWizard,
  WIZARD_STEPS,
  WizardStepId,
} from './PatientFormWizardContext';
import { PatientFormData } from '../../../types/registration';

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

  // Add null safety checks
  if (!wizard) {
    return <Loading description={t('common.loading')} />;
  }

  const {
    state: wizardState,
    actions: wizardActions,
    canGoNext,
    canGoPrevious,
    getProgressPercentage,
    getStepInfo,
    getCurrentStepIndex,
  } = wizard;

  const formHook = usePatientForm({
    mode,
    initialData,
  });

  // Add null safety checks
  if (!formHook) {
    return <Loading description={t('common.loading')} />;
  }

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
  } = formHook;

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

  const currentStepInfo = getStepInfo(wizardState?.currentStep);
  const progressPercentage = getProgressPercentage();
  const currentStepIndex = getCurrentStepIndex();

  // Additional safety checks
  if (!wizardState || !WIZARD_STEPS) {
    return <Loading description={t('common.loading')} />;
  }

  return (
    <Grid fullWidth>
      {/* Header Section */}
      <Column lg={16} md={8} sm={4}>
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f4f4f4',
            marginBottom: '1rem',
          }}
        >
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: '400',
              marginBottom: '1.5rem',
              margin: 0,
            }}
          >
            {mode === 'create'
              ? t('registration.patient.form.title.create')
              : t('registration.patient.form.title.edit')}
          </h1>

          {/* Overall Progress Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ProgressBar
              label={t('registration.patient.form.progress', {
                percentage: progressPercentage,
              })}
              value={progressPercentage}
              max={100}
              size="big"
            />
          </div>

          {/* Step Indicator - Simplified to avoid React 19 compatibility issues */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === wizardState.currentStep;
              const isCompleted = wizardState.completedSteps.has(step.id);
              const stepValidation = wizardState?.stepValidations?.[step.id];
              const hasErrors = stepValidation?.errors?.length > 0;
              const canClick = wizard.canGoToStep(step.id);

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => canClick && handleStepClick(step.id)}
                  disabled={!canClick}
                  style={{
                    padding: '0.75rem 1rem',
                    border: `2px solid ${isActive ? '#0f62fe' : isCompleted ? '#24a148' : '#e0e0e0'}`,
                    backgroundColor: isActive
                      ? '#0f62fe'
                      : isCompleted
                        ? '#24a148'
                        : 'white',
                    color: isActive || isCompleted ? 'white' : '#161616',
                    borderRadius: '4px',
                    cursor: canClick ? 'pointer' : 'not-allowed',
                    opacity: canClick ? 1 : 0.5,
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '400',
                    minWidth: '120px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                    {isCompleted ? '✓' : step.order}
                  </div>
                  <div>{t(`registration.patient.form.steps.${step.id}`)}</div>
                  {hasErrors && (
                    <div
                      style={{
                        color: '#da1e28',
                        fontSize: '0.75rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      !
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Column>

      {/* Main Content */}
      <Column lg={16} md={8} sm={4}>
        <div style={{ padding: '0 2rem', minHeight: 'fit-content' }}>
          <React.Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                }}
              >
                <Loading description={t('common.loading')} />
              </div>
            }
          >
            {renderStepContent()}
          </React.Suspense>
        </div>
      </Column>

      {/* Footer Navigation */}
      <Column lg={16} md={8} sm={4}>
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#f4f4f4',
            marginTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            kind="secondary"
            onClick={handleCancel}
            disabled={wizardState.isSubmitting}
          >
            {t('common.cancel')}
          </Button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              kind="secondary"
              onClick={handlePrevious}
              disabled={!canGoPrevious() || wizardState.isSubmitting}
            >
              {t('common.previous')}
            </Button>

            {wizardState.currentStep === 'summary' ? (
              <Button
                kind="primary"
                onClick={handleSubmit}
                disabled={!isValid || wizardState.isSubmitting}
              >
                {wizardState.isSubmitting
                  ? t('common.saving')
                  : mode === 'create'
                    ? t('registration.patient.form.create')
                    : t('registration.patient.form.update')}
              </Button>
            ) : (
              <Button
                kind="primary"
                onClick={handleNext}
                disabled={!canGoNext() || wizardState.isSubmitting}
              >
                {t('common.next')}
              </Button>
            )}
          </div>
        </div>
      </Column>

      {/* Exit Confirmation Modal - Simplified to avoid React 19 compatibility issues */}
      {showExitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowExitModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxWidth: '480px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ padding: '1.5rem', borderBottom: '1px solid #e0e0e0' }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#161616',
                }}
              >
                {t('registration.patient.form.exitConfirmation.title')}
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  color: '#161616',
                  lineHeight: '1.5',
                }}
              >
                {t('registration.patient.form.exitConfirmation.message')}
              </p>
            </div>
            <div
              style={{
                padding: '1.5rem',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
              }}
            >
              <Button kind="secondary" onClick={() => setShowExitModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button kind="danger" onClick={handleConfirmExit}>
                {t('registration.patient.form.exitConfirmation.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Grid>
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
