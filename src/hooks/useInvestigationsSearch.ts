import { useEffect, useState, useMemo } from 'react';
import useDebounce from './useDebounce';
import { FlattenedInvestigations } from '@types/investigations';
import { getFlattenedInvestigations } from '@services/investigationService';
import { getFormattedError } from '@utils/common';

interface UseInvestigationsSearchResult {
  investigations: FlattenedInvestigations[];
  isLoading: boolean;
  error: Error | null;
}

const useInvestigationsSearch = (
  searchTerm: string = '',
): UseInvestigationsSearchResult => {
  const [investigations, setInvestigations] = useState<
    FlattenedInvestigations[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedInvestigations = await getFlattenedInvestigations();
        setInvestigations(fetchedInvestigations);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(new Error(formattedError.message));
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestigations();
  }, []);

  const filteredInvestigations = useMemo(() => {
    if (!investigations.length) return [];

    const searchTermLower = debouncedSearchTerm?.toLowerCase().trim() || '';
    if (!searchTermLower) return investigations;

    const searchWords = searchTermLower.split(/\s+/);

    const exactMatch = investigations.find(
      (investigation) =>
        investigation.display.toLowerCase() === searchTermLower,
    );
    if (exactMatch) return [exactMatch];

    return investigations.filter((investigation) => {
      const displayLower = investigation.display.toLowerCase();
      return searchWords.some((word) => displayLower.includes(word));
    });
  }, [investigations, debouncedSearchTerm]);

  return {
    investigations: filteredInvestigations,
    isLoading,
    error,
  };
};

export default useInvestigationsSearch;
