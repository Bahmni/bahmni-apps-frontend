import {
  Button,
  TextInput,
  Dropdown,
  Checkbox,
  DatePicker,
  DatePickerInput,
  CheckboxGroup,
} from '@bahmni/design-system';
import {
  useTranslation,
  MAX_PATIENT_AGE_YEARS,
  PatientIdentifier,
} from '@bahmni/services';
import { useState, useImperativeHandle, useEffect } from 'react';
import type { BasicInfoData } from '../../../models/patient';
import type {
  BasicInfoErrors,
  ValidationErrors,
  AgeErrors,
  DateErrors,
} from '../../../models/validation';
import styles from '../../../pages/createPatientPage/styles/index.module.scss';
import {
  useGenderData,
  useIdentifierData,
} from '../../../utils/identifierGenderUtils';
import { createDateAgeHandlers, formatToDisplay } from './dateAgeUtils';
import { PatientPhotoUpload } from '../../PatientPhotoUpload/PatientPhotoUpload';

export interface ProfileRef {
  getData: () => BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
  };
  validate: () => boolean;
  clearData: () => void;
  setCustomError: (field: keyof BasicInfoData, message: string) => void;
}

interface ProfileProps {
  initialData?: BasicInfoData;
  initialDobEstimated?: boolean;
  ref?: React.Ref<ProfileRef>;
}

export const Profile = ({
  initialData,
  initialDobEstimated = false,
  ref,
}: ProfileProps) => {
  const { t } = useTranslation();

  // Use utility hooks for identifier and gender data
  const { identifierPrefixes, primaryIdentifierType, identifierSources } =
    useIdentifierData();
  const { genders } = useGenderData(t);

  // Component owns ALL its state
  const [formData, setFormData] = useState<BasicInfoData>({
    patientIdFormat:
      (initialData?.patientIdFormat ?? identifierPrefixes[0]) || '',
    entryType: initialData?.entryType ?? false,
    firstName: initialData?.firstName ?? '',
    middleName: initialData?.middleName ?? '',
    lastName: initialData?.lastName ?? '',
    gender: initialData?.gender ?? '',
    ageYears: initialData?.ageYears ?? '',
    ageMonths: initialData?.ageMonths ?? '',
    ageDays: initialData?.ageDays ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    birthTime: initialData?.birthTime ?? '',
  });

  const [dobEstimated, setDobEstimated] = useState(initialDobEstimated);

  // Component owns ALL its error states
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

  // Update patientIdFormat when identifierPrefixes loads
  useEffect(() => {
    if (identifierPrefixes.length > 0 && !formData.patientIdFormat) {
      setFormData((prev) => ({
        ...prev,
        patientIdFormat: identifierPrefixes[0],
      }));
    }
  }, [identifierPrefixes, formData.patientIdFormat]);

  // Internal input change handler
  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Real-time name validation (as user types)
  const handleNameChange = (field: string, value: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (nameRegex.test(value)) {
      handleInputChange(field, value);
      setNameErrors((prev) => ({ ...prev, [field]: '' }));
      setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    } else {
      setNameErrors((prev) => ({
        ...prev,
        [field]: t('CREATE_PATIENT_VALIDATION_NAME_INVALID'),
      }));
    }
  };

  // Date/Age handlers
  const { handleDateInputChange, handleDateOfBirthChange, handleAgeChange } =
    createDateAgeHandlers({
      setDateErrors,
      setValidationErrors,
      setAgeErrors,
      setFormData,
      setDobEstimated,
      t,
    });

  // VALIDATION METHOD - Called by parent on submit
  const validate = (): boolean => {
    let isValid = true;
    const newValidationErrors: ValidationErrors = {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
    };

    // Required field validations
    if (!formData.firstName.trim()) {
      newValidationErrors.firstName = t(
        'CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED',
      );
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newValidationErrors.lastName = t(
        'CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED',
      );
      isValid = false;
    }

    if (!formData.gender) {
      newValidationErrors.gender = t(
        'CREATE_PATIENT_VALIDATION_GENDER_REQUIRED',
      );
      isValid = false;
    }

    if (!formData.dateOfBirth) {
      newValidationErrors.dateOfBirth = t(
        'CREATE_PATIENT_VALIDATION_DATE_OF_BIRTH_REQUIRED',
      );
      isValid = false;
    }

    // Check if there are any existing errors (name format, age, date)
    const hasNameErrors = Object.values(nameErrors).some((err) => err !== '');
    const hasAgeErrors = Object.values(ageErrors).some((err) => err !== '');
    const hasDateErrors = Object.values(dateErrors).some((err) => err !== '');

    if (hasNameErrors || hasAgeErrors || hasDateErrors) {
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getData: () => {
      // Transform flat profile data into PatientIdentifier structure
      const patientIdentifier: PatientIdentifier = {
        ...(identifierSources && {
          identifierSourceUuid: identifierSources.get(formData.patientIdFormat),
        }),
        identifierPrefix: formData.patientIdFormat,
        identifierType: primaryIdentifierType ?? '',
        preferred: true,
        voided: false,
      };

      return {
        ...formData,
        dobEstimated,
        patientIdentifier,
      };
    },
    validate,
    clearData: () => {
      setFormData({
        patientIdFormat: identifierPrefixes[0] || '',
        entryType: false,
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        ageYears: '',
        ageMonths: '',
        ageDays: '',
        dateOfBirth: '',
        birthTime: '',
      });
      setDobEstimated(false);
      setNameErrors({ firstName: '', middleName: '', lastName: '' });
      setValidationErrors({
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
      });
      setAgeErrors({ ageYears: '', ageMonths: '', ageDays: '' });
      setDateErrors({ dateOfBirth: '' });
    },
    setCustomError: (field, message) => {
      setValidationErrors((prev) => ({ ...prev, [field]: message }));
    },
  }));

  return (
    <div className={styles.formSection}>
      <span className={styles.formSectionTitle}>
        {t('CREATE_PATIENT_SECTION_BASIC_INFO')}
      </span>
      <div className={styles.row}>
        <PatientPhotoUpload />

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
                  handleInputChange('patientIdFormat', selectedItem ?? '')
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
                      handleInputChange('entryType', e.target.checked)
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
                  handleInputChange('gender', selectedItem ?? '');
                  setValidationErrors((prev) => ({ ...prev, gender: '' }));
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
                    max={MAX_PATIENT_AGE_YEARS}
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
                  date.setFullYear(
                    date.getFullYear() - MAX_PATIENT_AGE_YEARS + 1,
                  );
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
                  onChange={() => setDobEstimated(!dobEstimated)}
                />
              </div>
            </CheckboxGroup>

            <div>
              <TextInput
                id="birth-time"
                type="time"
                required
                value={formData.birthTime}
                onChange={(e) => handleInputChange('birthTime', e.target.value)}
                labelText={t('CREATE_PATIENT_BIRTH_TIME')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Profile.displayName = 'Profile';

export default Profile;
