import { Button, Search } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  PatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback, useEffect } from 'react';
import styles from './styles/PatientSearch.module.scss';
import { usePatientSearch } from './usePatientSearch';

interface PatientSearchProps {
  onSearchResults: (results: PatientSearchResult[]) => void;
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
  const [cursorPosition, setCursorPosition] = useState<number>(0);
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
    if (hasPerformedSearch && !error) {
      onSearchResults(searchResults);
    }
  }, [searchResults, onSearchResults, hasPerformedSearch, error]);

  useEffect(() => {
    if (!loading && hasPerformedSearch) {
      setTimeout(() => {
        const inputElement = document.getElementById(
          'patient-search-input',
        ) as HTMLInputElement;

        if (inputElement && !inputElement.disabled) {
          inputElement.focus();
          inputElement.setSelectionRange(cursorPosition, cursorPosition);
        } else if (inputElement?.disabled) {
          setTimeout(() => {
            if (!inputElement.disabled) {
              inputElement.focus();
              inputElement.setSelectionRange(cursorPosition, cursorPosition);
            }
          }, 50);
        }
      }, 50);
    }
  }, [loading, hasPerformedSearch, cursorPosition]);

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
      setCursorPosition(event.target.selectionStart ?? 0);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setCursorPosition(event.currentTarget.selectionStart ?? 0);
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
