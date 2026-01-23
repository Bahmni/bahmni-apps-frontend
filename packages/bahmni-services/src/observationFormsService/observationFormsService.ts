import { get } from '../api/api';
import {
  getUserPreferredLocale,
  extractObservationFormTranslations,
  type ObservationFormTranslations,
} from '../i18n';
import {
  OBSERVATION_FORMS_URL,
  FORM_METADATA_URL,
  FORM_TRANSLATIONS_URL,
  FORM_DATA_URL,
} from './constants';

import {
  ObservationForm,
  ApiNameTranslation,
  FormApiResponse,
  FormMetadata,
  FormMetadataApiResponse,
  FormResponseData,
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
 * Fetches form metadata including the form schema/definition and translations
 * @param formUuid - The UUID of the form to fetch
 * @returns Promise resolving to parsed form metadata with translations for current locale
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
  const currentLocale = getUserPreferredLocale();

  // Fetch translations from API endpoint if translationsUrl is present
  let translations: ObservationFormTranslations = { labels: {}, concepts: {} };

  if (
    formSchema &&
    typeof formSchema === 'object' &&
    'translationsUrl' in formSchema &&
    typeof formSchema.translationsUrl === 'string'
  ) {
    try {
      const formName = formSchema.name ?? data.name;
      const formUuid = data.uuid ?? formSchema.uuid;
      const formVersion = formSchema.version ?? data.version ?? '1';

      const translationsUrl = FORM_TRANSLATIONS_URL(
        formName,
        formUuid,
        formVersion,
        currentLocale,
      );

      const translationsResponse = await fetch(translationsUrl);
      if (translationsResponse.ok) {
        const translationsData = await translationsResponse.json();
        translations = extractObservationFormTranslations(
          translationsData,
          currentLocale,
        );
      }
    } catch (error) {
      // Silently fail with empty translations
    }
  }

  return {
    uuid: data.uuid,
    name: data.name,
    version: data.version,
    published: data.published,
    schema: formSchema,
    translations,
  };
};

/**
 * Fetches patient form data for a given patient
 * @param patientUuid - The UUID of the patient
 * @param numberOfVisits - Optional number of visits to fetch form data for
 * @returns Promise resolving to an array of form response data
 * @throws Error if the patient UUID is invalid or the request fails
 */
export const getPatientFormData = async (
  patientUuid: string,
  episodeUuids?: string[],
  numberOfVisits?: number,
): Promise<FormResponseData[]> => {
  let episodeUuidString: string | undefined;

  if (episodeUuids && episodeUuids.length > 0) {
    episodeUuidString = episodeUuids.join(',');
  }

  const url = FORM_DATA_URL(patientUuid, numberOfVisits, episodeUuidString);
  const data = await get<FormResponseData[]>(url);

  return Array.isArray(data) ? data : [];
};
