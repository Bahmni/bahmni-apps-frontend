import { normalizeTranslationKey } from '@bahmni/services';
import { TFunction } from 'i18next';

export const getTranslatedLabel = (
  t: TFunction,
  module: string,
  fieldName: string,
): string => {
  const translationKey = normalizeTranslationKey(module, fieldName);
  const translation = t(translationKey);

  return translation === translationKey ? fieldName : translation;
};
