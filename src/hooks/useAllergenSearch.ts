import { useEffect, useState, useMemo } from 'react';
import useDebounce from './useDebounce';
import { fetchAndFormatAllergenConcepts } from '@services/allergenService';
import { AllergenConcept } from '@types/concepts';
import { getFormattedError } from '@utils/common';

interface UseAllergenSearchResult {
  allergens: AllergenConcept[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook that provides debounced search functionality for allergen concepts.
 * It eagerly loads all allergen concepts and filters them based on the search term.
 * @param searchTerm - Optional search term to filter allergens
 * @returns Object containing filtered allergens, loading state, and any errors
 */
const useAllergenSearch = (
  searchTerm: string = '',
): UseAllergenSearchResult => {
  const [allergens, setAllergens] = useState<AllergenConcept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm);

  // Load all allergens on mount
  useEffect(() => {
    const loadAllergens = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const concepts = await fetchAndFormatAllergenConcepts();
        setAllergens(concepts);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(new Error(formattedError.message));
      } finally {
        setIsLoading(false);
      }
    };
    loadAllergens();
  }, []);

  // Filter allergens based on search term
  const filteredAllergens = useMemo(() => {
    if (!allergens.length) return [];

    const searchTermLower = debouncedSearchTerm?.toLowerCase().trim() || '';
    if (!searchTermLower) return allergens;

    return allergens.filter((allergen) => {
      const displayLower = allergen.display.trim().toLowerCase();
      return allergen && displayLower.includes(searchTermLower);
    });
  }, [allergens, debouncedSearchTerm]);

  return {
    allergens: filteredAllergens,
    isLoading,
    error,
  };
};

export default useAllergenSearch;
