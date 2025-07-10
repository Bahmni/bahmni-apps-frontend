/**
 * Person Attributes Form
 * Fourth step of patient creation wizard - dynamic person attributes
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData, PersonAttributeType } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface PersonAttributesFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

// Mock person attribute types - in real implementation, these would come from the service
const MOCK_PERSON_ATTRIBUTE_TYPES: PersonAttributeType[] = [
  {
    uuid: 'attr-1',
    name: 'Phone Number',
    description: 'Primary contact phone number',
    format: 'java.lang.String',
    required: false,
    searchable: true,
    retired: false,
  },
  {
    uuid: 'attr-2',
    name: 'Emergency Contact',
    description: 'Emergency contact person name',
    format: 'java.lang.String',
    required: true,
    searchable: false,
    retired: false,
  },
  {
    uuid: 'attr-3',
    name: 'Emergency Contact Phone',
    description: 'Emergency contact phone number',
    format: 'java.lang.String',
    required: true,
    searchable: false,
    retired: false,
  },
  {
    uuid: 'attr-4',
    name: 'Occupation',
    description: 'Patient occupation',
    format: 'java.lang.String',
    required: false,
    searchable: true,
    retired: false,
  },
  {
    uuid: 'attr-5',
    name: 'Education Level',
    description: 'Highest education level completed',
    format: 'java.lang.String',
    required: false,
    searchable: false,
    retired: false,
    concept: {
      uuid: 'concept-1',
      display: 'Education Level Concept',
    },
  },
  {
    uuid: 'attr-6',
    name: 'Monthly Income',
    description: 'Approximate monthly income',
    format: 'java.lang.Integer',
    required: false,
    searchable: false,
    retired: false,
  },
  {
    uuid: 'attr-7',
    name: 'Has Insurance',
    description: 'Whether patient has health insurance',
    format: 'java.lang.Boolean',
    required: false,
    searchable: false,
    retired: false,
  },
];

// Concept options for select-type attributes
const CONCEPT_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  'concept-1': [
    { value: 'no-education', label: 'No formal education' },
    { value: 'primary', label: 'Primary education' },
    { value: 'secondary', label: 'Secondary education' },
    { value: 'bachelor', label: "Bachelor's degree" },
    { value: 'master', label: "Master's degree" },
    { value: 'doctorate', label: 'Doctorate' },
  ],
};

export const PersonAttributesForm: React.FC<PersonAttributesFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();
  const [attributeTypes] = useState<PersonAttributeType[]>(MOCK_PERSON_ATTRIBUTE_TYPES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize attributes if empty
  useEffect(() => {
    if (!formData.attributes || formData.attributes.length === 0) {
      const initialAttributes = attributeTypes.map(attrType => ({
        attributeType: attrType.uuid,
        value: getDefaultValue(attrType.format),
      }));
      updateField('attributes', initialAttributes);
    }
  }, [formData.attributes, attributeTypes, updateField]);

  // Get default value based on attribute format
  const getDefaultValue = useCallback((format: string): string => {
    switch (format) {
      case 'java.lang.Boolean':
        return 'false';
      case 'java.lang.Integer':
      case 'java.lang.Double':
        return '';
      default:
        return '';
    }
  }, []);

  // Validate individual attribute
  const validateAttribute = useCallback((attribute: any, attrType: PersonAttributeType): string[] => {
    const errors: string[] = [];

    // Check required attributes
    if (attrType.required && !attribute.value?.trim()) {
      errors.push(t('registration.patient.attributes.validation.required', {
        name: attrType.name
      }));
    }

    // Format-specific validation
    if (attribute.value?.trim()) {
      switch (attrType.format) {
        case 'java.lang.Integer':
          if (!/^\d+$/.test(attribute.value)) {
            errors.push(t('registration.patient.attributes.validation.invalidInteger', {
              name: attrType.name
            }));
          }
          break;
        case 'java.lang.Double':
          if (!/^\d*\.?\d+$/.test(attribute.value)) {
            errors.push(t('registration.patient.attributes.validation.invalidNumber', {
              name: attrType.name
            }));
          }
          break;
        case 'java.lang.String':
          if (attrType.name.toLowerCase().includes('phone')) {
            // Basic phone validation
            if (!/^[\d\s\-\+\(\)]{10,}$/.test(attribute.value)) {
              errors.push(t('registration.patient.attributes.validation.invalidPhone', {
                name: attrType.name
              }));
            }
          }
          break;
      }
    }

    return errors;
  }, [t]);

  // Comprehensive step validation
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    let isValid = true;
    let isComplete = true;

    if (formData.attributes) {
      formData.attributes.forEach((attribute, index) => {
        const attrType = attributeTypes.find(type => type.uuid === attribute.attributeType);
        if (attrType) {
          const attributeErrors = validateAttribute(attribute, attrType);
          if (attributeErrors.length > 0) {
            newFieldErrors[`attribute-${index}`] = attributeErrors[0];
            stepErrors.push(...attributeErrors);
            isValid = false;
            if (attrType.required) {
              isComplete = false;
            }
          }
        }
      });
    }

    setFieldErrors(newFieldErrors);
    return { isValid, errors: stepErrors, isComplete };
  }, [formData.attributes, attributeTypes, validateAttribute]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('attributes', stepValidation);
  }, [stepValidation, wizard.actions]);

  const updateAttribute = useCallback((index: number, value: string) => {
    if (!formData.attributes) return;

    const newAttributes = [...formData.attributes];
    newAttributes[index] = { ...newAttributes[index], value };
    updateField('attributes', newAttributes);
  }, [formData.attributes, updateField]);

  const getAttributeType = useCallback((attributeTypeUuid: string) => {
    return attributeTypes.find(type => type.uuid === attributeTypeUuid);
  }, [attributeTypes]);

  const renderAttributeField = useCallback((attribute: any, index: number, attrType: PersonAttributeType) => {
    const fieldId = `attribute-${index}`;
    const hasError = fieldErrors[fieldId];
    const isRequired = attrType.required;

    switch (attrType.format) {
      case 'java.lang.Boolean':
        return (
          <div className="person-attributes-form__field">
            <label className="person-attributes-form__checkbox-label">
              <input
                type="checkbox"
                className="person-attributes-form__checkbox"
                checked={attribute.value === 'true'}
                onChange={(e) => updateAttribute(index, e.target.checked ? 'true' : 'false')}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
              />
              <span className="person-attributes-form__checkbox-text">
                {attrType.name}
                {isRequired && <span className="person-attributes-form__required">*</span>}
              </span>
            </label>
            {attrType.description && (
              <p className="person-attributes-form__help-text">
                {attrType.description}
              </p>
            )}
          </div>
        );

      case 'java.lang.Integer':
      case 'java.lang.Double':
        return (
          <div className="person-attributes-form__field">
            <label htmlFor={fieldId} className="person-attributes-form__label">
              {attrType.name}
              {isRequired && <span className="person-attributes-form__required">*</span>}
            </label>
            <input
              type="number"
              id={fieldId}
              className={`person-attributes-form__input ${hasError ? 'person-attributes-form__input--error' : ''}`}
              value={attribute.value || ''}
              onChange={(e) => updateAttribute(index, e.target.value)}
              placeholder={t('registration.patient.attributes.numberPlaceholder', { name: attrType.name })}
              step={attrType.format === 'java.lang.Double' ? '0.01' : '1'}
              min="0"
              aria-describedby={hasError ? `${fieldId}-error` : undefined}
            />
            {attrType.description && (
              <p className="person-attributes-form__help-text">
                {attrType.description}
              </p>
            )}
          </div>
        );

      default:
        // Handle concept-based attributes with select
        if (attrType.concept && CONCEPT_OPTIONS[attrType.concept.uuid]) {
          const options = CONCEPT_OPTIONS[attrType.concept.uuid];
          return (
            <div className="person-attributes-form__field">
              <label htmlFor={fieldId} className="person-attributes-form__label">
                {attrType.name}
                {isRequired && <span className="person-attributes-form__required">*</span>}
              </label>
              <select
                id={fieldId}
                className={`person-attributes-form__select ${hasError ? 'person-attributes-form__select--error' : ''}`}
                value={attribute.value || ''}
                onChange={(e) => updateAttribute(index, e.target.value)}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
              >
                <option value="">{t('registration.patient.attributes.selectOption', { name: attrType.name })}</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {attrType.description && (
                <p className="person-attributes-form__help-text">
                  {attrType.description}
                </p>
              )}
            </div>
          );
        }

        // Default to text input
        return (
          <div className="person-attributes-form__field">
            <label htmlFor={fieldId} className="person-attributes-form__label">
              {attrType.name}
              {isRequired && <span className="person-attributes-form__required">*</span>}
            </label>
            <input
              type="text"
              id={fieldId}
              className={`person-attributes-form__input ${hasError ? 'person-attributes-form__input--error' : ''}`}
              value={attribute.value || ''}
              onChange={(e) => updateAttribute(index, e.target.value)}
              placeholder={t('registration.patient.attributes.textPlaceholder', { name: attrType.name })}
              aria-describedby={hasError ? `${fieldId}-error` : undefined}
            />
            {attrType.description && (
              <p className="person-attributes-form__help-text">
                {attrType.description}
              </p>
            )}
          </div>
        );
    }
  }, [fieldErrors, updateAttribute, t]);

  // Group attributes by required/optional
  const requiredAttributes = useMemo(() => {
    return attributeTypes.filter(attr => attr.required && !attr.retired);
  }, [attributeTypes]);

  const optionalAttributes = useMemo(() => {
    return attributeTypes.filter(attr => !attr.required && !attr.retired);
  }, [attributeTypes]);

  if (!formData.attributes) {
    return null;
  }

  return (
    <div className="person-attributes-form">
      <div className="person-attributes-form__section">
        <h3 className="person-attributes-form__section-title">
          {t('registration.patient.attributes.title')}
        </h3>
        <p className="person-attributes-form__description">
          {t('registration.patient.attributes.description')}
        </p>

        {/* Required Attributes */}
        {requiredAttributes.length > 0 && (
          <div className="person-attributes-form__group">
            <h4 className="person-attributes-form__group-title">
              {t('registration.patient.attributes.requiredSection')}
            </h4>
            <div className="person-attributes-form__fields">
              {requiredAttributes.map((attrType) => {
                const attributeIndex = formData.attributes.findIndex(
                  attr => attr.attributeType === attrType.uuid
                );
                if (attributeIndex === -1) return null;

                const attribute = formData.attributes[attributeIndex];
                const fieldId = `attribute-${attributeIndex}`;
                const hasError = fieldErrors[fieldId];

                return (
                  <div key={attrType.uuid} className="person-attributes-form__attribute">
                    {renderAttributeField(attribute, attributeIndex, attrType)}
                    {hasError && (
                      <div className="person-attributes-form__field-error" id={`${fieldId}-error`} role="alert">
                        {hasError}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Attributes */}
        {optionalAttributes.length > 0 && (
          <div className="person-attributes-form__group">
            <h4 className="person-attributes-form__group-title">
              {t('registration.patient.attributes.optionalSection')}
            </h4>
            <div className="person-attributes-form__fields">
              {optionalAttributes.map((attrType) => {
                const attributeIndex = formData.attributes.findIndex(
                  attr => attr.attributeType === attrType.uuid
                );
                if (attributeIndex === -1) return null;

                const attribute = formData.attributes[attributeIndex];
                const fieldId = `attribute-${attributeIndex}`;
                const hasError = fieldErrors[fieldId];

                return (
                  <div key={attrType.uuid} className="person-attributes-form__attribute">
                    {renderAttributeField(attribute, attributeIndex, attrType)}
                    {hasError && (
                      <div className="person-attributes-form__field-error" id={`${fieldId}-error`} role="alert">
                        {hasError}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Attributes Message */}
        {requiredAttributes.length === 0 && optionalAttributes.length === 0 && (
          <div className="person-attributes-form__empty">
            <p>{t('registration.patient.attributes.noAttributes')}</p>
          </div>
        )}

        {/* Validation Errors */}
        {stepValidation.errors.length > 0 && (
          <div className="person-attributes-form__validation-summary" role="alert">
            <h4 className="person-attributes-form__validation-title">
              {t('registration.patient.attributes.validationErrors')}
            </h4>
            <ul className="person-attributes-form__validation-list">
              {stepValidation.errors.map((error, index) => (
                <li key={index} className="person-attributes-form__validation-item">
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

export default PersonAttributesForm;
