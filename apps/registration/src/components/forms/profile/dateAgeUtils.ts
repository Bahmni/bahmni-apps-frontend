import { MAX_PATIENT_AGE_YEARS } from '@bahmni-frontend/bahmni-services';
import {
  AgeUtils,
  formatToDisplay,
  formatToISO,
} from '../../../utils/ageUtils';

export interface DateErrors {
  dateOfBirth: string;
}

export interface AgeErrors {
  ageYears: string;
  ageMonths: string;
  ageDays: string;
}

interface DateAgeHandlers {
  clearAllErrors: () => void;
  clearAgeData: () => void;
  updateFormWithAge: (date: Date) => void;
  handleDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateOfBirthChange: (selectedDates: Date[]) => void;
  handleAgeChange: (
    field: 'ageYears' | 'ageMonths' | 'ageDays',
    value: string,
  ) => void;
}

interface CreateDateAgeHandlersParams<
  T extends {
    dateOfBirth: string;
    ageYears: string;
    ageMonths: string;
    ageDays: string;
  },
> {
  setDateErrors: React.Dispatch<React.SetStateAction<DateErrors>>;
  setValidationErrors: React.Dispatch<
    React.SetStateAction<{
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth: string;
    }>
  >;
  setAgeErrors: React.Dispatch<React.SetStateAction<AgeErrors>>;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  setDobEstimated: React.Dispatch<React.SetStateAction<boolean>>;
  t: (key: string) => string;
}

export const createDateAgeHandlers = <
  T extends {
    dateOfBirth: string;
    ageYears: string;
    ageMonths: string;
    ageDays: string;
  },
>({
  setDateErrors,
  setValidationErrors,
  setAgeErrors,
  setFormData,
  setDobEstimated,
  t,
}: CreateDateAgeHandlersParams<T>): DateAgeHandlers => {
  const clearAllErrors = () => {
    setDateErrors({ dateOfBirth: '' });
    setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
    setAgeErrors({ ageYears: '', ageMonths: '', ageDays: '' });
  };

  const clearAgeData = () => {
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: '',
      ageYears: '',
      ageMonths: '',
      ageDays: '',
    }));
    setDobEstimated(false);
  };

  const updateFormWithAge = (date: Date) => {
    const isoDate = formatToISO(date);
    const calculatedAge = AgeUtils.diffInYearsMonthsDays(date, new Date());

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: isoDate,
      ageYears: String(calculatedAge.years ?? 0),
      ageMonths: String(calculatedAge.months ?? 0),
      ageDays: String(calculatedAge.days ?? 0),
    }));
    setDobEstimated(false);
    clearAllErrors();
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    const inputElement = e.target;

    if (input.length === 0) {
      inputElement.value = '';
      clearAgeData();
      setDateErrors({ dateOfBirth: '' });
      setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
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
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        setDateErrors({ dateOfBirth: t('DATE_ERROR_INVALID_FORMAT') });
        clearAgeData();
        return;
      }

      const parsedDate = new Date(year, month - 1, day);

      // Check if date is valid (e.g., not 31st Feb)
      if (
        parsedDate.getDate() !== day ||
        parsedDate.getMonth() !== month - 1 ||
        parsedDate.getFullYear() !== year
      ) {
        setDateErrors({ dateOfBirth: t('DATE_ERROR_INVALID_FORMAT') });
        clearAgeData();
        return;
      }

      // Check if date is in future
      if (parsedDate > new Date()) {
        setDateErrors({
          dateOfBirth: t('DATE_ERROR_FUTURE_DATE'),
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
      if (calculatedAge.years && calculatedAge.years > MAX_PATIENT_AGE_YEARS) {
        setDateErrors({
          dateOfBirth: t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX'),
        });
        clearAgeData();
        return;
      }

      // If no errors, update form data
      updateFormWithAge(parsedDate);
    }
  };

  const handleDateOfBirthChange = (selectedDates: Date[] = []) => {
    if (!selectedDates || selectedDates.length === 0) return;
    const selectedDate = selectedDates[0];
    if (!selectedDate) return;

    updateFormWithAge(selectedDate);
  };

  const handleAgeChange = (
    field: 'ageYears' | 'ageMonths' | 'ageDays',
    value: string,
  ) => {
    const numValue = Number(value);
    let error = '';

    // Validate based on field
    if (value && !isNaN(numValue)) {
      if (field === 'ageYears' && numValue > MAX_PATIENT_AGE_YEARS) {
        error = t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX');
        // Set DOB to today's date when age exceeds 120
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          dateOfBirth: formatToISO(new Date()),
        }));
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
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        const age = {
          years: Number(updated.ageYears) || 0,
          months: Number(updated.ageMonths) || 0,
          days: Number(updated.ageDays) || 0,
        };
        if (age.years > 0 || age.months > 0 || age.days > 0) {
          const birthISO = AgeUtils.calculateBirthDate(age);
          updated.dateOfBirth = birthISO;
          setDobEstimated(true);
          setDateErrors({ dateOfBirth: '' });
          setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
        } else {
          updated.dateOfBirth = '';
          setDobEstimated(false);
        }
        return updated;
      });
    } else {
      // Still update the value even if there's an error, so user can see their input
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return {
    clearAllErrors,
    clearAgeData,
    updateFormWithAge,
    handleDateInputChange,
    handleDateOfBirthChange,
    handleAgeChange,
  };
};

export { formatToDisplay, formatToISO };
