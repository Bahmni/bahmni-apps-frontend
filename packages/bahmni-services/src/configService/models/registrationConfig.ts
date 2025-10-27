export interface ExpectedFieldConfig {
  field: string;
  type?: 'string' | 'date' | 'numeric';
  translationKey: string;
}
export interface SearchActionConfig {
  translationKey: string;
  type: 'navigate' | 'changeStatus';
  enabledEule?: Array<{
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

export interface RegistrationConfig {
  patientSearch: PatientSearchConfig;
  defaultVisitType?: string;
}
