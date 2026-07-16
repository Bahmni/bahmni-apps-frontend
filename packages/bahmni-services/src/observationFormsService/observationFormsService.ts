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
  FORM_SEARCH_URL,
} from './constants';

import {
  ObservationForm,
  ApiNameTranslation,
  FormApiResponse,
  FormMetadata,
  FormMetadataApiResponse,
  FormResponseData,
} from './models';

const fetchAndNormalizeFormsData = async (
  episodeUuids?: string[],
): Promise<FormApiResponse[]> => {
  let episodeUuidString: string | undefined;

  if (episodeUuids && episodeUuids.length > 0) {
    episodeUuidString = episodeUuids.join(',');
  }

  const response = await fetch(OBSERVATION_FORMS_URL(episodeUuidString));

  if (!response.ok) {
    throw new Error(
      `HTTP error! status for latestPublishedForms: ${response.status}`,
    );
  }

  const data = await response.json();

  return Array.isArray(data) ? data : [];
};

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

export const fetchObservationForms = async (
  episodeUuids?: string[],
): Promise<ObservationForm[]> => {
  const formsArray = await fetchAndNormalizeFormsData(episodeUuids);
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

  const formName = data.name ?? formSchema.name;
  const formUuidValue = data.uuid ?? formSchema.uuid;
  const formVersion = data.version ?? formSchema.version ?? '1';
  const formPublished = data.published ?? false;

  let translations: ObservationFormTranslations = { labels: {}, concepts: {} };

  if (
    formSchema &&
    typeof formSchema === 'object' &&
    'translationsUrl' in formSchema &&
    typeof formSchema.translationsUrl === 'string'
  ) {
    const translationsUrl = FORM_TRANSLATIONS_URL(
      formName,
      formUuidValue,
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
  }

  return {
    uuid: formUuidValue,
    name: formName,
    version: formVersion,
    published: formPublished,
    schema: formSchema,
    translations,
  };
};

/**
 * Finds the UUID of the form version that was active when an encounter was saved.
 *
 * Two strategies are tried in order:
 *
 * 1. Version-string match: if `formVersion` is provided and > 1, it was extracted
 *    from the formFieldPath which (after the FORM_METADATA_URL fix) encodes the
 *    correct OpenMRS form record version.  An exact version match is unambiguous.
 *    This handles all encounters saved after the FORM_METADATA_URL fix.
 *
 * 2. Date-based match: falls back to finding the most recently published form
 *    whose `auditInfo.dateCreated` ≤ `encounterDateTime`.
 *    `encounterDateTime` (the encounter's clinical date, in ms epoch) is used
 *    instead of `Observation.issued` because `issued` is updated on every
 *    re-edit (amended), making it unreliable as a save-time proxy.
 *    `encounterDateTime` is stable — it does not change when observations are
 *    subsequently edited.
 *
 * @param formName - The form name to search for
 * @param formVersion - The form version number from FormResponseData (may be 1
 *   for old encounters whose formFieldPath encoded version "1" before the fix)
 * @param encounterDateTime - Epoch milliseconds of the encounter's clinical date
 * @returns Promise resolving to the form UUID, or null if not determinable
 */
export const fetchFormUuidByObservationDate = async (
  formName: string,
  formVersion: number | undefined,
  encounterDateTime: number | undefined,
): Promise<string | null> => {
  const response = await fetch(FORM_SEARCH_URL(formName));
  if (!response.ok) return null;

  const data = await response.json();
  const forms: {
    uuid: string;
    name: string;
    version?: string | number;
    published: boolean;
    auditInfo?: { dateCreated?: string };
  }[] = Array.isArray(data.results) ? data.results : [];

  const published = forms.filter(
    (f) => f.name.toLowerCase() === formName.toLowerCase() && f.published,
  );

  if (published.length === 0) return null;

  // Strategy 1: exact version-string match.
  // formVersion > 1 means the formFieldPath correctly encoded the OpenMRS version
  // (encounters saved after the FORM_METADATA_URL fix). Version "1" is ambiguous
  // (all old forms share it) so it is excluded from this path.
  if (formVersion && formVersion > 1) {
    const versionMatch = published.find(
      (f) => String(f.version) === String(formVersion),
    );
    if (versionMatch) return versionMatch.uuid;
  }

  // Strategy 2: date-based match using the encounter's clinical date.
  const formsWithDate = published.filter((f) => !!f.auditInfo?.dateCreated);
  if (formsWithDate.length === 0) return null;

  // Sort oldest → newest
  formsWithDate.sort(
    (a, b) =>
      new Date(a.auditInfo!.dateCreated!).getTime() -
      new Date(b.auditInfo!.dateCreated!).getTime(),
  );

  if (!encounterDateTime) return formsWithDate[0].uuid;

  const candidates = formsWithDate.filter(
    (f) => new Date(f.auditInfo!.dateCreated!).getTime() <= encounterDateTime,
  );

  if (candidates.length === 0) return formsWithDate[0].uuid;

  return candidates[candidates.length - 1].uuid;
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
