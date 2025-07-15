/**
 * Patient Name Section Component
 *
 * Handles given name, middle name, and family name inputs with proper validation.
 * Based on the patientcommon.html template structure from the AngularJS implementation.
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, FormGroup, Stack, Grid, Column } from '@carbon/react';
import {
  PatientName,
  ValidationError,
  RegistrationConfig,
} from '../../../types/registration';
import { getFieldError, hasFieldError } from '@utils/registrationValidation';
import * as styles from './styles/PatientNameSection.module.scss';

interface PatientNameSectionProps {
  data: PatientName;
  onChange: (name: PatientName) => void;
  errors: ValidationError[];
  disabled?: boolean;
  config?: RegistrationConfig;
  showLocalName?: boolean;
  showMiddleName?: boolean;
  showLastName?: boolean;
  nameDisplayOrder?: string[];
}

const PatientNameSection: React.FC<PatientNameSectionProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  config,
  showLocalName = false,
  showMiddleName = true,
  showLastName = true,
  nameDisplayOrder = ['firstName', 'middleName', 'lastName'],
}) => {
  const { t } = useTranslation();

  /**
   * Handle name field changes
   */
  const handleNameChange = useCallback(
    (field: keyof PatientName, value: string) => {
      onChange({
        ...data,
        [field]: value,
      });
    },
    [data, onChange],
  );

  /**
   * Handle given name change
   */
  const handleGivenNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('givenName', event.target.value);
    },
    [handleNameChange],
  );

  /**
   * Handle middle name change
   */
  const handleMiddleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('middleName', event.target.value);
    },
    [handleNameChange],
  );

  /**
   * Handle family name change
   */
  const handleFamilyNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('familyName', event.target.value);
    },
    [handleNameChange],
  );

  /**
   * Handle local name changes
   */
  const handleGivenNameLocalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('givenNameLocal', event.target.value);
    },
    [handleNameChange],
  );

  const handleMiddleNameLocalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('middleNameLocal', event.target.value);
    },
    [handleNameChange],
  );

  const handleFamilyNameLocalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleNameChange('familyNameLocal', event.target.value);
    },
    [handleNameChange],
  );

  // Get field errors
  const givenNameError = getFieldError('name.givenName', errors);
  const middleNameError = getFieldError('name.middleName', errors);
  const familyNameError = getFieldError('name.familyName', errors);
  const givenNameLocalError = getFieldError('name.givenNameLocal', errors);
  const middleNameLocalError = getFieldError('name.middleNameLocal', errors);
  const familyNameLocalError = getFieldError('name.familyNameLocal', errors);

  const hasGivenNameError = hasFieldError('name.givenName', errors);
  const hasMiddleNameError = hasFieldError('name.middleName', errors);
  const hasFamilyNameError = hasFieldError('name.familyName', errors);
  const hasGivenNameLocalError = hasFieldError('name.givenNameLocal', errors);
  const hasMiddleNameLocalError = hasFieldError('name.middleNameLocal', errors);
  const hasFamilyNameLocalError = hasFieldError('name.familyNameLocal', errors);

  /**
   * Render name field based on type and order
   */
  const renderNameField = (fieldType: string, isLocal: boolean = false) => {
    const fieldSuffix = isLocal ? 'Local' : '';
    const labelSuffix = isLocal ? '_LOCAL' : '';

    switch (fieldType) {
      case 'firstName':
        return (
          <TextInput
            key={`givenName${fieldSuffix}`}
            id={`givenName${fieldSuffix}`}
            labelText={`${t(`REGISTRATION_LABEL_PATIENT_FIRSTNAME${labelSuffix}`)} *`}
            placeholder={t(
              `REGISTRATION_LABEL_PATIENT_FIRSTNAME${labelSuffix}`,
            )}
            value={isLocal ? data.givenNameLocal || '' : data.givenName}
            onChange={
              isLocal ? handleGivenNameLocalChange : handleGivenNameChange
            }
            disabled={disabled}
            invalid={isLocal ? hasGivenNameLocalError : hasGivenNameError}
            invalidText={isLocal ? givenNameLocalError : givenNameError}
            required={!isLocal} // Only English name is required
            autoFocus={!isLocal && fieldType === nameDisplayOrder[0]}
          />
        );

      case 'middleName':
        if (!showMiddleName) return null;
        return (
          <TextInput
            key={`middleName${fieldSuffix}`}
            id={`middleName${fieldSuffix}`}
            labelText={t(
              `REGISTRATION_LABEL_PATIENT_MIDDLE_NAME${labelSuffix}`,
            )}
            placeholder={t(
              `REGISTRATION_LABEL_PATIENT_MIDDLE_NAME${labelSuffix}`,
            )}
            value={isLocal ? data.middleNameLocal || '' : data.middleName || ''}
            onChange={
              isLocal ? handleMiddleNameLocalChange : handleMiddleNameChange
            }
            disabled={disabled}
            invalid={isLocal ? hasMiddleNameLocalError : hasMiddleNameError}
            invalidText={isLocal ? middleNameLocalError : middleNameError}
          />
        );

      case 'lastName':
        if (!showLastName) return null;
        return (
          <TextInput
            key={`familyName${fieldSuffix}`}
            id={`familyName${fieldSuffix}`}
            labelText={`${t(`REGISTRATION_LABEL_PATIENT_LAST_NAME${labelSuffix}`)} *`}
            placeholder={t(
              `REGISTRATION_LABEL_PATIENT_LAST_NAME${labelSuffix}`,
            )}
            value={isLocal ? data.familyNameLocal || '' : data.familyName}
            onChange={
              isLocal ? handleFamilyNameLocalChange : handleFamilyNameChange
            }
            disabled={disabled}
            invalid={isLocal ? hasFamilyNameLocalError : hasFamilyNameError}
            invalidText={isLocal ? familyNameLocalError : familyNameError}
            required={!isLocal} // Only English name is required
          />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <FormGroup legendText={t('REGISTRATION_LABEL_PATIENT_NAME')}>
        <Stack gap={5}>
          {/* Local Language Name Section */}
          {showLocalName && (
            <div className={styles.localNameSection}>
              <h4 className={styles.sectionTitle}>
                {t('REGISTRATION_LABEL_LOCAL_NAME')}
              </h4>
              <Grid className={styles.nameGrid}>
                {nameDisplayOrder.map((fieldType, index) => (
                  <Column key={`local-${fieldType}`} sm={4} md={4} lg={4}>
                    {renderNameField(fieldType, true)}
                  </Column>
                ))}
              </Grid>
            </div>
          )}

          {/* English Name Section */}
          <div>
            {showLocalName && (
              <h4 className={styles.sectionTitle}>
                {t('REGISTRATION_LABEL_ENGLISH_NAME')}
                <span className={styles.required}>*</span>
              </h4>
            )}
            <Grid className={styles.nameGrid}>
              {nameDisplayOrder.map((fieldType, index) => (
                <Column key={`english-${fieldType}`} sm={4} md={4} lg={4}>
                  {renderNameField(fieldType, false)}
                </Column>
              ))}
            </Grid>
          </div>

          {/* Name Preview */}
          {(data.givenName || data.familyName) && (
            <div className={styles.namePreview}>
              <label className={styles.previewLabel}>
                {t('REGISTRATION_LABEL_FULL_NAME_PREVIEW')}
              </label>
              <div className={styles.previewValue}>
                {[data.givenName, data.middleName, data.familyName]
                  .filter(Boolean)
                  .join(' ')
                  .trim() || t('REGISTRATION_LABEL_NAME_NOT_COMPLETE')}
              </div>

              {/* Local name preview if available */}
              {showLocalName &&
                (data.givenNameLocal || data.familyNameLocal) && (
                  <div className={styles.previewValueLocal}>
                    {t('REGISTRATION_LABEL_LOCAL')}:{' '}
                    {[
                      data.givenNameLocal,
                      data.middleNameLocal,
                      data.familyNameLocal,
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .trim()}
                  </div>
                )}
            </div>
          )}
        </Stack>
      </FormGroup>
    </div>
  );
};

export default PatientNameSection;
