import { useEffect, useState, useMemo } from 'react';
import { useTranslation, getFormattedError } from '@bahmni-frontend/bahmni-services';
import { FlattenedInvestigations } from '../types/investigations';
import useDebounce from './useDebounce';

interface UseInvestigationsSearchResult {
  investigations: FlattenedInvestigations[];
  isLoading: boolean;
  error: Error | null;
}

const useInvestigationsSearch = (
  searchTerm: string = '',
): UseInvestigationsSearchResult => {
  const { t } = useTranslation();
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
        // TODO: Replace with actual investigation service call
        // const fetchedInvestigations = await getFlattenedInvestigations();
        // For now, return empty array until service is implemented
        const fetchedInvestigations: FlattenedInvestigations[] = [];
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
    const panelSuffix = ` (${t('INVESTIGATION_PANEL')})`.toLowerCase();

    const exactMatch = investigations.find(
      (investigation) =>
        investigation.display.toLowerCase() === searchTermLower ||
        investigation.display.toLowerCase() ===
          `${searchTermLower}${panelSuffix}`,
    );
    if (exactMatch) return [exactMatch];

    return investigations.filter((investigation) => {
      const displayLower = investigation.display.toLowerCase();
      return searchWords.some((word: string) => displayLower.includes(word));
    });
  }, [investigations, debouncedSearchTerm, t]);

  return {
    investigations: filteredInvestigations,
    isLoading,
    error,
  };
};

export { useInvestigationsSearch };
export default useInvestigationsSearch;