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
import type { PatientFormData } from '../models/patientForm';
import type {
  NameErrors,
  ValidationErrors,
  AgeErrors,
  DateErrors,
} from '../models/validation';
import styles from '../pages/createPatientPage/styles/index.module.scss';
import { formatToDisplay } from '../utils/ageUtils';

interface BasicInformationSectionProps {
  formData: PatientFormData;
  identifierPrefixes: string[];
  genders: string[];
  nameErrors: NameErrors;
  validationErrors: ValidationErrors;
  ageErrors: AgeErrors;
  dateErrors: DateErrors;
  dobEstimated: boolean;
  onInputChange: (
    field: keyof PatientFormData,
    value: string | boolean,
  ) => void;
  onNameChange: (
    field: 'firstName' | 'middleName' | 'lastName',
    value: string,
  ) => void;
  onAgeChange: (
    field: 'ageYears' | 'ageMonths' | 'ageDays',
    value: string,
  ) => void;
  onDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateOfBirthChange: (dates: Date[]) => void;
  onDobEstimatedChange: (estimated: boolean) => void;
  onGenderChange: (gender: string) => void;
}

export const BasicInformationSection = ({
  formData,
  identifierPrefixes,
  genders,
  nameErrors,
  validationErrors,
  ageErrors,
  dateErrors,
  dobEstimated,
  onInputChange,
  onNameChange,
  onAgeChange,
  onDateInputChange,
  onDateOfBirthChange,
  onDobEstimatedChange,
  onGenderChange,
}: BasicInformationSectionProps) => {
  const { t } = useTranslation();

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
              onChange={(e) => onNameChange('firstName', e.target.value)}
            />

            <TextInput
              id="middle-name"
              labelText={t('CREATE_PATIENT_MIDDLE_NAME')}
              placeholder={t('CREATE_PATIENT_MIDDLE_NAME_PLACEHOLDER')}
              value={formData.middleName}
              invalid={!!nameErrors.middleName}
              invalidText={nameErrors.middleName}
              onChange={(e) => onNameChange('middleName', e.target.value)}
            />

            <TextInput
              id="last-name"
              labelText={t('CREATE_PATIENT_LAST_NAME')}
              placeholder={t('CREATE_PATIENT_LAST_NAME_PLACEHOLDER')}
              required
              value={formData.lastName}
              invalid={!!nameErrors.lastName || !!validationErrors.lastName}
              invalidText={nameErrors.lastName || validationErrors.lastName}
              onChange={(e) => onNameChange('lastName', e.target.value)}
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
                onChange={({ selectedItem }) =>
                  onGenderChange(selectedItem ?? '')
                }
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
                    max={120}
                    value={formData.ageYears}
                    invalid={!!ageErrors.ageYears}
                    invalidText={ageErrors.ageYears}
                    onChange={(e) => onAgeChange('ageYears', e.target.value)}
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
                    onChange={(e) => onAgeChange('ageMonths', e.target.value)}
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
                    onChange={(e) => onAgeChange('ageDays', e.target.value)}
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
                  date.setFullYear(date.getFullYear() - 121);
                  date.setHours(0, 0, 0, 0);
                  return date;
                })()}
                maxDate={new Date()}
                value={
                  formData.dateOfBirth
                    ? formatToDisplay(formData.dateOfBirth)
                    : ''
                }
                onChange={onDateOfBirthChange}
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
                  onInput={onDateInputChange}
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
