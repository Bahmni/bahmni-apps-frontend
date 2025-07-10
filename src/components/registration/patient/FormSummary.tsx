/**
 * Form Summary
 * Sixth step of patient creation wizard - review and confirmation
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface FormSummaryProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const FormSummary: React.FC<FormSummaryProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Validate that all required steps are complete
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    let isValid = true;
    let isComplete = true;

    // Check if all previous steps are valid
    const requiredSteps = ['demographics', 'identifiers'] as const;
    for (const stepId of requiredSteps) {
      const stepValidation = wizard.state.stepValidations[stepId];
      if (!stepValidation.isValid) {
        stepErrors.push(t('registration.patient.summary.validation.stepIncomplete', { step: t(`registration.patient.form.steps.${stepId}`) }));
        isValid = false;
        isComplete = false;
      }
    }

    return { isValid, errors: stepErrors, isComplete };
  }, [wizard.state.stepValidations, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('summary', stepValidation);
  }, [stepValidation, wizard.actions]);

  const formatGender = (gender: 'M' | 'F' | 'O') => {
    switch (gender) {
      case 'M': return t('registration.patient.demographics.genderMale');
      case 'F': return t('registration.patient.demographics.genderFemale');
      case 'O': return t('registration.patient.demographics.genderOther');
      default: return '';
    }
  };

  return (
    <div className="form-summary">
      <div className="form-summary__section">
        <h3 className="form-summary__section-title">
          {t('registration.patient.summary.title')}
        </h3>
        <p className="form-summary__description">
          {t('registration.patient.summary.description')}
        </p>

        {/* Demographics Summary */}
        <div className="form-summary__group">
          <h4 className="form-summary__group-title">
            {t('registration.patient.demographics.personalInfo')}
          </h4>
          <div className="form-summary__items">
            <div className="form-summary__item">
              <span className="form-summary__label">{t('registration.patient.demographics.givenName')}:</span>
              <span className="form-summary__value">{formData.givenName || t('common.notProvided')}</span>
            </div>
            {formData.middleName && (
              <div className="form-summary__item">
                <span className="form-summary__label">{t('registration.patient.demographics.middleName')}:</span>
                <span className="form-summary__value">{formData.middleName}</span>
              </div>
            )}
            <div className="form-summary__item">
              <span className="form-summary__label">{t('registration.patient.demographics.familyName')}:</span>
              <span className="form-summary__value">{formData.familyName || t('common.notProvided')}</span>
            </div>
            <div className="form-summary__item">
              <span className="form-summary__label">{t('registration.patient.demographics.gender')}:</span>
              <span className="form-summary__value">{formatGender(formData.gender)}</span>
            </div>
            {formData.birthdate && (
              <div className="form-summary__item">
                <span className="form-summary__label">{t('registration.patient.demographics.birthdate')}:</span>
                <span className="form-summary__value">
                  {new Date(formData.birthdate).toLocaleDateString()}
                  {formData.birthdateEstimated && ` (${t('registration.patient.demographics.estimated')})`}
                </span>
              </div>
            )}
            {formData.age && (
              <div className="form-summary__item">
                <span className="form-summary__label">{t('registration.patient.demographics.age')}:</span>
                <span className="form-summary__value">{formData.age} {t('registration.patient.demographics.years')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Identifiers Summary */}
        {formData.identifiers && formData.identifiers.length > 0 && (
          <div className="form-summary__group">
            <h4 className="form-summary__group-title">
              {t('registration.patient.identifiers.title')}
            </h4>
            <div className="form-summary__items">
              {formData.identifiers.map((identifier, index) => (
                <div key={index} className="form-summary__item">
                  <span className="form-summary__label">
                    {identifier.identifierType}
                    {identifier.preferred && ` (${t('registration.patient.identifiers.preferred')})`}:
                  </span>
                  <span className="form-summary__value">{identifier.identifier}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Summary */}
        {formData.address && (formData.address.address1 || formData.address.cityVillage) && (
          <div className="form-summary__group">
            <h4 className="form-summary__group-title">
              {t('registration.patient.address.title')}
            </h4>
            <div className="form-summary__items">
              {formData.address.address1 && (
                <div className="form-summary__item">
                  <span className="form-summary__label">{t('registration.patient.address.address1')}:</span>
                  <span className="form-summary__value">{formData.address.address1}</span>
                </div>
              )}
              {formData.address.cityVillage && (
                <div className="form-summary__item">
                  <span className="form-summary__label">{t('registration.patient.address.city')}:</span>
                  <span className="form-summary__value">{formData.address.cityVillage}</span>
                </div>
              )}
              {formData.address.stateProvince && (
                <div className="form-summary__item">
                  <span className="form-summary__label">{t('registration.patient.address.state')}:</span>
                  <span className="form-summary__value">{formData.address.stateProvince}</span>
                </div>
              )}
              {formData.address.country && (
                <div className="form-summary__item">
                  <span className="form-summary__label">{t('registration.patient.address.country')}:</span>
                  <span className="form-summary__value">{formData.address.country}</span>
                </div>
              )}
              {formData.address.postalCode && (
                <div className="form-summary__item">
                  <span className="form-summary__label">{t('registration.patient.address.postalCode')}:</span>
                  <span className="form-summary__value">{formData.address.postalCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {stepValidation.errors.length > 0 && (
          <div className="form-summary__validation-summary" role="alert">
            <h4 className="form-summary__validation-title">
              {t('registration.patient.summary.validationErrors')}
            </h4>
            <ul className="form-summary__validation-list">
              {stepValidation.errors.map((error, index) => (
                <li key={index} className="form-summary__validation-item">
                  {error}
                </li>
              ))}
            </ul>
            <p className="form-summary__validation-note">
              {t('registration.patient.summary.validationNote')}
            </p>
          </div>
        )}

        {/* Success Message */}
        {stepValidation.isValid && (
          <div className="form-summary__success-message">
            <p>{t('registration.patient.summary.readyToSubmit')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSummary;
