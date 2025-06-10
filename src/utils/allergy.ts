import { AllergenType } from '@types/concepts';

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

/**
 * Maps allergy severity to i18n translation key
 * @param severity - The severity level of the allergy
 * @returns The i18n translation key for the severity
 */
export const getSeverityDisplayName = (severity: string): string => {
  switch (severity?.toLowerCase()) {
    case 'mild':
      return 'SEVERITY_MILD';
    case 'moderate':
      return 'SEVERITY_MODERATE';
    case 'severe':
      return 'SEVERITY_SEVERE';
    default:
      return 'SEVERITY_MILD'; // fallback
  }
};
