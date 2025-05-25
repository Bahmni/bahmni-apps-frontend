import { get } from './api';
import { ConceptSearch } from '@types/concepts';
import { getUserPreferredLocale } from './translationService';
import { CONCEPT_SEARCH_URL } from '@constants/app';

/**
 * Search for concepts matching the provided term
 * @param term - The search term to find matching concepts
 * @param limit - Maximum number of results to return (default: 20)
 * @returns Promise resolving to an array of ConceptSearch objects
 */
export const searchConcepts = async (
  term: string,
  limit = 20,
): Promise<ConceptSearch[]> => {
  const locale = getUserPreferredLocale();
  const url = CONCEPT_SEARCH_URL(term, limit, locale);
  return get<ConceptSearch[]>(url);
};
