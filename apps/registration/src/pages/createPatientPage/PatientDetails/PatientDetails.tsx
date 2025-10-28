import { Tile } from '@bahmni-frontend/bahmni-design-system';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import type { AddressHierarchyEntry } from '@bahmni-frontend/bahmni-services';
import type { AddressErrors } from '../../../models/address';
import type { PatientFormData } from '../../../models/patientForm';
import type {
  NameErrors,
  ValidationErrors,
  AgeErrors,
  DateErrors,
} from '../../../models/validation';
import { AdditionalInformationSection } from '../../../sections/AdditionalInformationSection';
import { AddressInformationSection } from '../../../sections/AddressInformationSection';
import { BasicInformationSection } from '../../../sections/BasicInformationSection';
import { ContactInformationSection } from '../../../sections/ContactInformationSection';
import { FormActions } from '../../../sections/FormActions';
import styles from './styles/index.module.scss';

interface PatientDetailsProps {
  // Form data
  formData: PatientFormData;
  identifierPrefixes: string[];
  genders: string[];

  // Error states
  nameErrors: NameErrors;
  validationErrors: ValidationErrors;
  ageErrors: AgeErrors;
  dateErrors: DateErrors;
  addressErrors: AddressErrors;

  // DOB states
  dobEstimated: boolean;

  // Address hierarchy states
  suggestions: {
    district: AddressHierarchyEntry[];
    state: AddressHierarchyEntry[];
    pincode: AddressHierarchyEntry[];
  };
  showSuggestions: {
    district: boolean;
    state: boolean;
    pincode: boolean;
  };

  // Mutation state
  isSaving: boolean;

  // Handlers
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
  onAddressInputChange: (
    field: 'district' | 'state' | 'pincode',
    value: string,
    addressField: string,
  ) => void;
  onSuggestionSelect: (
    field: 'district' | 'state' | 'pincode',
    entry: AddressHierarchyEntry,
  ) => void;
  onSuggestionBlur: (field: 'district' | 'state' | 'pincode') => void;
  onSuggestionFocus: (field: 'district' | 'state' | 'pincode') => void;
  onPhoneChange: (
    field: 'phoneNumber' | 'altPhoneNumber',
    value: string,
  ) => void;
  onSave: () => void;
}

export const PatientDetails = ({
  formData,
  identifierPrefixes,
  genders,
  nameErrors,
  validationErrors,
  ageErrors,
  dateErrors,
  addressErrors,
  dobEstimated,
  suggestions,
  showSuggestions,
  isSaving,
  onInputChange,
  onNameChange,
  onAgeChange,
  onDateInputChange,
  onDateOfBirthChange,
  onDobEstimatedChange,
  onGenderChange,
  onAddressInputChange,
  onSuggestionSelect,
  onSuggestionBlur,
  onSuggestionFocus,
  onPhoneChange,
  onSave,
}: PatientDetailsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Tile className={styles.patientDetailsHeader}>
        <span className={styles.sectionTitle}>
          {t('CREATE_PATIENT_HEADER_TITLE')}
        </span>
      </Tile>

      <div className={styles.formContainer}>
        <BasicInformationSection
          formData={formData}
          identifierPrefixes={identifierPrefixes}
          genders={genders}
          nameErrors={nameErrors}
          validationErrors={validationErrors}
          ageErrors={ageErrors}
          dateErrors={dateErrors}
          dobEstimated={dobEstimated}
          onInputChange={
            onInputChange as (
              field: keyof PatientFormData,
              value: string | boolean,
            ) => void
          }
          onNameChange={onNameChange}
          onAgeChange={onAgeChange}
          onDateInputChange={onDateInputChange}
          onDateOfBirthChange={onDateOfBirthChange}
          onDobEstimatedChange={onDobEstimatedChange}
          onGenderChange={onGenderChange}
        />

        <AddressInformationSection
          formData={formData}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          addressErrors={addressErrors}
          onInputChange={
            onInputChange as (
              field: keyof PatientFormData,
              value: string,
            ) => void
          }
          onAddressInputChange={onAddressInputChange}
          onSuggestionSelect={onSuggestionSelect}
          onSuggestionBlur={onSuggestionBlur}
          onSuggestionFocus={onSuggestionFocus}
        />

        <ContactInformationSection
          formData={formData}
          onPhoneChange={onPhoneChange}
        />

        <AdditionalInformationSection
          formData={formData}
          onInputChange={
            onInputChange as (
              field: keyof PatientFormData,
              value: string,
            ) => void
          }
        />
      </div>

      <FormActions onSave={onSave} isSaving={isSaving} />
    </>
  );
};
