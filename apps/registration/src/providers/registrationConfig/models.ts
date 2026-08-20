import { Extension } from '@bahmni/services';
import type { PrintOption } from '@bahmni/widgets';

export interface PatientPhotoConfig {
  widthPx?: number;
  heightPx?: number;
  minWidthPx?: number;
  maxWidthPx?: number;
  minHeightPx?: number;
  maxHeightPx?: number;
  maxFileSizeKb?: number;
}

export interface PatientInformationConfig {
  defaultIdentifierPrefix?: string;
  autoCompleteFields?: string[];
  showMiddleName?: boolean;
  showLastName?: boolean;
  isFirstNameMandatory?: boolean;
  isMiddleNameMandatory?: boolean;
  isLastNameMandatory?: boolean;
  isGenderMandatory?: boolean;
  isDateOfBirthMandatory?: boolean;
  patientNameDisplayOrder?: string[];
  showBirthTime?: boolean;
  showCasteSameAsLastNameCheckbox?: boolean;
  showDOBEstimated?: boolean;
  showEnterManually?: boolean;
  contactInformation?: {
    translationKey?: string;
    attributes?: Array<{
      field: string;
      translationKey: string;
    }>;
  };
  additionalPatientInformation?: {
    translationKey?: string;
    attributes?: Array<{
      field: string;
      translationKey: string;
    }>;
  };
  hiddenAttributes?: string[];
  defaults?: Record<string, unknown>;
  addressHierarchy?: {
    showAddressFieldsTopDown?: boolean;
    strictAutocompleteFromLevel?: string;
    requiredFields?: string[];
    expectedFields?: Array<{
      addressField: string;
      translationKey: string;
    }>;
  };
  patientPhoto?: PatientPhotoConfig;
}

export interface FieldValidationRule {
  pattern: string;
  errorMessage: string;
}

export interface FieldValidationConfig {
  [fieldName: string]: FieldValidationRule;
}

export interface RegistrationFormControl {
  type: string;
  titleTranslationKey?: string;
}

export interface RegistrationFormSection {
  name: string;
  translationKey?: string;
  collapsible?: boolean;
  controls: RegistrationFormControl[];
}

export interface RegistrationFormConfig {
  sections: RegistrationFormSection[];
}

export interface RegistrationConfig {
  defaultVisitType?: string;
  registrationEncounterType?: string;
  patientInformation?: PatientInformationConfig;
  fieldValidation?: FieldValidationConfig;
  registrationForm?: RegistrationFormConfig;
  printOptions?: PrintOption[];
  extensions?: Extension[];
}

export interface RegistrationConfigContextType {
  registrationConfig: RegistrationConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
