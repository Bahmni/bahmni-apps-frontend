/**
 * Person Attributes Form
 * Fourth step of patient creation wizard - dynamic person attributes
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Grid,
  Column,
  TextInput,
  NumberInput,
  Checkbox,
  Select,
  SelectItem,
  InlineNotification,
  Layer,
  Heading,
} from '@carbon/react';
import {
  PatientFormData,
  PersonAttributeType,
} from '../../../types/registration';
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
];

// Concept options for select-type attributes
const CONCEPT_OPTIONS: Record<
  string,
  Array<{ value: string; label: string }>
> = {
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
  const [attributeTypes] = useState<PersonAttributeType[]>(
    MOCK_PERSON_ATTRIBUTE_TYPES,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize attributes if empty
  useEffect(() => {
    if (!formData.attributes || formData.attributes.length === 0) {
      const initialAttributes = attributeTypes.map((attrType) => ({
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
  const validateAttribute = useCallback(
    (attribute: any, attrType: PersonAttributeType): string[] => {
      const errors: string[] = [];

      // Check required attributes
      if (attrType.required && !attribute.value?.trim()) {
        errors.push(
          t('registration.patient.attributes.validation.required', {
            name: attrType.name,
          }),
        );
      }

      // Format-specific validation
      if (attribute.value?.trim()) {
        switch (attrType.format) {
          case 'java.lang.Integer':
            if (!/^\d+$/.test(attribute.value)) {
              errors.push(
                t('registration.patient.attributes.validation.invalidInteger', {
                  name: attrType.name,
                }),
              );
            }
            break;
          case 'java.lang.Double':
            if (!/^\d*\.?\d+$/.test(attribute.value)) {
              errors.push(
                t('registration.patient.attributes.validation.invalidNumber', {
                  name: attrType.name,
                }),
              );
            }
            break;
          case 'java.lang.String':
            if (attrType.name.toLowerCase().includes('phone')) {
              // Basic phone validation
              if (!/^[\d\s\-\+\(\)]{10,}$/.test(attribute.value)) {
                errors.push(
                  t('registration.patient.attributes.validation.invalidPhone', {
                    name: attrType.name,
                  }),
                );
              }
            }
            break;
        }
      }

      return errors;
    },
    [t],
  );

  // Comprehensive step validation
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    let isValid = true;
    let isComplete = true;

    if (formData.attributes) {
      formData.attributes.forEach((attribute, index) => {
        const attrType = attributeTypes.find(
          (type) => type.uuid === attribute.attributeType,
        );
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

  const updateAttribute = useCallback(
    (index: number, value: string) => {
      if (!formData.attributes) return;

      const newAttributes = [...formData.attributes];
      newAttributes[index] = { ...newAttributes[index], value };
      updateField('attributes', newAttributes);
    },
    [formData.attributes, updateField],
  );

  const getAttributeType = useCallback(
    (attributeTypeUuid: string) => {
      return attributeTypes.find((type) => type.uuid === attributeTypeUuid);
    },
    [attributeTypes],
  );

  const renderAttributeField = useCallback(
    (attribute: any, index: number, attrType: PersonAttributeType) => {
      const fieldId = `attribute-${index}`;
      const hasError = fieldErrors[fieldId];
      const isRequired = attrType.required;
      const labelText = `${attrType.name}${isRequired ? ' *' : ''}`;

      switch (attrType.format) {
        case 'java.lang.Boolean':
          return (
            <Checkbox
              id={fieldId}
              labelText={labelText}
              checked={attribute.value === 'true'}
              onChange={(e, { checked }) =>
                updateAttribute(index, checked ? 'true' : 'false')
              }
              helperText={attrType.description}
            />
          );

        case 'java.lang.Integer':
          return (
            <NumberInput
              id={fieldId}
              label={labelText}
              value={attribute.value || ''}
              onChange={(e) =>
                updateAttribute(index, (e.target as HTMLInputElement).value)
              }
              placeholder={t(
                'registration.patient.attributes.numberPlaceholder',
                { name: attrType.name },
              )}
              step={1}
              min={0}
              invalid={!!hasError}
              invalidText={hasError}
              helperText={attrType.description}
            />
          );

        case 'java.lang.Double':
          return (
            <NumberInput
              id={fieldId}
              label={labelText}
              value={attribute.value || ''}
              onChange={(e) =>
                updateAttribute(index, (e.target as HTMLInputElement).value)
              }
              placeholder={t(
                'registration.patient.attributes.numberPlaceholder',
                { name: attrType.name },
              )}
              step={0.01}
              min={0}
              invalid={!!hasError}
              invalidText={hasError}
              helperText={attrType.description}
            />
          );

        default:
          // Handle concept-based attributes with select
          if (attrType.concept && CONCEPT_OPTIONS[attrType.concept.uuid]) {
            const options = CONCEPT_OPTIONS[attrType.concept.uuid];
            return (
              <Select
                id={fieldId}
                labelText={labelText}
                value={attribute.value || ''}
                onChange={(e) => updateAttribute(index, e.target.value)}
                invalid={!!hasError}
                invalidText={hasError}
                helperText={attrType.description}
              >
                <SelectItem
                  value=""
                  text={t('registration.patient.attributes.selectOption', {
                    name: attrType.name,
                  })}
                />
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    text={option.label}
                  />
                ))}
              </Select>
            );
          }

          // Default to text input
          return (
            <TextInput
              id={fieldId}
              labelText={labelText}
              value={attribute.value || ''}
              onChange={(e) => updateAttribute(index, e.target.value)}
              placeholder={t(
                'registration.patient.attributes.textPlaceholder',
                { name: attrType.name },
              )}
              invalid={!!hasError}
              invalidText={hasError}
              helperText={attrType.description}
            />
          );
      }
    },
    [fieldErrors, updateAttribute, t],
  );

  // Group attributes by required/optional
  const requiredAttributes = useMemo(() => {
    return attributeTypes.filter((attr) => attr.required && !attr.retired);
  }, [attributeTypes]);

  const optionalAttributes = useMemo(() => {
    return attributeTypes.filter((attr) => !attr.required && !attr.retired);
  }, [attributeTypes]);

  if (!formData.attributes) {
    return null;
  }

  return (
    <Stack gap={6}>
      <Layer>
        <Stack gap={5}>
          <Heading>{t('registration.patient.attributes.title')}</Heading>
          <p>{t('registration.patient.attributes.description')}</p>

          {/* Required Attributes */}
          {requiredAttributes.length > 0 && (
            <Stack gap={4}>
              <h4>{t('registration.patient.attributes.requiredSection')}</h4>
              <Grid>
                {requiredAttributes.map((attrType) => {
                  const attributeIndex = formData.attributes.findIndex(
                    (attr) => attr.attributeType === attrType.uuid,
                  );
                  if (attributeIndex === -1) return null;

                  const attribute = formData.attributes[attributeIndex];

                  return (
                    <Column md={4} lg={8}>
                      {renderAttributeField(
                        attribute,
                        attributeIndex,
                        attrType,
                      )}
                    </Column>
                  );
                })}
              </Grid>
            </Stack>
          )}

          {/* Optional Attributes */}
          {optionalAttributes.length > 0 && (
            <Stack gap={4}>
              <h4>{t('registration.patient.attributes.optionalSection')}</h4>
              <Grid >
                {optionalAttributes.map((attrType) => {
                  const attributeIndex = formData.attributes.findIndex(
                    (attr) => attr.attributeType === attrType.uuid,
                  );
                  if (attributeIndex === -1) return null;

                  const attribute = formData.attributes[attributeIndex];

                  return (
                    <Column md={4} lg={8}>
                      {renderAttributeField(
                        attribute,
                        attributeIndex,
                        attrType,
                      )}
                    </Column>
                  );
                })}
              </Grid>
            </Stack>
          )}

          {/* No Attributes Message */}
          {requiredAttributes.length === 0 &&
            optionalAttributes.length === 0 && (
              <div>
                <p>{t('registration.patient.attributes.noAttributes')}</p>
              </div>
            )}
        </Stack>
      </Layer>

      {/* Validation Errors */}
      {stepValidation.errors.length > 0 && (
        <InlineNotification
          kind="error"
          title={t('registration.patient.attributes.validationErrors')}
          subtitle=""
          hideCloseButton
        >
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {stepValidation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </InlineNotification>
      )}
    </Stack>
  );
};

export default PersonAttributesForm;
