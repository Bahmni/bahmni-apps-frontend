/**
 * Identifier Form
 * Second step of patient creation wizard - identifier management
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Grid,
  Column,
  TextInput,
  Select,
  SelectItem,
  Checkbox,
  Button,
  InlineNotification,
  FormGroup,
  Tag,
} from '@carbon/react';
import { TrashCan, Add } from '@carbon/react/icons';
import {
  PatientFormData,
  PatientIdentifierType,
} from '../../../types/registration';
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
  const [identifierTypes] = useState<PatientIdentifierType[]>(
    MOCK_IDENTIFIER_TYPES,
  );
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
  const validateIdentifier = useCallback(
    (identifier: any, index: number): string[] => {
      const errors: string[] = [];

      // Check if identifier value is provided
      if (!identifier.identifier?.trim()) {
        errors.push(
          t('registration.patient.identifiers.validation.identifierRequired'),
        );
      }

      // Check if identifier type is selected
      if (!identifier.identifierType) {
        errors.push(
          t('registration.patient.identifiers.validation.typeRequired'),
        );
      }

      // Validate format if identifier type has a format pattern
      if (identifier.identifier && identifier.identifierType) {
        const identifierType = identifierTypes.find(
          (type) => type.uuid === identifier.identifierType,
        );
        if (identifierType?.format) {
          const formatRegex = new RegExp(identifierType.format);
          if (!formatRegex.test(identifier.identifier)) {
            errors.push(
              t('registration.patient.identifiers.validation.invalidFormat', {
                format: identifierType.description || identifierType.name,
              }),
            );
          }
        }
      }

      return errors;
    },
    [identifierTypes, t],
  );

  // Check for duplicate identifiers
  const checkDuplicates = useCallback(
    (identifiers: any[]): string[] => {
      const errors: string[] = [];
      const seenIdentifiers = new Set<string>();

      identifiers.forEach((identifier, index) => {
        if (identifier.identifier && identifier.identifierType) {
          const key = `${identifier.identifierType}:${identifier.identifier}`;
          if (seenIdentifiers.has(key)) {
            errors.push(
              t('registration.patient.identifiers.validation.duplicate', {
                identifier: identifier.identifier,
              }),
            );
          }
          seenIdentifiers.add(key);
        }
      });

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

    if (!formData.identifiers || formData.identifiers.length === 0) {
      stepErrors.push(
        t('registration.patient.identifiers.validation.required'),
      );
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
      const requiredTypes = identifierTypes.filter((type) => type.required);
      if (requiredTypes.length > 0) {
        const hasRequiredType = formData.identifiers.some((identifier) =>
          requiredTypes.some((type) => type.uuid === identifier.identifierType),
        );
        if (!hasRequiredType) {
          stepErrors.push(
            t(
              'registration.patient.identifiers.validation.requiredTypeMissing',
            ),
          );
          isValid = false;
          isComplete = false;
        }
      }

      // Ensure exactly one preferred identifier
      const preferredCount = formData.identifiers.filter(
        (id) => id.preferred,
      ).length;
      if (preferredCount === 0) {
        stepErrors.push(
          t('registration.patient.identifiers.validation.noPreferred'),
        );
        isValid = false;
      } else if (preferredCount > 1) {
        stepErrors.push(
          t('registration.patient.identifiers.validation.multiplePreferred'),
        );
        isValid = false;
      }
    }

    setFieldErrors(newFieldErrors);
    return { isValid, errors: stepErrors, isComplete };
  }, [
    formData.identifiers,
    identifierTypes,
    validateIdentifier,
    checkDuplicates,
    t,
  ]);

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
    updateField('identifiers', [
      ...(formData.identifiers || []),
      newIdentifier,
    ]);
  }, [formData.identifiers, updateField]);

  const removeIdentifier = useCallback(
    (index: number) => {
      const newIdentifiers = formData.identifiers.filter((_, i) => i !== index);

      // If removing the preferred identifier, make the first remaining one preferred
      if (formData.identifiers[index].preferred && newIdentifiers.length > 0) {
        newIdentifiers[0] = { ...newIdentifiers[0], preferred: true };
      }

      updateField('identifiers', newIdentifiers);
    },
    [formData.identifiers, updateField],
  );

  const updateIdentifier = useCallback(
    (index: number, field: string, value: any) => {
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
    },
    [formData.identifiers, updateField],
  );

  const getIdentifierTypeInfo = useCallback(
    (typeUuid: string) => {
      return identifierTypes.find((type) => type.uuid === typeUuid);
    },
    [identifierTypes],
  );

  const getFormatHint = useCallback(
    (typeUuid: string) => {
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
        return example
          ? t('registration.patient.identifiers.formatHint', { example })
          : identifierType.description;
      }
      return '';
    },
    [getIdentifierTypeInfo, t],
  );

  if (!formData.identifiers) {
    return null;
  }

  return (
    <Stack gap={6}>
      <Stack gap={4}>
        <h3 className="cds--heading-03">
          {t('registration.patient.identifiers.title')}
        </h3>
        <p className="cds--body-01">
          {t('registration.patient.identifiers.description')}
        </p>
      </Stack>

      <Stack gap={5}>
        {formData.identifiers.map((identifier, index) => {
          const identifierType = getIdentifierTypeInfo(
            identifier.identifierType,
          );
          const formatHint = getFormatHint(identifier.identifierType);
          const hasError = fieldErrors[`identifier-${index}`];

          return (
            <FormGroup key={index} legendText="">
              <Stack gap={4}>
                <Stack gap={2} orientation="horizontal">
                  <span className="cds--label">
                    {t('registration.patient.identifiers.identifierNumber', {
                      number: index + 1,
                    })}
                  </span>
                  {identifier.preferred && (
                    <Tag type="blue" size="sm">
                      {t('registration.patient.identifiers.preferred')}
                    </Tag>
                  )}
                </Stack>

                <Grid>
                  <Column sm={4} md={4} lg={8}>
                    <Select
                      id={`identifier-type-${index}`}
                      labelText={t('registration.patient.identifiers.type')}
                      value={identifier.identifierType}
                      onChange={(e) =>
                        updateIdentifier(
                          index,
                          'identifierType',
                          e.target.value,
                        )
                      }
                      invalid={!!hasError}
                      invalidText={hasError}
                      required
                    >
                      <SelectItem
                        value=""
                        text={t('registration.patient.identifiers.selectType')}
                      />
                      {identifierTypes.map((type) => (
                        <SelectItem
                          key={type.uuid}
                          value={type.uuid}
                          text={`${type.name}${type.required ? ' *' : ''}`}
                        />
                      ))}
                    </Select>
                    {identifierType && (
                      <p className="cds--helper-text">
                        {identifierType.description}
                      </p>
                    )}
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <TextInput
                      id={`identifier-${index}`}
                      labelText={t(
                        'registration.patient.identifiers.identifier',
                      )}
                      placeholder={t(
                        'registration.patient.identifiers.identifierPlaceholder',
                      )}
                      value={identifier.identifier}
                      onChange={(e) =>
                        updateIdentifier(index, 'identifier', e.target.value)
                      }
                      invalid={!!hasError}
                      invalidText={hasError}
                      required
                    />
                    {formatHint && (
                      <p className="cds--helper-text">{formatHint}</p>
                    )}
                  </Column>
                </Grid>

                <Grid>
                  <Column sm={4} md={4} lg={8}>
                    <Checkbox
                      id={`preferred-${index}`}
                      labelText={t(
                        'registration.patient.identifiers.setAsPreferred',
                      )}
                      checked={identifier.preferred}
                      onChange={(checked) =>
                        updateIdentifier(index, 'preferred', checked)
                      }
                    />
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <Stack gap={2} orientation="horizontal">
                      <Button
                        kind="danger--tertiary"
                        size="sm"
                        onClick={() => removeIdentifier(index)}
                        disabled={formData.identifiers.length === 1}
                        renderIcon={TrashCan}
                      >
                        {t('common.remove')}
                      </Button>
                    </Stack>
                  </Column>
                </Grid>

                {hasError && (
                  <InlineNotification
                    kind="error"
                    title={t(
                      'registration.patient.identifiers.validationErrors',
                    )}
                    subtitle={hasError}
                    hideCloseButton
                    lowContrast
                  />
                )}
              </Stack>
            </FormGroup>
          );
        })}

        <Button
          kind="tertiary"
          size="sm"
          onClick={addIdentifier}
          renderIcon={Add}
        >
          {t('registration.patient.identifiers.addIdentifier')}
        </Button>

        {stepValidation.errors.length > 0 && (
          <InlineNotification
            kind="error"
            title={t('registration.patient.identifiers.validationErrors')}
            hideCloseButton
            lowContrast
          >
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
              {stepValidation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </InlineNotification>
        )}
      </Stack>
    </Stack>
  );
};

export default IdentifierForm;
