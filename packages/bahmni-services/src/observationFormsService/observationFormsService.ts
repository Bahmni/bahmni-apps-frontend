import { getUserPreferredLocale } from '../i18n/translationService';
import { OBSERVATION_FORMS_URL, FORM_METADATA_URL } from './constants';
import {
  ObservationForm,
  ApiNameTranslation,
  FormApiResponse,
  FormMetadata,
  FormMetadataApiResponse,
} from './models';

/**
 * Fetches and normalizes raw observation forms data from the API
 */
const fetchAndNormalizeFormsData = async (): Promise<FormApiResponse[]> => {
  const response = await fetch(OBSERVATION_FORMS_URL);

  if (!response.ok) {
    throw new Error(
      `HTTP error! status for latestPublishedForms: ${response.status}`,
    );
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
};

/**
 * Gets translated name for a form based on current locale
 */
const getTranslatedFormName = (
  form: FormApiResponse,
  currentLocale: string,
): string => {
  const translations = JSON.parse(form.nameTranslation);

  if (Array.isArray(translations) && translations.length > 0) {
    const translation = translations.find(
      (translation: ApiNameTranslation) => translation.locale === currentLocale,
    );

    if (translation?.display) {
      return translation.display;
    }
  }

  return form.name;
};

/**
 * Transforms API form data to application domain model
 */
const transformToObservationForm = (
  form: FormApiResponse,
  currentLocale: string,
): ObservationForm => {
  const translatedName = getTranslatedFormName(form, currentLocale);

  return {
    uuid: form.uuid,
    name: translatedName,
    id: form.id,
    privileges: form.privileges.map((p) => ({
      privilegeName: p.privilegeName,
      editable: p.editable,
    })),
  };
};

/**
 * Function to fetch and process observation forms
 */
export const fetchObservationForms = async (): Promise<ObservationForm[]> => {
  const formsArray = await fetchAndNormalizeFormsData();
  const currentLocale = getUserPreferredLocale();

  return formsArray.map((form) =>
    transformToObservationForm(form, currentLocale),
  );
};

/**
 * Fetches form metadata including the form schema/definition
 * @param formUuid - The UUID of the form to fetch
 * @returns Promise resolving to parsed form metadata
 */
export const fetchFormMetadata = async (
  formUuid: string,
): Promise<FormMetadata> => {
  const response = await fetch(FORM_METADATA_URL(formUuid));

  if (!response.ok) {
    throw new Error(
      `Failed to fetch form metadata for ${formUuid}: ${response.status}`,
    );
  }

  const data: FormMetadataApiResponse = await response.json();

  if (!data.resources || data.resources.length === 0) {
    throw new Error(`No resources found for form ${formUuid}`);
  }

  const formSchema = JSON.parse(data.resources[0].value);

  return {
    uuid: data.uuid,
    name: data.name,
    version: data.version,
    published: data.published,
    schema: formSchema,
  };
};
