import { get } from './api';
import { getUserPreferredLocale } from './translationService';
import { CONCEPT_DETAIL_URL } from '@constants/app';
import { ALLERGEN_TYPES } from '@constants/concepts';
import {
  AllergenConceptResponse,
  AllergenConcept,
  AllergenType,
} from '@/types/concepts';

interface RawAllergenConcepts {
  medication?: AllergenConceptResponse['setMembers'];
  food?: AllergenConceptResponse['setMembers'];
  environment?: AllergenConceptResponse['setMembers'];
}

/**
 * Extracts and formats allergen concepts from raw data
 * @param concepts - Raw concept data from API
 * @param type - Allergen type identifier
 * @returns Formatted allergen concepts
 */
const extractSetMembers = (
  concepts: AllergenConceptResponse['setMembers'],
  type: AllergenType,
): AllergenConcept[] => {
  return concepts
    .filter((concept) => !concept.retired)
    .map((concept) => ({
      ...concept,
      type,
    }));
};

/**
 * Formats raw allergen concepts into a unified array with type information
 * @param rawConcepts - Object containing allergen concepts grouped by type
 * @returns Array of formatted allergen concepts with type information
 */
export const formatAllergenConcepts = (
  rawConcepts: RawAllergenConcepts,
): AllergenConcept[] => [
  ...extractSetMembers(
    rawConcepts.medication || [],
    ALLERGEN_TYPES.MEDICATION.display,
  ),
  ...extractSetMembers(rawConcepts.food || [], ALLERGEN_TYPES.FOOD.display),
  ...extractSetMembers(
    rawConcepts.environment || [],
    ALLERGEN_TYPES.ENVIRONMENT.display,
  ),
];

/**
 * Fetches and formats allergen concepts from the server
 * @returns Promise resolving to an array of formatted allergen concepts
 */
export const fetchAndFormatAllergenConcepts = async (): Promise<
  AllergenConcept[]
> => {
  const locale = getUserPreferredLocale();

  const [medicationResponse, foodResponse, environmentResponse] =
    await Promise.all([
      get<AllergenConceptResponse>(
        CONCEPT_DETAIL_URL(ALLERGEN_TYPES.MEDICATION.code, locale),
      ),
      get<AllergenConceptResponse>(
        CONCEPT_DETAIL_URL(ALLERGEN_TYPES.FOOD.code, locale),
      ),
      get<AllergenConceptResponse>(
        CONCEPT_DETAIL_URL(ALLERGEN_TYPES.ENVIRONMENT.code, locale),
      ),
    ]);

  const rawConcepts: RawAllergenConcepts = {
    medication: medicationResponse?.setMembers || [],
    food: foodResponse?.setMembers || [],
    environment: environmentResponse?.setMembers || [],
  };

  return formatAllergenConcepts(rawConcepts);
};
