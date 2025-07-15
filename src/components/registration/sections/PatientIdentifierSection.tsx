/**
 * Patient Identifier Section Component
 *
 * Handles patient identifier input, identifier source selection, and identifier generation.
 * Based on the functionality from the AngularJS newpatient.html template.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextInput,
  Select,
  SelectItem,
  Button,
  Checkbox,
  Loading,
  FormGroup,
  Stack,
} from '@carbon/react';
import { Renew, CheckmarkFilled, ErrorFilled } from '@carbon/icons-react';
import {
  PatientIdentifier,
  IdentifierSource,
  ValidationError,
  RegistrationConfig,
} from '../../../types/registration';
import {
  generatePatientIdentifier,
  validateIdentifierUniqueness,
} from '@services/patientRegistrationService';
import { useNotification } from '@hooks/useNotification';
import { getFieldError, hasFieldError } from '@utils/registrationValidation';
import * as styles from './styles/PatientIdentifierSection.module.scss';

interface PatientIdentifierSectionProps {
  data: PatientIdentifier;
  onChange: (identifier: PatientIdentifier) => void;
  errors: ValidationError[];
  disabled?: boolean;
  config?: RegistrationConfig;
  showEnterID?: boolean;
}

const PatientIdentifierSection: React.FC<PatientIdentifierSectionProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  config,
  showEnterID = true,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    'valid' | 'invalid' | 'pending' | null
  >(null);
  const [hasOldIdentifier, setHasOldIdentifier] = useState(
    data.hasOldIdentifier || false,
  );

  // Get identifier type configuration
  const identifierType = data.identifierType;
  const hasIdentifierSources =
    identifierType.identifierSources &&
    identifierType.identifierSources.length > 0;
  const hasEmptyPrefix =
    hasIdentifierSources &&
    identifierType.identifierSources?.some(
      (source) => !source.prefix || source.prefix.trim() === '',
    );

  /**
   * Handle identifier input change
   */
  const handleIdentifierChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newIdentifier = event.target.value;

      onChange({
        ...data,
        identifier: newIdentifier,
        registrationNumber: newIdentifier,
      });

      // Reset validation status when user types
      setValidationStatus(null);
    },
    [data, onChange],
  );

  /**
   * Handle identifier source selection
   */
  const handleIdentifierSourceChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const sourceUuid = event.target.value;
      const selectedSource = identifierType.identifierSources?.find(
        (source) => source.uuid === sourceUuid,
      );

      if (selectedSource) {
        onChange({
          ...data,
          selectedIdentifierSource: selectedSource,
        });
      }
    },
    [data, onChange, identifierType.identifierSources],
  );

  /**
   * Generate new identifier
   */
  const generateIdentifier = useCallback(async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      const identifierSourceName = data.selectedIdentifierSource?.name || '';
      const generatedId = await generatePatientIdentifier(identifierSourceName);

      onChange({
        ...data,
        identifier: generatedId,
        registrationNumber: generatedId,
      });

      addNotification({
        type: 'success',
        title: t('REGISTRATION_SUCCESS'),
        message: t('REGISTRATION_IDENTIFIER_GENERATED_SUCCESSFULLY'),
      });
    } catch (error) {
      console.error('Error generating identifier:', error);
      addNotification({
        type: 'error',
        title: t('REGISTRATION_ERROR'),
        message: t('REGISTRATION_ERROR_IDENTIFIER_GENERATION_FAILED'),
      });
    } finally {
      setIsGenerating(false);
    }
  }, [data, onChange, addNotification, t, isGenerating]);

  /**
   * Validate identifier uniqueness
   */
  const validateIdentifier = useCallback(
    async (identifier: string) => {
      if (!identifier.trim() || isValidating) return;

      try {
        setIsValidating(true);
        setValidationStatus('pending');

        const isUnique = await validateIdentifierUniqueness(
          identifier,
          identifierType.uuid,
        );

        setValidationStatus(isUnique ? 'valid' : 'invalid');

        if (!isUnique) {
          addNotification({
            type: 'warning',
            title: t('REGISTRATION_WARNING'),
            message: t('REGISTRATION_WARNING_IDENTIFIER_EXISTS'),
          });
        }
      } catch (error) {
        console.error('Error validating identifier:', error);
        setValidationStatus(null);
      } finally {
        setIsValidating(false);
      }
    },
    [identifierType.uuid, addNotification, t, isValidating],
  );

  /**
   * Handle identifier blur (for validation)
   */
  const handleIdentifierBlur = useCallback(() => {
    if (data.identifier.trim()) {
      validateIdentifier(data.identifier);
    }
  }, [data.identifier, validateIdentifier]);

  /**
   * Handle "Enter ID" checkbox change
   */
  const handleEnterIdChange = useCallback(
    (checked: boolean) => {
      setHasOldIdentifier(checked);

      onChange({
        ...data,
        hasOldIdentifier: checked,
        identifier: checked ? data.identifier : '',
        registrationNumber: checked ? data.registrationNumber : '',
      });
    },
    [data, onChange],
  );

  /**
   * Clear registration number when checkbox is unchecked
   */
  const clearRegistrationNumber = useCallback(() => {
    onChange({
      ...data,
      identifier: '',
      registrationNumber: '',
    });
    setValidationStatus(null);
  }, [data, onChange]);

  // Auto-generate identifier when identifier source changes (if not manually entering)
  useEffect(() => {
    if (
      hasIdentifierSources &&
      !hasOldIdentifier &&
      data.selectedIdentifierSource &&
      !data.identifier
    ) {
      generateIdentifier();
    }
  }, [
    data.selectedIdentifierSource,
    hasIdentifierSources,
    hasOldIdentifier,
    data.identifier,
    generateIdentifier,
  ]);

  // Get field errors
  const identifierError = getFieldError('primaryIdentifier.identifier', errors);
  const hasIdentifierError = hasFieldError(
    'primaryIdentifier.identifier',
    errors,
  );

  // Determine if identifier input should be shown
  const showIdentifierInput =
    hasOldIdentifier || !hasIdentifierSources || hasEmptyPrefix;

  // Get validation icon
  const getValidationIcon = () => {
    if (isValidating) return <Loading small withOverlay={false} />;
    if (validationStatus === 'valid')
      return <CheckmarkFilled className={styles.validIcon} />;
    if (validationStatus === 'invalid')
      return <ErrorFilled className={styles.invalidIcon} />;
    return null;
  };

  return (
    <FormGroup legendText={t('REGISTRATION_PATIENT_IDENTIFIER')}>
      <Stack gap={4}>
        <div className={styles.identifierRow}>
          {hasIdentifierSources && !hasEmptyPrefix && (
            <div className={styles.identifierPrefix}>
              <Select
                id="identifierSource"
                labelText=""
                hideLabel
                value={data.selectedIdentifierSource?.uuid || ''}
                onChange={handleIdentifierSourceChange}
                disabled={disabled}
              >
                {identifierType.identifierSources?.map(
                  (source: IdentifierSource) => (
                    <SelectItem
                      key={source.uuid}
                      value={source.uuid}
                      text={source.prefix || source.name}
                    />
                  ),
                )}
              </Select>
            </div>
          )}

          {/* Identifier Input */}
          <div className={styles.identifierInputWrapper}>
            <TextInput
              id="patientIdentifier"
              labelText={`${t(identifierType.name)} ${identifierType.required ? '*' : ''}`}
              placeholder={t(identifierType.description || identifierType.name)}
              value={data.identifier}
              onChange={handleIdentifierChange}
              onBlur={handleIdentifierBlur}
              disabled={disabled || !showIdentifierInput}
              invalid={hasIdentifierError}
              invalidText={identifierError}
              required={identifierType.required}
            />

            {/* Validation Status Icon */}
            <div className={styles.validationIcon}>{getValidationIcon()}</div>
          </div>

          {/* Manual ID Entry Checkbox */}
          {hasIdentifierSources && showEnterID && (
            <div className={styles.enterIdCheckbox}>
              <Checkbox
                id="hasOldIdentifier"
                labelText={t('REGISTRATION_LABEL_ENTER_ID')}
                checked={hasOldIdentifier}
                onChange={(_, { checked }) => handleEnterIdChange(checked)}
                disabled={disabled}
              />
            </div>
          )}
        </div>

        {/* Generate Identifier Button */}
        {hasIdentifierSources && data.selectedIdentifierSource && (
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Renew}
            onClick={generateIdentifier}
            disabled={disabled || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loading small withOverlay={false} />
                {t('REGISTRATION_GENERATING')}
              </>
            ) : (
              t('REGISTRATION_GENERATE_IDENTIFIER')
            )}
          </Button>
        )}

        {/* Identifier Display (when auto-generated) */}
        {!showIdentifierInput && data.identifier && (
          <div className={styles.generatedIdentifier}>
            <label className={styles.generatedLabel}>
              {t(identifierType.name)}
            </label>
            <div className={styles.generatedValue}>
              {data.selectedIdentifierSource?.prefix && (
                <span className={styles.prefix}>
                  {data.selectedIdentifierSource.prefix}
                </span>
              )}
              <span>{data.identifier}</span>
            </div>
          </div>
        )}
      </Stack>
    </FormGroup>
  );
};

export default PatientIdentifierSection;
