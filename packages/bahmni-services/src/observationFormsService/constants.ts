import { OPENMRS_REST_V1 } from '../constants/app';

export const FORM_METADATA_URL = (formUuid: string) =>
  OPENMRS_REST_V1 + `/form/${formUuid}?v=custom:(resources:(value))`;
export const OBSERVATION_FORMS_URL =
  OPENMRS_REST_V1 + '/bahmniie/form/latestPublishedForms';
export const USER_PINNED_PREFERENCE_URL = (userUuid: string) =>
  OPENMRS_REST_V1 + `/user/${userUuid}?v=full`;
export const FORM_TRANSLATIONS_URL = (
  formName: string,
  formUuid: string,
  formVersion: string,
  locale: string,
) =>
  OPENMRS_REST_V1 +
  `/bahmniie/form/translations?formName=${encodeURIComponent(formName)}&formUuid=${formUuid}&formVersion=${formVersion}&locale=${locale}`;

export const DEFAULT_FORM_NAMESPACE = 'Bahmni';
