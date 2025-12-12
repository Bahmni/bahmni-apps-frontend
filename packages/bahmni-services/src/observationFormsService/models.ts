export interface FormPrivilege {
  privilegeName: string;
  editable: boolean;
}

// Domain model (what we use for application logic)
export interface ObservationForm {
  uuid: string;
  name: string;
  id: number;
  privileges: FormPrivilege[];
}

// API response interfaces (what comes from the backend)
export interface ApiFormPrivilege {
  privilegeName: string;
  editable: boolean;
}

export interface ApiNameTranslation {
  display: string;
  locale: string;
}

export interface FormApiResponse {
  uuid: string;
  name: string;
  id: number;
  privileges: ApiFormPrivilege[];
  nameTranslation: string;
}

// Response structure from the form metadata API
export interface FormResource {
  uuid: string;
  value: string; // JSON string containing the form schema
}

export interface FormMetadataApiResponse {
  uuid: string;
  name: string;
  version: string;
  published: boolean;
  resources: FormResource[];
}

//Parsed form metadata structure
export interface FormMetadata {
  uuid: string;
  name: string;
  version: string;
  published: boolean;
  schema: unknown; // The parsed form schema/definition
}

// Observation data from form2-controls (used in consultation bundle)
export interface ObservationDataInFormControls {
  concept: { uuid: string };
  value: string | number | boolean | ConceptValue;
  obsDatetime?: string;
  groupMembers?: ObservationDataInFormControls[];
  comment?: string;
  interpretation?: ConceptValue; // Interpretation/abnormality flag
  formFieldPath?: string; // Track which form field this came from
}

// Concept value for coded answers
export interface ConceptValue {
  uuid: string;
  display?: string;
}

// Consultation bundle structure (simplified - shows observation forms integration)
export interface ConsultationBundle {
  patientUuid: string;
  encounterTypeUuid: string;
  visitUuid?: string;
  providers?: Array<{ uuid: string }>;
  observations: ObservationDataInFormControls[]; // Observation forms data goes here
  diagnoses?: DiagnosisPayload[];
  orders?: OrderPayload[];
  // ... other consultation data
}

// Supporting interfaces for consultation bundle
export interface DiagnosisPayload {
  diagnosis: { uuid: string };
  certainty: string;
  order: string;
}

export interface OrderPayload {
  concept: { uuid: string };
  orderType: string;
  action: string;
  // ... other order fields
}
