/**
 * Identifier Form
 * Second step of patient creation wizard - identifier management
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData, PatientIdentifierType } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface IdentifierFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

// Mock identifier types - in real implementation, these would come from the service
const MOCK_IDENTIFIER_TYPES: PatientIdentifierType[] = [
  {
    uuid: '1',
    name: 'Patient Identifier',
    description: 'Unique patient identifier',
    format: '^[A-Z]{2}[0-9]{6}$',
    required: true,
    retired: false,
  },
  {
    uuid: '2',
    name: 'National ID',
    description: 'National identification number',
    format: '^[0-9]{9,12}$',
    required: false,
    retired: false,
  },
  {
    uuid: '3',
    name: 'Medical Record Number',
    description: 'Hospital medical record number',
    format: '^MRN[0-9]{8}$',
    required: false,
    retired: false,
  },
  {
    uuid: '4',
    name: 'Social Security Number',
    description: 'Social security number',
    format: '^[0-9]{3}-[0-9]{2}-[0-9]{4}$',
    required: false,
    retired: false,
  },
];

export const IdentifierForm: React.FC<IdentifierFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();
  const [identifierTypes] = useState<PatientIdentifierType[]>(MOCK_IDENTIFIER_TYPES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize identifiers if empty
  useEffect(() => {
    if (!formData.identifiers || formData.identifiers.length === 0) {
      const defaultIdentifier = {
        identifier: '',
        identifierType: '',
        location: '',
        preferred: true,
      };
      updateField('identifiers', [defaultIdentifier]);
    }
  }, [formData.identifiers, updateField]);

  // Validate individual identifier
  const validateIdentifier = useCallback((identifier: any, index: number): string[] => {
    const errors: string[] = [];

    // Check if identifier value is provided
    if (!identifier.identifier?.trim()) {
      errors.push(t('registration.patient.identifiers.validation.identifierRequired'));
    }

    // Check if identifier type is selected
    if (!identifier.identifierType) {
      errors.push(t('registration.patient.identifiers.validation.typeRequired'));
    }

    // Validate format if identifier type has a format pattern
    if (identifier.identifier && identifier.identifierType) {
      const identifierType = identifierTypes.find(type => type.uuid === identifier.identifierType);
      if (identifierType?.format) {
        const formatRegex = new RegExp(identifierType.format);
        if (!formatRegex.test(identifier.identifier)) {
          errors.push(t('registration.patient.identifiers.validation.invalidFormat', {
            format: identifierType.description || identifierType.name
          }));
        }
      }
    }

    return errors;
  }, [identifierTypes, t]);

  // Check for duplicate identifiers
  const checkDuplicates = useCallback((identifiers: any[]): string[] => {
    const errors: string[] = [];
    const seenIdentifiers = new Set<string>();

    identifiers.forEach((identifier, index) => {
      if (identifier.identifier && identifier.identifierType) {
        const key = `${identifier.identifierType}:${identifier.identifier}`;
        if (seenIdentifiers.has(key)) {
          errors.push(t('registration.patient.identifiers.validation.duplicate', {
            identifier: identifier.identifier
          }));
        }
        seenIdentifiers.add(key);
      }
    });

    return errors;
  }, [t]);

  // Comprehensive step validation
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    let isValid = true;
    let isComplete = true;

    if (!formData.identifiers || formData.identifiers.length === 0) {
      stepErrors.push(t('registration.patient.identifiers.validation.required'));
      isValid = false;
      isComplete = false;
    } else {
      // Validate each identifier
      formData.identifiers.forEach((identifier, index) => {
        const identifierErrors = validateIdentifier(identifier, index);
        if (identifierErrors.length > 0) {
          newFieldErrors[`identifier-${index}`] = identifierErrors[0];
          stepErrors.push(...identifierErrors);
          isValid = false;
          isComplete = false;
        }
      });

      // Check for duplicates
      const duplicateErrors = checkDuplicates([...formData.identifiers]);
      stepErrors.push(...duplicateErrors);
      if (duplicateErrors.length > 0) {
        isValid = false;
        isComplete = false;
      }

      // Check if at least one required identifier type is present
      const requiredTypes = identifierTypes.filter(type => type.required);
      if (requiredTypes.length > 0) {
        const hasRequiredType = formData.identifiers.some(identifier =>
          requiredTypes.some(type => type.uuid === identifier.identifierType)
        );
        if (!hasRequiredType) {
          stepErrors.push(t('registration.patient.identifiers.validation.requiredTypeMissing'));
          isValid = false;
          isComplete = false;
        }
      }

      // Ensure exactly one preferred identifier
      const preferredCount = formData.identifiers.filter(id => id.preferred).length;
      if (preferredCount === 0) {
        stepErrors.push(t('registration.patient.identifiers.validation.noPreferred'));
        isValid = false;
      } else if (preferredCount > 1) {
        stepErrors.push(t('registration.patient.identifiers.validation.multiplePreferred'));
        isValid = false;
      }
    }

    setFieldErrors(newFieldErrors);
    return { isValid, errors: stepErrors, isComplete };
  }, [formData.identifiers, identifierTypes, validateIdentifier, checkDuplicates, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('identifiers', stepValidation);
  }, [stepValidation, wizard.actions]);

  const addIdentifier = useCallback(() => {
    const newIdentifier = {
      identifier: '',
      identifierType: '',
      location: '',
      preferred: false,
    };
    updateField('identifiers', [...(formData.identifiers || []), newIdentifier]);
  }, [formData.identifiers, updateField]);

  const removeIdentifier = useCallback((index: number) => {
    const newIdentifiers = formData.identifiers.filter((_, i) => i !== index);

    // If removing the preferred identifier, make the first remaining one preferred
    if (formData.identifiers[index].preferred && newIdentifiers.length > 0) {
      newIdentifiers[0] = { ...newIdentifiers[0], preferred: true };
    }

    updateField('identifiers', newIdentifiers);
  }, [formData.identifiers, updateField]);

  const updateIdentifier = useCallback((index: number, field: string, value: any) => {
    const newIdentifiers = [...formData.identifiers];

    // Handle preferred status - only one can be preferred
    if (field === 'preferred' && value === true) {
      // Unset all other preferred flags
      newIdentifiers.forEach((_, i) => {
        if (i !== index) {
          newIdentifiers[i] = { ...newIdentifiers[i], preferred: false };
        }
      });
    }

    newIdentifiers[index] = { ...newIdentifiers[index], [field]: value };
    updateField('identifiers', newIdentifiers);
  }, [formData.identifiers, updateField]);

  const getIdentifierTypeInfo = useCallback((typeUuid: string) => {
    return identifierTypes.find(type => type.uuid === typeUuid);
  }, [identifierTypes]);

  const getFormatHint = useCallback((typeUuid: string) => {
    const identifierType = getIdentifierTypeInfo(typeUuid);
    if (identifierType?.format) {
      // Convert regex to user-friendly format hint
      const formatExamples: Record<string, string> = {
        '^[A-Z]{2}[0-9]{6}$': 'AB123456',
        '^[0-9]{9,12}$': '123456789',
        '^MRN[0-9]{8}$': 'MRN12345678',
        '^[0-9]{3}-[0-9]{2}-[0-9]{4}$': '123-45-6789',
      };
      const example = formatExamples[identifierType.format];
      return example ? t('registration.patient.identifiers.formatHint', { example }) : identifierType.description;
    }
    return '';
  }, [getIdentifierTypeInfo, t]);

  if (!formData.identifiers) {
    return null;
  }

  return (
    <div className="identifier-form">
      <div className="identifier-form__section">
        <h3 className="identifier-form__section-title">
          {t('registration.patient.identifiers.title')}
        </h3>
        <p className="identifier-form__description">
          {t('registration.patient.identifiers.description')}
        </p>

        {formData.identifiers.map((identifier, index) => {
          const identifierType = getIdentifierTypeInfo(identifier.identifierType);
          const formatHint = getFormatHint(identifier.identifierType);
          const hasError = fieldErrors[`identifier-${index}`];

          return (
            <div key={index} className={`identifier-form__identifier ${hasError ? 'identifier-form__identifier--error' : ''}`}>
              <div className="identifier-form__header">
                <span className="identifier-form__identifier-number">
                  {t('registration.patient.identifiers.identifierNumber', { number: index + 1 })}
                </span>
                {identifier.preferred && (
                  <span className="identifier-form__preferred-badge">
                    {t('registration.patient.identifiers.preferred')}
                  </span>
                )}
              </div>

              <div className="identifier-form__row">
                <div className="identifier-form__field">
                  <label htmlFor={`identifier-type-${index}`} className="identifier-form__label">
                    {t('registration.patient.identifiers.type')}
                    <span className="identifier-form__required">*</span>
                  </label>
                  <select
                    id={`identifier-type-${index}`}
                    className={`identifier-form__select ${hasError ? 'identifier-form__select--error' : ''}`}
                    value={identifier.identifierType}
                    onChange={(e) => updateIdentifier(index, 'identifierType', e.target.value)}
                    required
                    aria-describedby={hasError ? `identifier-error-${index}` : undefined}
                  >
                    <option value="">{t('registration.patient.identifiers.selectType')}</option>
                    {identifierTypes.map((type) => (
                      <option key={type.uuid} value={type.uuid}>
                        {type.name}
                        {type.required && ' *'}
                      </option>
                    ))}
                  </select>
                  {identifierType && (
                    <p className="identifier-form__help-text">
                      {identifierType.description}
                    </p>
                  )}
                </div>

                <div className="identifier-form__field">
                  <label htmlFor={`identifier-${index}`} className="identifier-form__label">
                    {t('registration.patient.identifiers.identifier')}
                    <span className="identifier-form__required">*</span>
                  </label>
                  <input
                    type="text"
                    id={`identifier-${index}`}
                    className={`identifier-form__input ${hasError ? 'identifier-form__input--error' : ''}`}
                    value={identifier.identifier}
                    onChange={(e) => updateIdentifier(index, 'identifier', e.target.value)}
                    placeholder={t('registration.patient.identifiers.identifierPlaceholder')}
                    required
                    aria-describedby={hasError ? `identifier-error-${index}` : undefined}
                  />
                  {formatHint && (
                    <p className="identifier-form__help-text">
                      {formatHint}
                    </p>
                  )}
                </div>
              </div>

              <div className="identifier-form__row">
                <div className="identifier-form__checkbox-field">
                  <label className="identifier-form__checkbox-label">
                    <input
                      type="checkbox"
                      className="identifier-form__checkbox"
                      checked={identifier.preferred}
                      onChange={(e) => updateIdentifier(index, 'preferred', e.target.checked)}
                    />
                    <span className="identifier-form__checkbox-text">
                      {t('registration.patient.identifiers.setAsPreferred')}
                    </span>
                  </label>
                </div>

                <div className="identifier-form__actions">
                  <button
                    type="button"
                    className="identifier-form__button identifier-form__button--danger"
                    onClick={() => removeIdentifier(index)}
                    disabled={formData.identifiers.length === 1}
                    aria-label={t('registration.patient.identifiers.removeIdentifier', { number: index + 1 })}
                  >
                    {t('common.remove')}
                  </button>
                </div>
              </div>

              {hasError && (
                <div className="identifier-form__field-error" id={`identifier-error-${index}`} role="alert">
                  {hasError}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          className="identifier-form__button identifier-form__button--secondary"
          onClick={addIdentifier}
        >
          + {t('registration.patient.identifiers.addIdentifier')}
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
