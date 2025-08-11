import { AllergenType } from '../models/allergy';

/**
 * Maps allergy types to their corresponding i18n translation keys
 * @param type - The type of allergen
 * @returns The i18n translation key for the allergen type
 */
export const getCategoryDisplayName = (
  type: AllergenType | string | undefined | null,
): string => {
  if (type === undefined) return 'undefined';
  if (type === null) return 'null';

  const typeToI18nKey: Record<AllergenType, string> = {
    food: 'ALLERGY_TYPE_FOOD',
    medication: 'ALLERGY_TYPE_DRUG',
    environment: 'ALLERGY_TYPE_ENVIRONMENT',
  };
  return typeToI18nKey[type as AllergenType] || type;
};
