export interface ObservationForm {
  uuid: string;
  name: string;
  version: string;
  published: boolean;
  id: number;
  resources: unknown;
  privileges: unknown[];
  nameTranslation: string;
  formName?: string;
  formUuid?: string;
}
