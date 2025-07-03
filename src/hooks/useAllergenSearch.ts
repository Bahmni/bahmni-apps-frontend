import { useEffect, useState, useMemo } from 'react';
import useDebounce from './useDebounce';
import {
  fetchAndFormatAllergenConcepts,
  fetchReactionConcepts,
} from '@services/allergyService';
import { AllergenConcept } from '@types/concepts';
import { getFormattedError } from '@utils/common';
import { Coding } from 'fhir/r4';
import { useClinicalConfig } from './useClinicalConfig';
import { useTranslation } from 'react-i18next';

interface UseAllergenSearchResult {
  allergens: AllergenConcept[];
  reactions: Coding[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook that provides debounced search functionality for allergen concepts.
 * It eagerly loads all allergen concepts and filters them based on the search term.
 *
 * @param searchTerm - Optional search term to filter allergens
 * @returns Object containing filtered allergens, loading state, and any errors
 */
const useAllergenSearch = (serchTerm: string = ''): UseAllergenSearchResult => {
  const [allergens, setAllergens] = useState<AllergenConcept[]>([]);
  const [reactions, setReactions] = useState<Coding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(serchTerm);

  const {
    clinicalConfig,
    isLoading: isConfigLoading,
    error: configError,
  } = useClinicalConfig();
  const { t } = useTranslation();

  // Load all allergens when config is available
  useEffect(() => {
    const loadAllergens = async () => {
      setIsLoading(true);
      setError(null);

      if (configError) {
        setError(configError);
        setIsLoading(false);
        return;
      }

      // Wait for config to load
      if (isConfigLoading) {
        return;
      }

      // Check if config is available
      if (!clinicalConfig) {
        setError(new Error(t('ERROR_CLINICAL_CONFIG_NOT_FOUND')));
        setIsLoading(false);
        return;
      }

      // Check if consultationPad is available
      if (!clinicalConfig.consultationPad) {
        setError(new Error(t('ERROR_CONSULTATION_PAD_NOT_FOUND')));
        setIsLoading(false);
        return;
      }

      // Check if allergyConceptMap is available
      if (!clinicalConfig.consultationPad.allergyConceptMap) {
        setError(new Error(t('ERROR_ALLERGY_CONCEPT_MAP_NOT_FOUND')));
        setIsLoading(false);
        return;
      }

      const {
        medicationAllergenUuid,
        foodAllergenUuid,
        environmentalAllergenUuid,
        allergyReactionUuid,
      } = clinicalConfig.consultationPad.allergyConceptMap;

      try {
        const allergens = await fetchAndFormatAllergenConcepts(
          medicationAllergenUuid,
          foodAllergenUuid,
          environmentalAllergenUuid,
        );
        setAllergens(allergens);
        const reactions = await fetchReactionConcepts(allergyReactionUuid);
        setReactions(reactions);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(new Error(formattedError.message));
      } finally {
        setIsLoading(false);
      }
    };
    loadAllergens();
  }, [clinicalConfig, isConfigLoading, configError, t]);

  // Filter allergens based on search term
  const filteredAllergens = useMemo(() => {
    if (!allergens.length) return [];

    const searchTermLower = debouncedSearchTerm?.toLowerCase().trim() || '';
    if (!searchTermLower) return allergens;

    // Split search term into words for more flexible matching
    const searchWords = searchTermLower.split(/\s+/);

    return allergens.filter((allergen) => {
      const displayLower = allergen.display.toLowerCase();
      // Match if any search word is found anywhere in the display name
      return searchWords.some((word) => displayLower.includes(word));
    });
  }, [allergens, debouncedSearchTerm]);

  return {
    allergens: filteredAllergens,
    reactions,
    isLoading,
    error,
  };
};

export default useAllergenSearch;
