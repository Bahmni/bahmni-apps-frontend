import { ValueSet } from 'fhir/r4';
import { get } from '../api';
import { getUserPreferredLocale } from '../i18n/translationService';
import {
  CONCEPT_BY_FULLY_SPECIFIED_NAME_URL,
  CONCEPT_GET_URL,
  CONCEPT_SEARCH_URL,
  FHIR_VALUESET_FILTER_EXPAND_URL,
  FHIR_VALUESET_URL,
} from './constants';
import {
  ConceptData,
  ConceptSearch,
  type ConceptSearchByNameResponse,
} from './models';

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

/**
 * Fetches a FHIR ValueSet by UUID
 * @param uuid - The UUID of the ValueSet to fetch
 * @returns Promise resolving to a FHIR ValueSet
 */
export const searchFHIRConcepts = async (uuid: string): Promise<ValueSet> => {
  const url = FHIR_VALUESET_URL(uuid);
  return get<ValueSet>(url);
};

export const searchFHIRConceptsByName = async (
  name: string,
): Promise<ValueSet> => {
  const url = `${FHIR_VALUESET_FILTER_EXPAND_URL(name)}`;
  return get<ValueSet>(url);
};

export async function getConceptById(uuid: string): Promise<ConceptData> {
  return await get<ConceptData>(CONCEPT_GET_URL(uuid));
}

/**
 * Search for a concept by its fully specified name and return the full concept data
 * @param conceptName - The fully specified name of the concept
 * @returns Promise resolving to full ConceptData or null if not found
 */
export async function searchConceptByName(
  conceptName: string,
): Promise<ConceptData | null> {
  const url = CONCEPT_BY_FULLY_SPECIFIED_NAME_URL(conceptName);
  const response = await get<ConceptSearchByNameResponse>(url);

  if (!response.results || response.results.length === 0) {
    return null;
  }

  return response.results[0];
}
