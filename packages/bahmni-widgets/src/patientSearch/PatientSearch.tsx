import { Button, TextInput } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback } from 'react';
import styles from './styles/PatientSearch.module.scss';
import { usePatientSearch } from './usePatientSearch';

interface PatientSearchProps {
  onSearchResults: (results: FormattedPatientSearchResult[]) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

/**
 * PatientSearch widget component
 * Provides a search input field and search button for finding patients by ID or name
 */
export const PatientSearch: React.FC<PatientSearchProps> = ({
  onSearchResults,
  onError,
  onLoading,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { searchResults, searchPatients, loading, error } = usePatientSearch();

  // Notify parent component of state changes
  React.useEffect(() => {
    onLoading(loading);
  }, [loading, onLoading]);

  React.useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    onSearchResults(searchResults);
  }, [searchResults, onSearchResults]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      await searchPatients(searchTerm);
    } catch (err) {
      // Error handling is managed by the custom hook
    }
  }, [searchTerm, searchPatients]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    [],
  );

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const isSearchDisabled = !searchTerm.trim() || loading;

  return (
    <div
      className={styles.patientSearchContainer}
      data-testid="patient-search-widget"
    >
      <div className={styles.searchInputContainer}>
        <TextInput
          id="patient-search-input"
          testId="patient-search-input"
          labelText=""
          placeholder={t('PATIENT_SEARCH_PLACEHOLDER')}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={loading}
          className={styles.searchInput}
          aria-label={t('PATIENT_SEARCH_PLACEHOLDER')}
        />
        <Button
          testId="patient-search-button"
          onClick={handleSearch}
          disabled={isSearchDisabled}
          className={styles.searchButton}
          aria-label={t('PATIENT_SEARCH_BUTTON')}
        >
          {loading ? t('PATIENT_SEARCH_LOADING') : t('PATIENT_SEARCH_BUTTON')}
        </Button>
      </div>
    </div>
  );
};

export default PatientSearch;
