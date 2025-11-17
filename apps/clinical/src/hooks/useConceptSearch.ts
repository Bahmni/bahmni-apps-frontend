import { searchConcepts, type ConceptSearch } from '@bahmni/services';
import { useState, useEffect } from 'react';
import useDebounce from './useDebounce';

/**
 * Result type for the concept search hook
 */
interface ConceptSearchResult {
  searchResults: ConceptSearch[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for searching diagnosis concepts with debounced input
 * Implements typeahead search
 *
 * @param searchTerm - The search query for finding diagnosis concepts
 * @param limit - Maximum number of results to return (default: 20)
 * @param debounceDelay - Delay in milliseconds before triggering search (default: 500)
 * @returns ConceptSearchResult object containing searchResults array, loading state, and error
 */
export const useConceptSearch = (
  searchTerm: string,
  limit = 20,
  debounceDelay = 500,
): ConceptSearchResult => {
  const [searchResults, setSearchResults] = useState<ConceptSearch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  // Fetch concepts when debounced search term changes
  useEffect(() => {
    // Reset search results if search term is empty
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      setSearchResults([]);
      setError(null);
      return;
    }

    const fetchConcepts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchConcepts(debouncedSearchTerm, limit);
        setSearchResults(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? new Error(err.message)
            : new Error('Failed to fetch concepts for search'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
  }, [debouncedSearchTerm, limit]);

  return { searchResults, loading, error };
};
