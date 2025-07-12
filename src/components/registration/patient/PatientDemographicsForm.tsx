/**
 * Patient Demographics Form
 * First step of patient creation wizard - basic demographic information
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Grid,
  Row,
  Column,
  TextInput,
  NumberInput,
  DatePicker,
  DatePickerInput,
  RadioButtonGroup,
  RadioButton,
  Checkbox,
  InlineNotification,
  Layer,
  Heading,
} from '@carbon/react';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';

interface PatientDemographicsFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const PatientDemographicsForm: React.FC<
  PatientDemographicsFormProps
> = ({ formData, errors, updateField, wizard }) => {
  const { t } = useTranslation();

  // Calculate age from birthdate or vice versa
  const calculateAge = useCallback((birthdate: string): number | undefined => {
    if (!birthdate) return undefined;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : undefined;
  }, []);

  const calculateBirthdate = useCallback((age: number): string => {
    if (!age || age < 0 || age > 150) return '';
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const birthdate = new Date(birthYear, 0, 1); // January 1st of birth year
    return birthdate.toISOString().split('T')[0];
  }, []);

  // Handle birthdate change
  const handleBirthdateChange = useCallback(
    (value: string) => {
      updateField('birthdate', value);
      if (value) {
        const calculatedAge = calculateAge(value);
        updateField('age', calculatedAge);
        updateField('birthdateEstimated', false);
      } else {
        updateField('age', undefined);
      }
    },
    [updateField, calculateAge],
  );

  // Handle age change
  const handleAgeChange = useCallback(
    (value: string) => {
      const ageNum = parseInt(value, 10);
      if (isNaN(ageNum) || ageNum < 0) {
        updateField('age', undefined);
        updateField('birthdate', '');
        return;
      }

      updateField('age', ageNum);
      const estimatedBirthdate = calculateBirthdate(ageNum);
      updateField('birthdate', estimatedBirthdate);
      updateField('birthdateEstimated', true);
    },
    [updateField, calculateBirthdate],
  );

  // Form validation
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    let isValid = true;
    let isComplete = true;

    // Required fields validation
    if (!formData.givenName?.trim()) {
      stepErrors.push(
        t('registration.patient.demographics.validation.givenNameRequired'),
      );
      isValid = false;
      isComplete = false;
    }

    if (!formData.familyName?.trim()) {
      stepErrors.push(
        t('registration.patient.demographics.validation.familyNameRequired'),
      );
      isValid = false;
      isComplete = false;
    }

    if (!formData.gender) {
      stepErrors.push(
        t('registration.patient.demographics.validation.genderRequired'),
      );
      isValid = false;
      isComplete = false;
    }

    // Either age or birthdate must be provided
    if (!formData.birthdate && !formData.age) {
      stepErrors.push(
        t(
          'registration.patient.demographics.validation.ageOrBirthdateRequired',
        ),
      );
      isValid = false;
      isComplete = false;
    }

    // Name validation (2-50 characters, letters/spaces/hyphens only)
    const namePattern = /^[a-zA-Z\s\-']{2,50}$/;

    if (formData.givenName && !namePattern.test(formData.givenName)) {
      stepErrors.push(
        t('registration.patient.demographics.validation.givenNameInvalid'),
      );
      isValid = false;
    }

    if (formData.familyName && !namePattern.test(formData.familyName)) {
      stepErrors.push(
        t('registration.patient.demographics.validation.familyNameInvalid'),
      );
      isValid = false;
    }

    if (formData.middleName && !namePattern.test(formData.middleName)) {
      stepErrors.push(
        t('registration.patient.demographics.validation.middleNameInvalid'),
      );
      isValid = false;
    }

    // Age validation (0-150)
    if (
      formData.age !== undefined &&
      (formData.age < 0 || formData.age > 150)
    ) {
      stepErrors.push(
        t('registration.patient.demographics.validation.ageInvalid'),
      );
      isValid = false;
    }

    // Birthdate validation (after 1900, not in future)
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const minDate = new Date('1900-01-01');
      const today = new Date();

      if (birthDate < minDate) {
        stepErrors.push(
          t('registration.patient.demographics.validation.birthdateTooOld'),
        );
        isValid = false;
      }

      if (birthDate > today) {
        stepErrors.push(
          t('registration.patient.demographics.validation.birthdateFuture'),
        );
        isValid = false;
      }
    }

    return { isValid, errors: stepErrors, isComplete };
  }, [formData, t]);

  // Update wizard validation when step validation changes
  useEffect(() => {
    wizard.actions.setStepValidation('demographics', stepValidation);
  }, [stepValidation, wizard.actions]);

  return (
    <Stack gap={6}>
      <Layer>
        <Stack gap={5}>
          <Heading>
            {t('registration.patient.demographics.personalInfo')}
          </Heading>

          <Grid>
            <Column md={4} lg={4} xlg={4}>
              {/* Given Name */}
              <TextInput
                id="givenName"
                labelText={`${t('registration.patient.demographics.givenName')} *`}
                value={formData.givenName || ''}
                onChange={(e) => updateField('givenName', e.target.value)}
                placeholder={t(
                  'registration.patient.demographics.givenNamePlaceholder',
                )}
                maxLength={50}
                required
                invalid={!!errors.givenName}
                invalidText={errors.givenName}
              />
            </Column>
            <Column md={4} lg={4} xlg={4}>
              {/* Middle Name */}
              <TextInput
                id="middleName"
                labelText={t('registration.patient.demographics.middleName')}
                value={formData.middleName || ''}
                onChange={(e) => updateField('middleName', e.target.value)}
                placeholder={t(
                  'registration.patient.demographics.middleNamePlaceholder',
                )}
                maxLength={50}
                invalid={!!errors.middleName}
                invalidText={errors.middleName}
              />
            </Column>
            <Column md={4} lg={4} xlg={4}>
              {/* Family Name */}
              <TextInput
                id="familyName"
                labelText={`${t('registration.patient.demographics.familyName')} *`}
                value={formData.familyName || ''}
                onChange={(e) => updateField('familyName', e.target.value)}
                placeholder={t(
                  'registration.patient.demographics.familyNamePlaceholder',
                )}
                maxLength={50}
                required
                invalid={!!errors.familyName}
                invalidText={errors.familyName}
              />
            </Column>
          </Grid>
          <Grid>
            <Column md={4} lg={8}>
              {/* Gender */}
              <RadioButtonGroup
                legendText={`${t('registration.patient.demographics.gender')} *`}
                name="gender"
                value={formData.gender || ''}
                onChange={(value) => updateField('gender', value)}
                invalid={!!errors.gender}
                invalidText={errors.gender}
              >
                <RadioButton
                  id="gender-male"
                  labelText={t('registration.patient.demographics.genderMale')}
                  value="M"
                />
                <RadioButton
                  id="gender-female"
                  labelText={t(
                    'registration.patient.demographics.genderFemale',
                  )}
                  value="F"
                />
                <RadioButton
                  id="gender-other"
                  labelText={t('registration.patient.demographics.genderOther')}
                  value="O"
                />
              </RadioButtonGroup>
            </Column>
          </Grid>
        </Stack>
      </Layer>

      <Layer>
        <Stack gap={5}>
          <h3>{t('registration.patient.demographics.ageInfo')}</h3>

          <Grid>
            <Column md={4} lg={8}>
              {/* Date of Birth */}
              <DatePicker
                dateFormat="Y-m-d"
                datePickerType="single"
                value={formData.birthdate || ''}
                onChange={(dates) => {
                  const dateValue = dates[0]
                    ? dates[0].toISOString().split('T')[0]
                    : '';
                  handleBirthdateChange(dateValue);
                }}
                maxDate={new Date().toISOString().split('T')[0]}
                minDate="1900-01-01"
                invalid={!!errors.birthdate}
                invalidText={errors.birthdate}
              >
                <DatePickerInput
                  id="birthdate"
                  labelText={t('registration.patient.demographics.birthdate')}
                  helperText={t(
                    'registration.patient.demographics.birthdateHelp',
                  )}
                  invalid={!!errors.birthdate}
                  invalidText={errors.birthdate}
                />
              </DatePicker>
            </Column>
            <Column md={4} lg={8}>
              {/* Age */}
              <NumberInput
                id="age"
                label={t('registration.patient.demographics.age')}
                helperText={t('registration.patient.demographics.ageHelp')}
                value={formData.age || ''}
                onChange={(e) =>
                  handleAgeChange((e.target as HTMLInputElement).value)
                }
                min={0}
                max={150}
                placeholder={t(
                  'registration.patient.demographics.agePlaceholder',
                )}
                invalid={!!errors.age}
                invalidText={errors.age}
              />
            </Column>
          </Grid>

          {/* Birthdate Estimated Checkbox */}
          {formData.age && (
            <Checkbox
              id="birthdateEstimated"
              labelText={t(
                'registration.patient.demographics.birthdateEstimated',
              )}
              checked={formData.birthdateEstimated || false}
              onChange={(e, { checked }) =>
                updateField('birthdateEstimated', checked)
              }
              helperText={t(
                'registration.patient.demographics.birthdateEstimatedHelp',
              )}
            />
          )}
        </Stack>
      </Layer>

      {/* Validation Summary */}
      {stepValidation.errors.length > 0 && (
        <InlineNotification
          kind="error"
          title={t('registration.patient.demographics.validationErrors')}
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

export default PatientDemographicsForm;
