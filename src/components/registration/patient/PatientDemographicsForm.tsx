/**
 * Patient Demographics Form
 * First step of patient creation wizard - basic demographic information
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientFormData } from '../../../types/registration';
import { WizardContextValue } from './PatientFormWizardContext';
import './PatientDemographicsForm.module.scss';

interface PatientDemographicsFormProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  updateField: (field: string, value: any) => void;
  wizard: WizardContextValue;
}

export const PatientDemographicsForm: React.FC<PatientDemographicsFormProps> = ({
  formData,
  errors,
  updateField,
  wizard,
}) => {
  const { t } = useTranslation();

  // Calculate age from birthdate or vice versa
  const calculateAge = useCallback((birthdate: string): number | undefined => {
    if (!birthdate) return undefined;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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
  const handleBirthdateChange = useCallback((value: string) => {
    updateField('birthdate', value);
    if (value) {
      const calculatedAge = calculateAge(value);
      updateField('age', calculatedAge);
      updateField('birthdateEstimated', false);
    } else {
      updateField('age', undefined);
    }
  }, [updateField, calculateAge]);

  // Handle age change
  const handleAgeChange = useCallback((value: string) => {
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
  }, [updateField, calculateBirthdate]);

  // Form validation
  const stepValidation = useMemo(() => {
    const stepErrors: string[] = [];
    let isValid = true;
    let isComplete = true;

    // Required fields validation
    if (!formData.givenName?.trim()) {
      stepErrors.push(t('registration.patient.demographics.validation.givenNameRequired'));
      isValid = false;
      isComplete = false;
    }

    if (!formData.familyName?.trim()) {
      stepErrors.push(t('registration.patient.demographics.validation.familyNameRequired'));
      isValid = false;
      isComplete = false;
    }

    if (!formData.gender) {
      stepErrors.push(t('registration.patient.demographics.validation.genderRequired'));
      isValid = false;
      isComplete = false;
    }

    // Either age or birthdate must be provided
    if (!formData.birthdate && !formData.age) {
      stepErrors.push(t('registration.patient.demographics.validation.ageOrBirthdateRequired'));
      isValid = false;
      isComplete = false;
    }

    // Name validation (2-50 characters, letters/spaces/hyphens only)
    const namePattern = /^[a-zA-Z\s\-']{2,50}$/;

    if (formData.givenName && !namePattern.test(formData.givenName)) {
      stepErrors.push(t('registration.patient.demographics.validation.givenNameInvalid'));
      isValid = false;
    }

    if (formData.familyName && !namePattern.test(formData.familyName)) {
      stepErrors.push(t('registration.patient.demographics.validation.familyNameInvalid'));
      isValid = false;
    }

    if (formData.middleName && !namePattern.test(formData.middleName)) {
      stepErrors.push(t('registration.patient.demographics.validation.middleNameInvalid'));
      isValid = false;
    }

    // Age validation (0-150)
    if (formData.age !== undefined && (formData.age < 0 || formData.age > 150)) {
      stepErrors.push(t('registration.patient.demographics.validation.ageInvalid'));
      isValid = false;
    }

    // Birthdate validation (after 1900, not in future)
    if (formData.birthdate) {
      const birthDate = new Date(formData.birthdate);
      const minDate = new Date('1900-01-01');
      const today = new Date();

      if (birthDate < minDate) {
        stepErrors.push(t('registration.patient.demographics.validation.birthdateTooOld'));
        isValid = false;
      }

      if (birthDate > today) {
        stepErrors.push(t('registration.patient.demographics.validation.birthdateFuture'));
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
    <div className="patient-demographics-form">
      <div className="patient-demographics-form__section">
        <h3 className="patient-demographics-form__section-title">
          {t('registration.patient.demographics.personalInfo')}
        </h3>

        <div className="patient-demographics-form__row">
          {/* Given Name */}
          <div className="patient-demographics-form__field">
            <label htmlFor="givenName" className="patient-demographics-form__label">
              {t('registration.patient.demographics.givenName')}
              <span className="patient-demographics-form__required">*</span>
            </label>
            <input
              type="text"
              id="givenName"
              className={`patient-demographics-form__input ${errors.givenName ? 'error' : ''}`}
              value={formData.givenName || ''}
              onChange={(e) => updateField('givenName', e.target.value)}
              placeholder={t('registration.patient.demographics.givenNamePlaceholder')}
              maxLength={50}
              required
              aria-describedby={errors.givenName ? 'givenName-error' : undefined}
            />
            {errors.givenName && (
              <div id="givenName-error" className="patient-demographics-form__error" role="alert">
                {errors.givenName}
              </div>
            )}
          </div>

          {/* Middle Name */}
          <div className="patient-demographics-form__field">
            <label htmlFor="middleName" className="patient-demographics-form__label">
              {t('registration.patient.demographics.middleName')}
            </label>
            <input
              type="text"
              id="middleName"
              className={`patient-demographics-form__input ${errors.middleName ? 'error' : ''}`}
              value={formData.middleName || ''}
              onChange={(e) => updateField('middleName', e.target.value)}
              placeholder={t('registration.patient.demographics.middleNamePlaceholder')}
              maxLength={50}
              aria-describedby={errors.middleName ? 'middleName-error' : undefined}
            />
            {errors.middleName && (
              <div id="middleName-error" className="patient-demographics-form__error" role="alert">
                {errors.middleName}
              </div>
            )}
          </div>
        </div>

        <div className="patient-demographics-form__row">
          {/* Family Name */}
          <div className="patient-demographics-form__field">
            <label htmlFor="familyName" className="patient-demographics-form__label">
              {t('registration.patient.demographics.familyName')}
              <span className="patient-demographics-form__required">*</span>
            </label>
            <input
              type="text"
              id="familyName"
              className={`patient-demographics-form__input ${errors.familyName ? 'error' : ''}`}
              value={formData.familyName || ''}
              onChange={(e) => updateField('familyName', e.target.value)}
              placeholder={t('registration.patient.demographics.familyNamePlaceholder')}
              maxLength={50}
              required
              aria-describedby={errors.familyName ? 'familyName-error' : undefined}
            />
            {errors.familyName && (
              <div id="familyName-error" className="patient-demographics-form__error" role="alert">
                {errors.familyName}
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="patient-demographics-form__field">
            <fieldset className="patient-demographics-form__fieldset">
              <legend className="patient-demographics-form__legend">
                {t('registration.patient.demographics.gender')}
                <span className="patient-demographics-form__required">*</span>
              </legend>
              <div className="patient-demographics-form__radio-group">
                <div className="patient-demographics-form__radio-item">
                  <input
                    type="radio"
                    id="gender-male"
                    name="gender"
                    value="M"
                    checked={formData.gender === 'M'}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="patient-demographics-form__radio"
                  />
                  <label htmlFor="gender-male" className="patient-demographics-form__radio-label">
                    {t('registration.patient.demographics.genderMale')}
                  </label>
                </div>
                <div className="patient-demographics-form__radio-item">
                  <input
                    type="radio"
                    id="gender-female"
                    name="gender"
                    value="F"
                    checked={formData.gender === 'F'}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="patient-demographics-form__radio"
                  />
                  <label htmlFor="gender-female" className="patient-demographics-form__radio-label">
                    {t('registration.patient.demographics.genderFemale')}
                  </label>
                </div>
                <div className="patient-demographics-form__radio-item">
                  <input
                    type="radio"
                    id="gender-other"
                    name="gender"
                    value="O"
                    checked={formData.gender === 'O'}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="patient-demographics-form__radio"
                  />
                  <label htmlFor="gender-other" className="patient-demographics-form__radio-label">
                    {t('registration.patient.demographics.genderOther')}
                  </label>
                </div>
              </div>
            </fieldset>
            {errors.gender && (
              <div className="patient-demographics-form__error" role="alert">
                {errors.gender}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="patient-demographics-form__section">
        <h3 className="patient-demographics-form__section-title">
          {t('registration.patient.demographics.ageInfo')}
        </h3>

        <div className="patient-demographics-form__row">
          {/* Date of Birth */}
          <div className="patient-demographics-form__field">
            <label htmlFor="birthdate" className="patient-demographics-form__label">
              {t('registration.patient.demographics.birthdate')}
            </label>
            <input
              type="date"
              id="birthdate"
              className={`patient-demographics-form__input ${errors.birthdate ? 'error' : ''}`}
              value={formData.birthdate || ''}
              onChange={(e) => handleBirthdateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              aria-describedby={errors.birthdate ? 'birthdate-error' : 'birthdate-help'}
            />
            <div id="birthdate-help" className="patient-demographics-form__help">
              {t('registration.patient.demographics.birthdateHelp')}
            </div>
            {errors.birthdate && (
              <div id="birthdate-error" className="patient-demographics-form__error" role="alert">
                {errors.birthdate}
              </div>
            )}
          </div>

          {/* Age */}
          <div className="patient-demographics-form__field">
            <label htmlFor="age" className="patient-demographics-form__label">
              {t('registration.patient.demographics.age')}
            </label>
            <input
              type="number"
              id="age"
              className={`patient-demographics-form__input ${errors.age ? 'error' : ''}`}
              value={formData.age || ''}
              onChange={(e) => handleAgeChange(e.target.value)}
              min="0"
              max="150"
              placeholder={t('registration.patient.demographics.agePlaceholder')}
              aria-describedby={errors.age ? 'age-error' : 'age-help'}
            />
            <div id="age-help" className="patient-demographics-form__help">
              {t('registration.patient.demographics.ageHelp')}
            </div>
            {errors.age && (
              <div id="age-error" className="patient-demographics-form__error" role="alert">
                {errors.age}
              </div>
            )}
          </div>
        </div>

        {/* Birthdate Estimated Checkbox */}
        {formData.age && (
          <div className="patient-demographics-form__field">
            <div className="patient-demographics-form__checkbox-item">
              <input
                type="checkbox"
                id="birthdateEstimated"
                className="patient-demographics-form__checkbox"
                checked={formData.birthdateEstimated || false}
                onChange={(e) => updateField('birthdateEstimated', e.target.checked)}
              />
              <label htmlFor="birthdateEstimated" className="patient-demographics-form__checkbox-label">
                {t('registration.patient.demographics.birthdateEstimated')}
              </label>
            </div>
            <div className="patient-demographics-form__help">
              {t('registration.patient.demographics.birthdateEstimatedHelp')}
            </div>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {stepValidation.errors.length > 0 && (
        <div className="patient-demographics-form__validation-summary" role="alert">
          <h4 className="patient-demographics-form__validation-title">
            {t('registration.patient.demographics.validationErrors')}
          </h4>
          <ul className="patient-demographics-form__validation-list">
            {stepValidation.errors.map((error, index) => (
              <li key={index} className="patient-demographics-form__validation-item">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PatientDemographicsForm;
