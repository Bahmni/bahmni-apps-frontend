import { ValueSet } from 'fhir/r4';
import {
  CONCEPT_SEARCH_URL,
  FHIR_VALUESET_FILTER_EXPAND_URL,
  FHIR_VALUESET_URL,
} from './constants';
import { ConceptSearch } from './models';
import { get } from '../api';
import { getUserPreferredLocale } from '../i18n/translationService';

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
