import { AppointmentSearchField, PatientSearchField } from '@bahmni/services';

export interface PatientSearchConfig {
  customAttributes: PatientSearchField[];
  appointment: AppointmentSearchField[];
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
}

export interface FieldValidationRule {
  pattern: string;
  errorMessage: string;
}

export interface FieldValidationConfig {
  [fieldName: string]: FieldValidationRule;
}

export interface AppExtensionConfig {
  id: string;
  extensionPointId: string;
  type: 'link' | 'startVisit';
  translationKey: string;
  url: string;
  shortcutKey?: string;
  icon?: string;
  order?: number;
  kind?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  requiredPrivilege?: string;
}

export interface ExtensionPoint {
  id: string;
  description?: string;
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
  patientSearch: PatientSearchConfig;
  defaultVisitType?: string;
  patientInformation?: PatientInformationConfig;
  fieldValidation?: FieldValidationConfig;
  registrationForm?: RegistrationFormConfig;
  extensionPoints?: ExtensionPoint[];
  registrationAppExtensions?: AppExtensionConfig[];
}

export interface RegistrationConfigContextType {
  registrationConfig: RegistrationConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
