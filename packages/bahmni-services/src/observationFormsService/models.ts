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
