import { getUserPreferredLocale } from '../i18n/translationService';
import { OBSERVATION_FORMS_URL } from './constants';
import { ObservationForm, ApiNameTranslation, FormApiResponse } from './models';

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
