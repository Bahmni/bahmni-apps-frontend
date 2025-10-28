import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useState, useCallback } from 'react';
import { type PatientFormData } from '../models/patientForm';
import {
  INITIAL_AGE_ERRORS,
  INITIAL_DATE_ERRORS,
  type AgeErrors,
  type DateErrors,
} from '../models/validation';
import { AgeUtils, formatToISO } from '../utils/ageUtils';
import { MAX_AGE_YEARS } from '../utils/constants';
import {
  isValidDateRange,
  isFutureDate,
  formatDateForDisplay,
} from '../utils/validation';

export const useDateOfBirth = (
  formData: PatientFormData,
  updateForm: (field: keyof PatientFormData, value: string | boolean) => void,
  updateMultipleFields: (updates: Partial<PatientFormData>) => void,
) => {
  const { t } = useTranslation();
  const [dobEstimated, setDobEstimated] = useState(false);
  const [ageErrors, setAgeErrors] = useState<AgeErrors>(INITIAL_AGE_ERRORS);
  const [dateErrors, setDateErrors] = useState<DateErrors>(INITIAL_DATE_ERRORS);

  // Helper function to clear all errors
  const clearAllErrors = useCallback(() => {
    setDateErrors({ dateOfBirth: '' });
    setAgeErrors({ ageYears: '', ageMonths: '', ageDays: '' });
  }, []);

  // Helper function to clear form age data
  const clearAgeData = useCallback(() => {
    updateMultipleFields({
      dateOfBirth: '',
      ageYears: '',
      ageMonths: '',
      ageDays: '',
    });
    setDobEstimated(false);
  }, [updateMultipleFields]);

  // Helper function to update form with calculated age
  const updateFormWithAge = useCallback(
    (date: Date) => {
      const isoDate = formatToISO(date);
      const calculatedAge = AgeUtils.diffInYearsMonthsDays(date, new Date());

      updateMultipleFields({
        dateOfBirth: isoDate,
        ageYears: String(calculatedAge.years ?? 0),
        ageMonths: String(calculatedAge.months ?? 0),
        ageDays: String(calculatedAge.days ?? 0),
      });
      setDobEstimated(false);
      clearAllErrors();
    },
    [updateMultipleFields, clearAllErrors],
  );

  const handleDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/\D/g, '');
      const inputElement = e.target;

      if (input.length === 0) {
        inputElement.value = '';
        clearAgeData();
        setDateErrors({ dateOfBirth: '' });
        return;
      }

      // Format as DD/MM/YYYY while typing
      let formatted = '';
      if (input.length <= 2) {
        formatted = input;
      } else if (input.length <= 4) {
        formatted = `${input.slice(0, 2)}/${input.slice(2)}`;
      } else {
        formatted = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 8)}`;
      }

      inputElement.value = formatted;

      // If complete date (8 digits), parse and validate
      if (input.length === 8) {
        const day = parseInt(input.slice(0, 2), 10);
        const month = parseInt(input.slice(2, 4), 10);
        const year = parseInt(input.slice(4, 8), 10);

        // Check for invalid day or month ranges
        if (!isValidDateRange(day, month, year)) {
          setDateErrors({ dateOfBirth: t('DATE_ERROR_INVALID_FORMAT') });
          clearAgeData();
          return;
        }

        const parsedDate = new Date(year, month - 1, day);

        // Check if date is in future
        if (isFutureDate(parsedDate)) {
          const todayFormatted = formatDateForDisplay(new Date());
          setDateErrors({
            dateOfBirth: t('DATE_ERROR_FUTURE_DATE', { date: todayFormatted }),
          });
          clearAgeData();
          return;
        }

        // Calculate age to validate it's within acceptable range
        const calculatedAge = AgeUtils.diffInYearsMonthsDays(
          parsedDate,
          new Date(),
        );

        // Check if calculated age exceeds 120 years
        if (calculatedAge.years && calculatedAge.years > MAX_AGE_YEARS) {
          setDateErrors({
            dateOfBirth: t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX'),
          });
          clearAgeData();
          return;
        }

        // If no errors, update form data
        updateFormWithAge(parsedDate);
      }
    },
    [t, clearAgeData, updateFormWithAge],
  );

  const handleDateOfBirthChange = useCallback(
    (selectedDates: Date[] = []) => {
      if (!selectedDates || selectedDates.length === 0) return;
      const selectedDate = selectedDates[0];
      if (!selectedDate) return;

      updateFormWithAge(selectedDate);
    },
    [updateFormWithAge],
  );

  const handleAgeChange = useCallback(
    (field: 'ageYears' | 'ageMonths' | 'ageDays', value: string) => {
      const numValue = Number(value);
      let error = '';

      // Validate based on field
      if (value && !isNaN(numValue)) {
        if (field === 'ageYears' && numValue > MAX_AGE_YEARS) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX');
          // Set DOB to today's date when age exceeds 120
          updateMultipleFields({
            [field]: value,
            dateOfBirth: formatToISO(new Date()),
          });
          setAgeErrors((prev) => ({ ...prev, [field]: error }));
          setDobEstimated(true);
          return;
        } else if (field === 'ageMonths' && numValue > 11) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX');
        } else if (field === 'ageDays' && numValue > 31) {
          error = t('CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX');
        }
      }

      setAgeErrors((prev) => ({ ...prev, [field]: error }));

      // Only update formData if there's no error
      if (!error) {
        updateForm(field, value);

        const age = {
          years: Number(field === 'ageYears' ? value : formData.ageYears) || 0,
          months:
            Number(field === 'ageMonths' ? value : formData.ageMonths) || 0,
          days: Number(field === 'ageDays' ? value : formData.ageDays) || 0,
        };

        if (age.years > 0 || age.months > 0 || age.days > 0) {
          const birthISO = AgeUtils.calculateBirthDate(age);
          updateForm('dateOfBirth', birthISO);
          setDobEstimated(true);
        } else {
          updateForm('dateOfBirth', '');
          setDobEstimated(false);
        }
      } else {
        // Still update the value even if there's an error, so user can see their input
        updateForm(field, value);
      }
    },
    [
      t,
      formData.ageYears,
      formData.ageMonths,
      formData.ageDays,
      updateForm,
      updateMultipleFields,
    ],
  );

  return {
    dobEstimated,
    setDobEstimated,
    ageErrors,
    dateErrors,
    handleDateInputChange,
    handleDateOfBirthChange,
    handleAgeChange,
    clearAllErrors,
  };
};
