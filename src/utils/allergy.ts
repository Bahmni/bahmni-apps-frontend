import { FormattedAllergy } from '@types/allergy';
import { AllergenType } from '@types/concepts';
import { getPriorityByOrder } from './common';

/**
 * Priority order for allergy severity levels (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting allergies by medical severity: severe → moderate → mild
 */
export const SEVERITY_PRIORITY_ORDER = ['severe', 'moderate', 'mild'];

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

/**
 * Maps allergy severity to numeric priority for sorting
 * Uses generic getPriorityByOrder function with SEVERITY_PRIORITY_ORDER
 * @param severity - The severity level of the allergy
 * @returns Numeric priority (lower = higher priority)
 */
export const getSeverityPriority = (severity: string): number => {
  return getPriorityByOrder(severity, SEVERITY_PRIORITY_ORDER);
};

/**
 * Sorts allergies by severity priority: severe → moderate → mild
 * Maintains stable sorting (preserves original order for same severity)
 * @param allergies - Array of formatted allergies to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortAllergiesBySeverity = (
  allergies: FormattedAllergy[],
): FormattedAllergy[] => {
  return [...allergies].sort((a, b) => {
    return getSeverityPriority(a.severity!) - getSeverityPriority(b.severity!);
  });
};
