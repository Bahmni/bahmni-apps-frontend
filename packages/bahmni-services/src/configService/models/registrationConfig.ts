export interface ExpectedFieldConfig {
  field: string;
  type?: 'string' | 'date' | 'numeric';
  translationKey: string;
}
export interface SearchActionConfig {
  translationKey: string;
  type: 'navigate' | 'changeStatus';
  enabledRule?: Array<{
    type: 'privilegeCheck' | 'statusCheck' | 'appDateCheck';
    values: string[];
  }>;
  onAction: {
    navigation?: string;
    status?: string;
  };
  onSuccess?: {
    notification: string;
  };
}
export interface PatientSearchField {
  translationKey: string;
  fields: string[];
  actions?: SearchActionConfig[];
  columnTranslationKeys: string[];
  expectedFields?: ExpectedFieldConfig[];
  type: 'person' | 'address' | 'program' | 'appointment';
}

export interface AppointmentSearchField extends PatientSearchField {
  actions: SearchActionConfig[];
}

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
  additionalPatientInformation?: {
    translationKey?: string;
    expectedFields?: Array<{
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
  isExtraPatientIdentifiersSection?: boolean;
}

export interface FieldValidationRule {
  pattern: string;
  errorMessage: string;
  required?: boolean;
}

export interface FieldValidationConfig {
  [fieldName: string]: FieldValidationRule;
}

export interface RegistrationConfig {
  patientSearch: PatientSearchConfig;
  defaultVisitType?: string;
  patientInformation?: PatientInformationConfig;
  fieldValidation?: FieldValidationConfig;
}
