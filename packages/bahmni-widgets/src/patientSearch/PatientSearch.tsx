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

export const PatientSearch: React.FC<PatientSearchProps> = ({
  onSearchResults,
  onError,
  onLoading,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hasPerformedSearch, setHasPerformedSearch] = useState<boolean>(false);
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
    if (hasPerformedSearch) {
      onSearchResults(searchResults);
    }
  }, [searchResults, onSearchResults, hasPerformedSearch]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      setHasPerformedSearch(true);
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

  const isSearchDisabled = !searchTerm.trim() || loading;

  return (
    <div
      className={styles.patientSearchContainer}
      data-testid="patient-search-widget"
    >
      <TextInput
        id="patient-search-input"
        testId="patient-search-input"
        labelText=""
        placeholder={t('PATIENT_SEARCH_PLACEHOLDER')}
        value={searchTerm}
        onChange={handleInputChange}
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
