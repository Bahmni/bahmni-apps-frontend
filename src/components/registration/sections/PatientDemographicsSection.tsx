/**
 * Patient Demographics Section Component
 *
 * Handles gender selection, age input (years/months/days), and birthdate input with age calculation.
 * Based on the age.html and dob.html templates from the AngularJS implementation.
 */

import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectItem,
  TextInput,
  DatePicker,
  DatePickerInput,
  Checkbox,
  FormGroup,
  Stack,
  Grid,
  Column,
  TimePicker,
} from '@carbon/react';
import {
  PatientDemographics,
  Gender,
  ValidationError,
  RegistrationConfig,
} from '../../../types/registration';
import { Age } from '../../../types/patient';
import { getFieldError, hasFieldError } from '@utils/registrationValidation';
import { calculateAge, calculateBirthDate } from '@utils/date';
import * as styles from './styles/PatientDemographicsSection.module.scss';

interface PatientDemographicsSectionProps {
  data: PatientDemographics;
  onChange: (demographics: PatientDemographics) => void;
  errors: ValidationError[];
  disabled?: boolean;
  config?: RegistrationConfig;
  dobMandatory?: boolean;
  showBirthTime?: boolean;
}

const PatientDemographicsSection: React.FC<PatientDemographicsSectionProps> = ({
  data,
  onChange,
  errors,
  disabled = false,
  config,
  dobMandatory = false,
  showBirthTime = false,
}) => {
  const { t } = useTranslation();

  /**
   * Handle gender change
   */
  const handleGenderChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const gender = event.target.value as Gender;
      onChange({
        ...data,
        gender,
      });
    },
    [data, onChange],
  );

  /**
   * Handle age field changes
   */
  const handleAgeChange = useCallback(
    (field: keyof Age, value: number) => {
      const newAge = {
        ...data.age,
        [field]: Math.max(0, value), // Ensure non-negative values
      };

      // Calculate birthdate from age
      const calculatedBirthdate = calculateBirthDate(newAge);

      onChange({
        ...data,
        age: newAge,
        birthdate: calculatedBirthdate,
      });
    },
    [data, onChange],
  );

  /**
   * Handle birthdate change
   */
  const handleBirthdateChange = useCallback(
    (dates: Date[]) => {
      const birthdate = dates[0];
      if (!birthdate) {
        onChange({
          ...data,
          birthdate: undefined,
          age: { years: 0, months: 0, days: 0 },
        });
        return;
      }

      // Format date as ISO string (YYYY-MM-DD)
      const birthdateString = birthdate.toISOString().split('T')[0];

      // Calculate age from birthdate
      const calculatedAge = calculateAge(birthdateString) || {
        years: 0,
        months: 0,
        days: 0,
      };

      onChange({
        ...data,
        birthdate: birthdateString,
        age: calculatedAge,
      });
    },
    [data, onChange],
  );

  /**
   * Handle birthdate estimated checkbox
   */
  const handleBirthdateEstimatedChange = useCallback(
    (checked: boolean) => {
      onChange({
        ...data,
        birthdateEstimated: checked,
      });
    },
    [data, onChange],
  );

  /**
   * Handle birth time change
   */
  const handleBirthTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...data,
        birthtime: event.target.value,
      });
    },
    [data, onChange],
  );

  // Get field errors
  const genderError = getFieldError('demographics.gender', errors);
  const ageError = getFieldError('demographics.age', errors);
  const birthdateError = getFieldError('demographics.birthdate', errors);

  const hasGenderError = hasFieldError('demographics.gender', errors);
  const hasAgeError = hasFieldError('demographics.age', errors);
  const hasBirthdateError = hasFieldError('demographics.birthdate', errors);

  // Get today's date for max date validation
  const today = new Date().toISOString().split('T')[0];

  // Gender options from config or default
  const genderOptions = config?.genderOptions || [
    { code: 'M', display: 'Male' },
    { code: 'F', display: 'Female' },
    { code: 'O', display: 'Other' },
  ];

  return (
    <FormGroup legendText={t('REGISTRATION_LABEL_DEMOGRAPHICS')}>
      <Stack gap={5}>
        {/* Gender Selection */}
        <div className={styles.genderSection}>
          <Select
            id="gender"
            labelText={`${t('REGISTRATION_LABEL_GENDER')} *`}
            value={data.gender}
            onChange={handleGenderChange}
            disabled={disabled}
            invalid={hasGenderError}
            invalidText={genderError}
            required
          >
            <SelectItem value="" text={t('REGISTRATION_LABEL_SELECT_GENDER')} />
            {genderOptions.map((option) => (
              <SelectItem
                key={option.code}
                value={option.code}
                text={t(option.display)}
              />
            ))}
          </Select>
        </div>

        {/* Age and Birthdate Section */}
        <div className={styles.ageSection}>
          <Grid className={styles.ageGrid}>
            {/* Age Fields (shown first if DOB is not mandatory) */}
            {!dobMandatory && (
              <Column sm={4} md={6} lg={8}>
                <h4 className={styles.sectionTitle}>
                  {t('REGISTRATION_LABEL_AGE')}
                  {!dobMandatory && <span className={styles.required}>*</span>}
                </h4>
                <div className={styles.ageFields}>
                  <div className={styles.ageField}>
                    <TextInput
                      id="ageYears"
                      labelText={t('REGISTRATION_LABEL_YEARS')}
                      type="number"
                      min="0"
                      max="120"
                      value={data.age.years.toString()}
                      onChange={(e) =>
                        handleAgeChange('years', parseInt(e.target.value) || 0)
                      }
                      disabled={disabled}
                      invalid={hasAgeError}
                      invalidText={ageError}
                      required={!dobMandatory}
                    />
                  </div>
                  <div className={styles.ageField}>
                    <TextInput
                      id="ageMonths"
                      labelText={t('REGISTRATION_LABEL_MONTHS')}
                      type="number"
                      min="0"
                      max="12"
                      value={data.age.months.toString()}
                      onChange={(e) =>
                        handleAgeChange('months', parseInt(e.target.value) || 0)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className={styles.ageField}>
                    <TextInput
                      id="ageDays"
                      labelText={t('REGISTRATION_LABEL_DAYS')}
                      type="number"
                      min="0"
                      max="31"
                      value={data.age.days.toString()}
                      onChange={(e) =>
                        handleAgeChange('days', parseInt(e.target.value) || 0)
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>
              </Column>
            )}

            {/* Birthdate Field */}
            <Column sm={4} md={6} lg={8}>
              <h4 className={styles.sectionTitle}>
                {t('REGISTRATION_LABEL_DOB')}
                {dobMandatory && <span className={styles.required}>*</span>}
              </h4>
              <div className={styles.birthdateField}>
                <DatePicker
                  datePickerType="single"
                  value={data.birthdate ? new Date(data.birthdate) : undefined}
                  onChange={handleBirthdateChange}
                  maxDate={today}
                >
                  <DatePickerInput
                    id="birthdate"
                    placeholder="mm/dd/yyyy"
                    labelText=""
                    disabled={disabled}
                    invalid={hasBirthdateError}
                    invalidText={birthdateError}
                  />
                </DatePicker>

                {/* Estimated checkbox */}
                <div className={styles.estimatedCheckbox}>
                  <Checkbox
                    id="birthdateEstimated"
                    labelText={t('REGISTRATION_LABEL_ESTIMATE')}
                    checked={data.birthdateEstimated || false}
                    onChange={(_, { checked }) =>
                      handleBirthdateEstimatedChange(checked)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            </Column>
          </Grid>

          {/* Birth Time (if enabled) */}
          {showBirthTime && (
            <div className={styles.birthTimeSection}>
              <TimePicker
                id="birthtime"
                labelText={t('REGISTRATION_LABEL_BIRTH_TIME')}
                value={data.birthtime || ''}
                onChange={handleBirthTimeChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </Stack>
    </FormGroup>
  );
};

export default PatientDemographicsSection;
