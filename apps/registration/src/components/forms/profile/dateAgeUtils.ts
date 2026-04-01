import { MAX_PATIENT_AGE_YEARS, calculateAge } from '@bahmni/services';
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
      middleName: string;
      gender: string;
      dateOfBirth: string;
      birthTime: string;
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
    const calculatedAge = calculateAge(isoDate);

    setFormData((prev) => ({
      ...prev,
      dateOfBirth: isoDate,
      ageYears: String(calculatedAge?.years ?? 0),
      ageMonths: String(calculatedAge?.months ?? 0),
      ageDays: String(calculatedAge?.days ?? 0),
    }));
    setDobEstimated(false);
    clearAllErrors();
  };

  const handleDateOfBirthChange = (selectedDates: Date[] = []) => {
    if (!selectedDates || selectedDates.length === 0) return;
    const selectedDate = selectedDates[0];
    if (!selectedDate) return;

    const calculatedAge = calculateAge(formatToISO(selectedDate));

    if (calculatedAge?.years && calculatedAge.years > MAX_PATIENT_AGE_YEARS) {
      setDateErrors({
        dateOfBirth: t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX'),
      });
      clearAgeData();
      return;
    }
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

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          dateOfBirth: formatToISO(new Date()),
        }));
        setAgeErrors((prev) => ({ ...prev, [field]: error }));
        setDateErrors({ dateOfBirth: error });
        setDobEstimated(true);
        return;
      } else if (field === 'ageMonths' && numValue > 11) {
        error = t('CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX');

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          dateOfBirth: formatToISO(new Date()),
        }));
      } else if (field === 'ageDays' && numValue > 31) {
        error = t('CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX');

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          dateOfBirth: formatToISO(new Date()),
        }));
      }
    }

    // Update error state
    const updatedErrors = { [field]: error };
    setAgeErrors((prev) => ({ ...prev, ...updatedErrors }));

    // Only update formData if there's no error in the individual field
    if (!error) {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        const age = {
          years:
            Number(updated.ageYears) > MAX_PATIENT_AGE_YEARS
              ? 0
              : Number(updated.ageYears) || 0,
          months:
            Number(updated.ageMonths) > 11 ? 0 : Number(updated.ageMonths) || 0,
          days: Number(updated.ageDays) > 31 ? 0 : Number(updated.ageDays) || 0,
        };

        const hasAgeErrors =
          Number(updated.ageYears) > MAX_PATIENT_AGE_YEARS ||
          Number(updated.ageMonths) > 11 ||
          Number(updated.ageDays) > 31;

        if (age.years > 0 || age.months > 0 || age.days > 0) {
          const birthISO = AgeUtils.calculateBirthDate(age);
          updated.dateOfBirth = birthISO;
          setDobEstimated(true);

          const maxAgeDate = new Date();
          maxAgeDate.setFullYear(
            maxAgeDate.getFullYear() - MAX_PATIENT_AGE_YEARS,
          );
          maxAgeDate.setHours(0, 0, 0, 0);

          const calculatedDobDate = new Date(birthISO);
          calculatedDobDate.setHours(0, 0, 0, 0);

          if (calculatedDobDate < maxAgeDate) {
            // Age exceeds 120 years
            setDateErrors({
              dateOfBirth: t('CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX'),
            });
          } else {
            // Age is valid (120 years or younger)
            setDateErrors({ dateOfBirth: '' });
            setValidationErrors((prev) => ({ ...prev, dateOfBirth: '' }));
          }
        } else if (
          age.years == 0 &&
          age.months == 0 &&
          age.days == 0 &&
          !hasAgeErrors
        ) {
          updated.dateOfBirth = '';
          setDobEstimated(false);
          setDateErrors({ dateOfBirth: '' });
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: value,
            dateOfBirth: formatToISO(new Date()),
          }));
          setDobEstimated(false);
          setDateErrors({ dateOfBirth: '' });
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
    handleDateOfBirthChange,
    handleAgeChange,
  };
};
export const convertTimeToISODateTime = (
  dateString: string,
  timeString: string | null,
): string | null => {
  if (!timeString) {
    return null;
  }

  // If timeString is already a full ISO datetime string, return it as-is
  if (timeString.includes('T')) {
    return timeString;
  }

  const date = new Date(`${dateString}T${timeString}:00`);
  return date.toISOString();
};

export { formatToDisplay, formatToISO };
