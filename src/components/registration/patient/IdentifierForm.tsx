/**
 * Identifier Form
 * Second step of patient creation wizard - identifier management
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface IdentifierFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const IdentifierForm: React.FC<IdentifierFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Basic validation - just check if at least one identifier exists
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    let isValid = true;
    let isComplete = true;

    if (!formData.identifiers || formData.identifiers.length === 0) {
      stepErrors.push(t('registration.patient.identifiers.validation.required'));
      isValid = false;
      isComplete = false;
    }

    return { isValid, errors: stepErrors, isComplete };
  }, [formData.identifiers, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('identifiers', stepValidation);
  }, [stepValidation, wizard.actions]);

  const addIdentifier = () => {
    const newIdentifier = {
      identifier: '',
      identifierType: '',
      location: '',
      preferred: formData.identifiers.length === 0,
    };
    updateField('identifiers', [...formData.identifiers, newIdentifier]);
  };

  const removeIdentifier = (index: number) => {
    const newIdentifiers = formData.identifiers.filter((_, i) => i !== index);
    updateField('identifiers', newIdentifiers);
  };

  const updateIdentifier = (index: number, field: string, value: any) => {
    const newIdentifiers = [...formData.identifiers];
    newIdentifiers[index] = { ...newIdentifiers[index], [field]: value };
    updateField('identifiers', newIdentifiers);
  };

  return (
    <div className="identifier-form">
      <div className="identifier-form__section">
        <h3 className="identifier-form__section-title">
          {t('registration.patient.identifiers.title')}
        </h3>
        <p className="identifier-form__description">
          {t('registration.patient.identifiers.description')}
        </p>

        {formData.identifiers.map((identifier, index) => (
          <div key={index} className="identifier-form__identifier">
            <div className="identifier-form__row">
              <div className="identifier-form__field">
                <label htmlFor={`identifier-${index}`} className="identifier-form__label">
                  {t('registration.patient.identifiers.identifier')}
                  <span className="identifier-form__required">*</span>
                </label>
                <input
                  type="text"
                  id={`identifier-${index}`}
                  className="identifier-form__input"
                  value={identifier.identifier}
                  onChange={(e) => updateIdentifier(index, 'identifier', e.target.value)}
                  placeholder={t('registration.patient.identifiers.identifierPlaceholder')}
                  required
                />
              </div>
              <div className="identifier-form__field">
                <label htmlFor={`identifier-type-${index}`} className="identifier-form__label">
                  {t('registration.patient.identifiers.type')}
                  <span className="identifier-form__required">*</span>
                </label>
                <select
                  id={`identifier-type-${index}`}
                  className="identifier-form__select"
                  value={identifier.identifierType}
                  onChange={(e) => updateIdentifier(index, 'identifierType', e.target.value)}
                  required
                >
                  <option value="">{t('registration.patient.identifiers.selectType')}</option>
                  <option value="patient-id">Patient ID</option>
                  <option value="national-id">National ID</option>
                  <option value="medical-record">Medical Record Number</option>
                </select>
              </div>
              <div className="identifier-form__actions">
                <button
                  type="button"
                  className="identifier-form__button identifier-form__button--danger"
                  onClick={() => removeIdentifier(index)}
                  disabled={formData.identifiers.length === 1}
                >
                  {t('common.remove')}
                </button>
              </div>
            </div>
            <div className="identifier-form__checkbox-row">
              <label className="identifier-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={identifier.preferred}
                  onChange={(e) => updateIdentifier(index, 'preferred', e.target.checked)}
                />
                {t('registration.patient.identifiers.preferred')}
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="identifier-form__button identifier-form__button--secondary"
          onClick={addIdentifier}
        >
          {t('registration.patient.identifiers.addIdentifier')}
        </button>

        {stepValidation.errors.length > 0 && (
          <div className="identifier-form__validation-summary" role="alert">
            <h4 className="identifier-form__validation-title">
              {t('registration.patient.identifiers.validationErrors')}
            </h4>
            <ul className="identifier-form__validation-list">
              {stepValidation.errors.map((error, index) => (
                <li key={index} className="identifier-form__validation-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentifierForm;
