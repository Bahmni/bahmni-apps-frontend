import {
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
  MAX_NAME_LENGTH,
  PatientIdentifier,
} from '@bahmni/services';
import { useState, useImperativeHandle, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRegistrationConfig } from '../../../hooks/useRegistrationConfig';
import type { BasicInfoData } from '../../../models/patient';
import type {
  BasicInfoErrors,
  ValidationErrors,
  AgeErrors,
  DateErrors,
} from '../../../models/validation';
import styles from '../../../pages/PatientRegister/styles/index.module.scss';
import {
  useGenderData,
  useIdentifierData,
} from '../../../utils/identifierGenderUtils';
import { PatientPhotoUpload } from '../../patientPhotoUpload/PatientPhotoUpload';
import { createDateAgeHandlers, formatToDisplay } from './dateAgeUtils';

export interface ProfileRef {
  getData: () => BasicInfoData & {
    dobEstimated: boolean;
    patientIdentifier: PatientIdentifier;
    image?: string;
  };
  validate: () => boolean;
  clearData: () => void;
  setCustomError: (field: keyof BasicInfoData, message: string) => void;
}

interface ProfileProps {
  initialData?: BasicInfoData;
  initialDobEstimated?: boolean;
  patientIdentifier?: string | null;
  initialPhoto?: string | null | undefined;
  ref?: React.Ref<ProfileRef>;
}

export const Profile = ({
  initialData,
  initialDobEstimated = false,
  patientIdentifier,
  initialPhoto,
  ref,
}: ProfileProps) => {
  const { t } = useTranslation();
  // Use utility hooks for identifier and gender data
  const { identifierPrefixes, primaryIdentifierType, identifierSources } =
    useIdentifierData();
  const { genders } = useGenderData(t);

  // Get registration config for patient information settings
  const { registrationConfig } = useRegistrationConfig();
  const patientInfoConfig = registrationConfig?.patientInformation;
  const { patientUuid: patientUuidFromUrl } = useParams<{
    patientUuid: string;
  }>();

  // Extract field visibility and validation flags
  const showMiddleName = patientInfoConfig?.showMiddleName ?? false;
  const showLastName = patientInfoConfig?.showLastName ?? false;
  const isMiddleNameMandatory =
    patientInfoConfig?.isMiddleNameMandatory ?? false;
  const isLastNameMandatory = patientInfoConfig?.isLastNameMandatory ?? false;

  const getRequiredLabel = (labelKey: string, isRequired: boolean) => {
    return (
      <>
        {t(labelKey)}
        {isRequired && <span className={styles.requiredAsterisk}>*</span>}
      </>
    );
  };

  // Component owns ALL its state
  const [formData, setFormData] = useState<BasicInfoData>({
    patientIdFormat: '',
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
    nameUuid: '',
  });
  const [dobEstimated, setDobEstimated] = useState(false);
  const [patientImage, setPatientImage] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        patientIdFormat:
          initialData.patientIdFormat || identifierPrefixes[0] || '',
        entryType: initialData.entryType ?? false,
        firstName: initialData.firstName ?? '',
        middleName: initialData.middleName ?? '',
        lastName: initialData.lastName ?? '',
        gender: initialData.gender ?? '',
        ageYears: initialData.ageYears ?? '',
        ageMonths: initialData.ageMonths ?? '',
        ageDays: initialData.ageDays ?? '',
        dateOfBirth: initialData.dateOfBirth ?? '',
        birthTime: initialData.birthTime ?? '',
        nameUuid: initialData.nameUuid ?? '',
      });
    }
  }, [initialData, identifierPrefixes]);

  useEffect(() => {
    if (initialDobEstimated == true) {
      setDobEstimated(initialDobEstimated);
    }
  }, [initialDobEstimated]);

  // Component owns ALL its error states
  const [nameErrors, setNameErrors] = useState<BasicInfoErrors>({
    firstName: '',
    middleName: '',
    lastName: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '',
    dateOfBirth: '',
    birthTime: '',
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

  const fieldValidationConfig = registrationConfig?.fieldValidation;

  const handleNameChange = (field: string, value: string) => {
    const pattern = fieldValidationConfig?.[field]?.pattern ?? '^[a-zA-Z\\s]*$';
    const nameRegex = new RegExp(pattern);
    const errorMessage = fieldValidationConfig?.[field]?.errorMessage;

    // Always allow empty string (for backspace/delete)
    if (value === '' || nameRegex.test(value)) {
      // Valid input: update field
      handleInputChange(field, value);

      // Check for max length and show error if exceeded
      if (value.length > MAX_NAME_LENGTH) {
        const maxLengthKey = `CREATE_PATIENT_VALIDATION_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}_MAX_LENGTH`;
        setNameErrors((prev) => ({
          ...prev,
          [field]: t(maxLengthKey),
        }));
      } else {
        // Clear errors if within limit
        setNameErrors((prev) => ({ ...prev, [field]: '' }));
        setValidationErrors((prev) => ({ ...prev, [field]: '' }));
      }
    } else {
      // Invalid input: show pattern error (don't update the field value)
      setNameErrors((prev) => ({
        ...prev,
        [field]: errorMessage ? t(errorMessage) : '',
      }));
    }
  };

  const handleNameBlur = (field: string) => {
    setNameErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const isInputElementInvalid = (
    event?:
      | React.FocusEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement>,
  ): boolean => {
    const inputElement = event?.target as HTMLInputElement;
    return inputElement ? !inputElement.validity.valid : false;
  };

  const updateBirthTimeError = (errorMessage: string) => {
    setValidationErrors((prev) => ({
      ...prev,
      birthTime: errorMessage,
    }));
  };

  // Handler for birthTime changes with validation
  const handleBirthTimeChange = (
    value: string,
    event?:
      | React.FocusEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleInputChange('birthTime', value);
    const isBlurEvent = event?.type === 'blur';

    if (isBlurEvent) {
      if (value === '') {
        updateBirthTimeError('');
        return;
      }
    }

    const isHtml5Invalid = isInputElementInvalid(event);

    if (isHtml5Invalid) {
      updateBirthTimeError(t('CREATE_PATIENT_VALIDATION_BIRTH_TIME_INVALID'));
    } else {
      updateBirthTimeError('');
    }
  };

  const { handleDateInputChange, handleDateOfBirthChange, handleAgeChange } =
    createDateAgeHandlers({
      setDateErrors,
      setValidationErrors,
      setAgeErrors,
      setFormData,
      setDobEstimated,
      t,
    });

  // Handler to prevent invalid characters in age number inputs
  const handleAgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleAgePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    field: 'ageYears' | 'ageMonths' | 'ageDays',
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const sanitized = pastedText.replace(/[-+eE.]/g, '');

    if (sanitized && /^\d+$/.test(sanitized)) {
      handleAgeChange(field, sanitized);
    }
  };

  // VALIDATION METHOD - Called by parent on submit
  const validate = (): boolean => {
    let isValid = true;
    const newValidationErrors: ValidationErrors = {
      firstName: '',
      lastName: '',
      middleName: '',
      gender: '',
      dateOfBirth: '',
      birthTime: '',
    };

    // Validate firstName - check if required from patientInformation config
    const isFirstNameMandatory =
      patientInfoConfig?.isFirstNameMandatory ?? true;
    if (isFirstNameMandatory && !formData.firstName.trim()) {
      newValidationErrors.firstName = t(
        'CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED',
      );
      isValid = false;
    } else if (formData.firstName.length > MAX_NAME_LENGTH) {
      newValidationErrors.firstName = t(
        'CREATE_PATIENT_VALIDATION_FIRST_NAME_MAX_LENGTH',
      );
      isValid = false;
    }

    if (
      showMiddleName &&
      isMiddleNameMandatory &&
      !formData.middleName.trim()
    ) {
      newValidationErrors.middleName = t(
        'CREATE_PATIENT_VALIDATION_MIDDLE_NAME_REQUIRED',
      );
      isValid = false;
    } else if (showMiddleName && formData.middleName.length > MAX_NAME_LENGTH) {
      newValidationErrors.middleName = t(
        'CREATE_PATIENT_VALIDATION_MIDDLE_NAME_MAX_LENGTH',
      );
      isValid = false;
    }

    if (showLastName && isLastNameMandatory && !formData.lastName.trim()) {
      newValidationErrors.lastName = t(
        'CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED',
      );
      isValid = false;
    } else if (showLastName && formData.lastName.length > MAX_NAME_LENGTH) {
      newValidationErrors.lastName = t(
        'CREATE_PATIENT_VALIDATION_LAST_NAME_MAX_LENGTH',
      );
      isValid = false;
    }

    const isGenderMandatory = patientInfoConfig?.isGenderMandatory ?? true;
    if (isGenderMandatory && !formData.gender) {
      newValidationErrors.gender = t(
        'CREATE_PATIENT_VALIDATION_GENDER_REQUIRED',
      );
      isValid = false;
    }

    const isDateOfBirthMandatory =
      patientInfoConfig?.isDateOfBirthMandatory ?? true;
    if (isDateOfBirthMandatory && !formData.dateOfBirth) {
      newValidationErrors.dateOfBirth = t(
        'CREATE_PATIENT_VALIDATION_DATE_OF_BIRTH_REQUIRED',
      );
      isValid = false;
    }
    if (patientInfoConfig?.showBirthTime) {
      const birthTimeElement = document.getElementById(
        'birth-time',
      ) as HTMLInputElement;
      const isBirthTimeInvalid =
        birthTimeElement && !birthTimeElement.validity.valid;

      if (isBirthTimeInvalid) {
        newValidationErrors.birthTime = t(
          'CREATE_PATIENT_VALIDATION_BIRTH_TIME_INVALID',
        );
        isValid = false;
      }
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
        ...(patientImage && { image: patientImage }),
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
        nameUuid: '',
      });
      setDobEstimated(false);
      setPatientImage('');
      setNameErrors({ firstName: '', middleName: '', lastName: '' });
      setValidationErrors({
        firstName: '',
        lastName: '',
        middleName: '',
        gender: '',
        dateOfBirth: '',
        birthTime: '',
      });
      setAgeErrors({ ageYears: '', ageMonths: '', ageDays: '' });
      setDateErrors({ dateOfBirth: '' });
    },
    setCustomError: (field, message) => {
      setValidationErrors((prev) => ({ ...prev, [field]: message }));
    },
  }));

  return (
    <div className={styles.formSection} data-testid="profile-section">
      <span
        className={styles.formSectionTitle}
        data-testid="profile-section-title"
      >
        {patientIdentifier ? (
          <span
            className={styles.patientUuid}
            data-testid="profile-patient-identifier"
          >
            {patientIdentifier}
          </span>
        ) : (
          t('CREATE_PATIENT_SECTION_BASIC_INFO')
        )}
      </span>
      <div className={styles.row} data-testid="profile-main-row">
        <PatientPhotoUpload
          onPhotoConfirm={setPatientImage}
          initialPhoto={initialPhoto ?? undefined}
        />

        <div className={styles.col}>
          <div className={styles.row}>
            {!patientUuidFromUrl && (
              <div
                className={styles.dropdownField}
                data-testid="patient-id-format-field"
              >
                <Dropdown
                  id="patient-id-format"
                  data-testid="patient-id-format-dropdown"
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
            )}
            {(patientInfoConfig?.showEnterManually ?? false) && (
              <div className={styles.col} data-testid="entry-type-field">
                <CheckboxGroup
                  legendText={t('CREATE_PATIENT_ENTRY_TYPE')}
                  data-testid="entry-type-checkbox-group"
                >
                  <div className={styles.checkboxField}>
                    <Checkbox
                      labelText={t('CREATE_PATIENT_ENTER_MANUALLY')}
                      id="entry-type"
                      data-testid="entry-type-checkbox"
                      checked={formData.entryType}
                      onChange={(e) =>
                        handleInputChange('entryType', e.target.checked)
                      }
                    />
                  </div>
                </CheckboxGroup>
              </div>
            )}
          </div>

          <div
            className={`${styles.row} ${styles.nameFields}`}
            data-testid="profile-name-fields-row"
          >
            <TextInput
              id="first-name"
              data-testid="first-name-input"
              labelText={getRequiredLabel(
                'CREATE_PATIENT_FIRST_NAME',
                patientInfoConfig?.isFirstNameMandatory ?? true,
              )}
              placeholder={t('CREATE_PATIENT_FIRST_NAME')}
              value={formData.firstName}
              invalid={!!nameErrors.firstName || !!validationErrors.firstName}
              invalidText={nameErrors.firstName || validationErrors.firstName}
              onChange={(e) => handleNameChange('firstName', e.target.value)}
              onBlur={() => handleNameBlur('firstName')}
            />

            {showMiddleName && (
              <TextInput
                id="middle-name"
                data-testid="middle-name-input"
                labelText={getRequiredLabel(
                  'CREATE_PATIENT_MIDDLE_NAME',
                  isMiddleNameMandatory,
                )}
                placeholder={t('CREATE_PATIENT_MIDDLE_NAME_PLACEHOLDER')}
                value={formData.middleName}
                invalid={
                  !!nameErrors.middleName || !!validationErrors.middleName
                }
                invalidText={
                  nameErrors.middleName || validationErrors.middleName
                }
                onChange={(e) => handleNameChange('middleName', e.target.value)}
                onBlur={() => handleNameBlur('middleName')}
              />
            )}

            {showLastName && (
              <TextInput
                id="last-name"
                data-testid="last-name-input"
                labelText={getRequiredLabel(
                  'CREATE_PATIENT_LAST_NAME',
                  isLastNameMandatory,
                )}
                placeholder={t('CREATE_PATIENT_LAST_NAME')}
                value={formData.lastName}
                invalid={!!nameErrors.lastName || !!validationErrors.lastName}
                invalidText={nameErrors.lastName || validationErrors.lastName}
                onChange={(e) => handleNameChange('lastName', e.target.value)}
                onBlur={() => handleNameBlur('lastName')}
              />
            )}
          </div>

          <div
            className={`${styles.row} ${styles.demographicsFields}`}
            data-testid="profile-demographics-row"
          >
            <div className={styles.dropdownField} data-testid="gender-field">
              <Dropdown
                id="gender"
                data-testid="gender-dropdown"
                titleText={getRequiredLabel(
                  'CREATE_PATIENT_GENDER',
                  patientInfoConfig?.isGenderMandatory ?? true,
                )}
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

            <div className={styles.col} data-testid="age-fields-container">
              <div
                className={styles.ageFieldsWrapper}
                data-testid="age-fields-wrapper"
              >
                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-years"
                    data-testid="age-years-input"
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
                    onKeyDown={handleAgeKeyDown}
                    onPaste={(e) => handleAgePaste(e, 'ageYears')}
                  />
                </div>

                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-months"
                    data-testid="age-months-input"
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
                    onKeyDown={handleAgeKeyDown}
                    onPaste={(e) => handleAgePaste(e, 'ageMonths')}
                  />
                </div>

                <div className={styles.ageInputs}>
                  <TextInput
                    id="age-days"
                    data-testid="age-days-input"
                    labelText={t('CREATE_PATIENT_AGE_DAYS')}
                    type="number"
                    min={0}
                    max={31}
                    value={formData.ageDays}
                    invalid={!!ageErrors.ageDays}
                    invalidText={ageErrors.ageDays}
                    onChange={(e) => handleAgeChange('ageDays', e.target.value)}
                    onKeyDown={handleAgeKeyDown}
                    onPaste={(e) => handleAgePaste(e, 'ageDays')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`${styles.row} ${styles.birthInfoFields}`}
            data-testid="profile-birth-info-row"
          >
            <div data-testid="date-of-birth-field">
              <DatePicker
                dateFormat="d/m/Y"
                datePickerType="single"
                data-testid="date-of-birth-picker"
                minDate={(() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - MAX_PATIENT_AGE_YEARS);
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
                  data-testid="date-of-birth-input"
                  placeholder={t('CREATE_PATIENT_DATE_OF_BIRTH_PLACEHOLDER')}
                  labelText={getRequiredLabel(
                    'CREATE_PATIENT_DATE_OF_BIRTH',
                    patientInfoConfig?.isDateOfBirthMandatory ?? true,
                  )}
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

            <CheckboxGroup
              legendText={t('CREATE_PATIENT_ACCURACY')}
              data-testid="accuracy-checkbox-group"
            >
              <div className={styles.checkboxField}>
                <Checkbox
                  labelText={t('CREATE_PATIENT_ESTIMATED')}
                  id="accuracy"
                  data-testid="accuracy-checkbox"
                  checked={dobEstimated}
                  onChange={() => setDobEstimated(!dobEstimated)}
                />
              </div>
            </CheckboxGroup>

            {(patientInfoConfig?.showBirthTime ?? false) && (
              <div data-testid="birth-time-field">
                <TextInput
                  id="birth-time"
                  data-testid="birth-time-input"
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => handleBirthTimeChange(e.target.value, e)}
                  onBlur={(e) => handleBirthTimeChange(e.target.value, e)}
                  invalid={!!validationErrors.birthTime}
                  invalidText={validationErrors.birthTime}
                  labelText={t('CREATE_PATIENT_BIRTH_TIME')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Profile.displayName = 'Profile';

export default Profile;
