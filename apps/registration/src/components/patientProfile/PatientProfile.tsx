import {
  Button,
  TextInput,
  Dropdown,
  Checkbox,
  DatePicker,
  DatePickerInput,
  CheckboxGroup,
} from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { useState } from 'react';
import styles from '../../pages/createPatientPage/styles/index.module.scss';
import { createDateAgeHandlers } from '../../pages/createPatientPage/utils/dateAgeUtils';

export interface BasicInfoData {
  patientIdFormat: string;
  entryType: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  ageYears: string;
  ageMonths: string;
  ageDays: string;
  dateOfBirth: string;
  birthTime: string;
}

export interface BasicInfoErrors {
  firstName: string;
  middleName: string;
  lastName: string;
}

export interface ValidationErrors {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

export interface AgeErrors {
  ageYears: string;
  ageMonths: string;
  ageDays: string;
}

export interface DateErrors {
  dateOfBirth: string;
}

interface BasicInformationProps {
  formData: BasicInfoData;
  dobEstimated: boolean;
  identifierPrefixes: string[];
  genders: string[];
  maxPatientAgeYears: number;
  onInputChange: (field: string, value: string | number | boolean) => void;
  onDobEstimatedChange: (value: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<BasicInfoData>>;
  formatToDisplay: (isoDate: string) => string;
  getValidationErrors?: () => {
    validationErrors: ValidationErrors;
    ageErrors: AgeErrors;
    dateErrors: DateErrors;
  };
  onValidate?: (callback: () => boolean) => void;
}

export const PatientProfile: React.FC<BasicInformationProps> = ({
  formData,
  dobEstimated,
  identifierPrefixes,
  genders,
  maxPatientAgeYears,
  onInputChange,
  onDobEstimatedChange,
  setFormData,
  formatToDisplay,
  getValidationErrors,
  onValidate,
}) => {
  const { t } = useTranslation();

  // Manage all error states internally
  const [nameErrors, setNameErrors] = useState<BasicInfoErrors>({
    firstName: '',
    middleName: '',
    lastName: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
  });

  const [ageErrors, setAgeErrors] = useState<AgeErrors>({
    ageYears: '',
    ageMonths: '',
    ageDays: '',
  });

  const [dateErrors, setDateErrors] = useState<DateErrors>({
    dateOfBirth: '',
  });

  // Expose errors to parent for validation
  if (getValidationErrors) {
    Object.assign(getValidationErrors, () => ({
      validationErrors,
      ageErrors,
      dateErrors,
    }));
  }

  // Validation function to be called from parent
  const validateFields = (): boolean => {
    let isValid = true;
    const newValidationErrors = { ...validationErrors };

    if (!formData.firstName.trim()) {
      newValidationErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newValidationErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.gender) {
      newValidationErrors.gender = 'Gender is required';
      isValid = false;
    }

    if (!formData.dateOfBirth) {
      newValidationErrors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  // Expose validate function to parent
  if (onValidate) {
    onValidate(validateFields);
  }

  // Handle name changes with validation
  const handleNameChange = (field: string, value: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (nameRegex.test(value)) {
      onInputChange(field, value);
      setNameErrors((prev) => ({ ...prev, [field]: '' }));
      setValidationErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    } else {
      setNameErrors((prev) => ({
        ...prev,
        [field]: t('CREATE_PATIENT_VALIDATION_NAME_INVALID'),
      }));
    }
  };

  // Use date/age utility handlers - need to wrap onDobEstimatedChange
  const [internalDobEstimated, setInternalDobEstimated] =
    useState(dobEstimated);

  const { handleDateInputChange, handleDateOfBirthChange, handleAgeChange } =
    createDateAgeHandlers({
      setDateErrors,
      setValidationErrors,
      setAgeErrors,
      setFormData: setFormData as React.Dispatch<
        React.SetStateAction<BasicInfoData>
      >,
      setDobEstimated: (value) => {
        setInternalDobEstimated(
          typeof value === 'function' ? value(internalDobEstimated) : value,
        );
        onDobEstimatedChange(
          typeof value === 'function' ? value(dobEstimated) : value,
        );
      },
      t,
    });

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>
        {t('CREATE_PATIENT_SECTION_BASIC_INFO')}
      </span>
      <div className={styles.row}>
        <div className={styles.photocol}>
          <div className={styles.photoUploadSection}>
            <Button kind="tertiary" size="sm" className={styles.wrapButton}>
              {t('CREATE_PATIENT_UPLOAD_PHOTO')}
            </Button>
            <Button kind="tertiary" size="sm" className={styles.wrapButton}>
              {t('CREATE_PATIENT_CAPTURE_PHOTO')}
            </Button>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.row}>
            <div className={styles.dropdownField}>
              <Dropdown
                id="patient-id-format"
                titleText={t('CREATE_PATIENT_PATIENT_ID_FORMAT')}
                label={
                  (formData.patientIdFormat || identifierPrefixes[0]) ??
                  t('CREATE_PATIENT_SELECT')
                }
                items={identifierPrefixes}
                selectedItem={formData.patientIdFormat}
                onChange={({ selectedItem }) =>
                  onInputChange('patientIdFormat', selectedItem ?? '')
                }
              />
            </div>
            <div className={styles.col}>
              <CheckboxGroup legendText={t('CREATE_PATIENT_ENTRY_TYPE')}>
                <div className={styles.checkboxField}>
                  <Checkbox
                    labelText={t('CREATE_PATIENT_ENTER_MANUALLY')}
                    id="entry-type"
                    checked={formData.entryType}
                    onChange={(e) =>
                      onInputChange('entryType', e.target.checked)
                    }
                  />
                </div>
              </CheckboxGroup>
            </div>
          </div>

          <div className={`${styles.row} ${styles.nameFields}`}>
            <TextInput
              id="first-name"
              labelText={t('CREATE_PATIENT_FIRST_NAME')}
              placeholder={t('CREATE_PATIENT_FIRST_NAME_PLACEHOLDER')}
              value={formData.firstName}
              required
              invalid={!!nameErrors.firstName || !!validationErrors.firstName}
              invalidText={nameErrors.firstName || validationErrors.firstName}
              onChange={(e) => handleNameChange('firstName', e.target.value)}
            />

            <TextInput
              id="middle-name"
              labelText={t('CREATE_PATIENT_MIDDLE_NAME')}
              placeholder={t('CREATE_PATIENT_MIDDLE_NAME_PLACEHOLDER')}
              value={formData.middleName}
              invalid={!!nameErrors.middleName}
              invalidText={nameErrors.middleName}
              onChange={(e) => handleNameChange('middleName', e.target.value)}
            />

            <TextInput
              id="last-name"
              labelText={t('CREATE_PATIENT_LAST_NAME')}
              placeholder={t('CREATE_PATIENT_LAST_NAME_PLACEHOLDER')}
              required
              value={formData.lastName}
              invalid={!!nameErrors.lastName || !!validationErrors.lastName}
              invalidText={nameErrors.lastName || validationErrors.lastName}
              onChange={(e) => handleNameChange('lastName', e.target.value)}
            />
          </div>
          <div className={`${styles.row} ${styles.demographicsFields}`}>
            <div className={styles.dropdownField}>
              <Dropdown
                id="gender"
                titleText={t('CREATE_PATIENT_GENDER')}
                label={t('CREATE_PATIENT_SELECT')}
                items={genders}
                aria-required="true"
                selectedItem={formData.gender}
                invalid={!!validationErrors.gender}
                invalidText={validationErrors.gender}
                onChange={({ selectedItem }) => {
                  onInputChange('gender', selectedItem ?? '');
                  setValidationErrors({
                    ...validationErrors,
                    gender: '',
                  });
                }}
              />
            </div>

            <div className={styles.col}>
              <div className={styles.ageFieldsWrapper}>
                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-years"
                    labelText={t('CREATE_PATIENT_AGE_YEARS')}
                    type="number"
                    required
                    min={0}
                    max={maxPatientAgeYears}
                    value={formData.ageYears}
                    invalid={!!ageErrors.ageYears}
                    invalidText={ageErrors.ageYears}
                    onChange={(e) =>
                      handleAgeChange('ageYears', e.target.value)
                    }
                  />
                </div>

                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-months"
                    labelText={t('CREATE_PATIENT_AGE_MONTHS')}
                    type="number"
                    required
                    min={0}
                    max={11}
                    value={formData.ageMonths}
                    invalid={!!ageErrors.ageMonths}
                    invalidText={ageErrors.ageMonths}
                    onChange={(e) =>
                      handleAgeChange('ageMonths', e.target.value)
                    }
                  />
                </div>
                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-days"
                    labelText={t('CREATE_PATIENT_AGE_DAYS')}
                    type="number"
                    min={0}
                    max={31}
                    value={formData.ageDays}
                    invalid={!!ageErrors.ageDays}
                    invalidText={ageErrors.ageDays}
                    onChange={(e) => handleAgeChange('ageDays', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.row} ${styles.birthInfoFields}`}>
            <div>
              <DatePicker
                dateFormat="d/m/Y"
                datePickerType="single"
                minDate={(() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - maxPatientAgeYears + 1);
                  date.setHours(0, 0, 0, 0);
                  return date;
                })()}
                maxDate={new Date()}
                value={
                  formData.dateOfBirth
                    ? formatToDisplay(formData.dateOfBirth)
                    : ''
                }
                onChange={handleDateOfBirthChange}
              >
                <DatePickerInput
                  id="date-of-birth"
                  placeholder={t('CREATE_PATIENT_DATE_OF_BIRTH_PLACEHOLDER')}
                  labelText={t('CREATE_PATIENT_DATE_OF_BIRTH')}
                  invalid={
                    !!dateErrors.dateOfBirth || !!validationErrors.dateOfBirth
                  }
                  invalidText={
                    dateErrors.dateOfBirth || validationErrors.dateOfBirth
                  }
                  onInput={handleDateInputChange}
                />
              </DatePicker>
            </div>

            <CheckboxGroup legendText={t('CREATE_PATIENT_ACCURACY')}>
              <div className={styles.checkboxField}>
                <Checkbox
                  labelText={t('CREATE_PATIENT_ESTIMATED')}
                  id="accuracy"
                  checked={dobEstimated}
                  onChange={() => onDobEstimatedChange(!dobEstimated)}
                />
              </div>
            </CheckboxGroup>
            <div>
              <TextInput
                id="birth-time"
                type="time"
                required
                value={formData.birthTime}
                onChange={(e) => onInputChange('birthTime', e.target.value)}
                labelText={t('CREATE_PATIENT_BIRTH_TIME')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
