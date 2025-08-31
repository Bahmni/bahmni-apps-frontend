import { Button, Search, Dropdown } from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import React, { useState, useCallback, useEffect } from 'react';
import styles from './styles/PatientSearch.module.scss';
import { usePatientSearch } from './usePatientSearch';
import { usePhoneNumberSearch } from './usePhoneNumberSearch';

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
  const [phoneSearchTerm, setPhoneSearchTerm] = useState<string>('');
  const [hasPerformedPhoneSearch, setHasPerformedPhoneSearch] = useState<boolean>(false);
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

    // Dropdown options
  const searchTypeOptions = [
    {
      id: 'phoneNumber',
      text: t('PHONE_NUMBER'),
    }
  ];

  const getDefaultSearchType = () => {
  const defaultType = Object.values(searchTypeOptions).find(type => type.id);
  return defaultType?.id || 'phoneNumber';
};

  const [selectedSearchType, setSelectedSearchType] = useState<string>(getDefaultSearchType());
  
  const { searchResults: phoneResults, loading: phoneLoading, error: phoneError, search: performPhoneSearch } = usePhoneNumberSearch('', selectedSearchType);
    useEffect(() => {
    onLoading(phoneLoading);
  }, [phoneLoading, onLoading]);

  React.useEffect(() => {
    if (phoneError) {
      onError(phoneError);
    }
  }, [phoneError, onError]);
  React.useEffect(() => {
    if (hasPerformedPhoneSearch && !phoneError) {
      onSearchResults(phoneResults);
    }
  }, [phoneResults, onSearchResults, hasPerformedPhoneSearch, phoneError]);

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

  const handlePhoneSearch = useCallback(() => {
    if (!phoneSearchTerm.trim()) {
      return;
    }

    setHasPerformedPhoneSearch(true);
    setHasPerformedSearch(false);
    // Call search function directly - this will work even with same search term
    performPhoneSearch(phoneSearchTerm, selectedSearchType);
  }, [phoneSearchTerm, selectedSearchType, performPhoneSearch]);

  const handlePhoneInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPhoneSearchTerm(event.target.value);
    },
    [],
  );

  const handlePhoneKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handlePhoneSearch();
      }
    },
    [handlePhoneSearch],
  );

  const isSearchDisabled = !searchTerm.trim() || loading;
  const isPhoneSearchDisabled = !phoneSearchTerm.trim() || phoneLoading;

  return (
    <div
      className={styles.patientSearchContainer}
      data-testid="patient-search-widget"
    >
      {/* General Search Section */}
      <div className={styles.searchSection}>
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

      {/* OR Divider */}
      <div className={styles.orDivider}>
        <span className={styles.orText}>{t('OR') || 'OR'}</span>
      </div>

      {/* Phone Search Section */}
      <div className={styles.searchSection}>
        <Search
          id="phone-search-input"
          testId="phone-search-input"
          labelText=""
          placeholder={t('SEARCH_BY_PHONE_NUMBER')}
          value={phoneSearchTerm}
          onChange={handlePhoneInputChange}
          onKeyDown={handlePhoneKeyDown}
          disabled={loading}
          className={styles.searchInput}
          aria-label={t('SEARCH_BY_PHONE_NUMBER')}
        />
        <Dropdown
          id="search-type-dropdown"
          testId="search-type-dropdown"
          titleText=""
          label="Phone number"
          items={searchTypeOptions}
          selectedItem={searchTypeOptions.find(item => item.id === selectedSearchType)}
          onChange={({ selectedItem }: { selectedItem: any }) => {
            if (selectedItem) {
              setSelectedSearchType(selectedItem.id);
            }
          }}
          className={styles.searchTypeDropdown}
          disabled={loading}
          size="md"
          itemToString={(item: any) => item ? item.text : ''}
        />
        <Button
          size="md"
          testId="phone-search-button"
          onClick={handlePhoneSearch}
          disabled={isPhoneSearchDisabled}
          className={styles.searchButton}
          aria-label={t('PATIENT_SEARCH_BUTTON')}
        >
          {t('PATIENT_SEARCH_BUTTON')}
        </Button>
      </div>
    </div>
  );
};

export default PatientSearch;
