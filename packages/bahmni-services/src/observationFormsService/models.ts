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
