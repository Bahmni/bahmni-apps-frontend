import { Button, Search } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback, useEffect } from 'react';
import styles from './styles/PatientSearch.module.scss';
import { usePatientSearch } from './usePatientSearch';

interface PatientSearchProps {
  onSearchResults: (results: FormattedPatientSearchResult[]) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  onSearchResults,
  onError,
  onLoading,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');
  const [hasPerformedSearch, setHasPerformedSearch] = useState<boolean>(false);
  const { searchResults, loading, error } = usePatientSearch(activeSearchTerm);

  useEffect(() => {
    onLoading(loading);
  }, [loading, onLoading]);

  React.useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  React.useEffect(() => {
    if (hasPerformedSearch) {
      onSearchResults(searchResults);
    }
  }, [searchResults, onSearchResults, hasPerformedSearch]);

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      return;
    }

    setHasPerformedSearch(true);
    setActiveSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
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
      <Search
        id="patient-search-input"
        testId="patient-search-input"
        labelText=""
        placeholder={t('PATIENT_SEARCH_PLACEHOLDER')}
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className={styles.searchInput}
        aria-label={t('PATIENT_SEARCH_PLACEHOLDER')}
      />
      <Button
        size="md"
        testId="patient-search-button"
        onClick={handleSearch}
        disabled={isSearchDisabled}
        className={styles.searchButton}
        aria-label={t('PATIENT_SEARCH_BUTTON')}
      >
        {t('PATIENT_SEARCH_BUTTON')}
      </Button>
    </div>
  );
};

export default PatientSearch;
