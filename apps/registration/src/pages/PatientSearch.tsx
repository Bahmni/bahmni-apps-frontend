import {
  SkeletonText,
  SortableDataTable,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import {
  PatientSearch as PatientSearchWidget,
  useNotification,
} from '@bahmni-frontend/bahmni-widgets';
import React, { useState, useCallback, useMemo } from 'react';
import styles from './styles/PatientSearch.module.scss';

/**
 * PatientSearch page component
 * Provides patient search functionality with results display
 */
const PatientSearch: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [searchResults, setSearchResults] = useState<
    FormattedPatientSearchResult[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const tableHeaders = useMemo(
    () => [
      { key: 'patientId', header: t('PATIENT_ID') },
      { key: 'fullName', header: t('PATIENT_NAME') },
      { key: 'phoneNumber', header: t('PHONE_NUMBER') },
      { key: 'alternatePhoneNumber', header: t('ALTERNATE_PHONE_NUMBER') },
      { key: 'gender', header: t('GENDER') },
      { key: 'age', header: t('AGE') },
      { key: 'registrationDate', header: t('REGISTRATION_DATE') },
    ],
    [t],
  );

  const handleSearchResults = useCallback(
    (results: FormattedPatientSearchResult[]) => {
      setSearchResults(results);
      setHasSearched(true);
    },
    [],
  );

  const handleSearchError = useCallback(
    (error: string) => {
      addNotification({
        type: 'error',
        title: t('ERROR_SEARCHING_PATIENTS'),
        message: error,
      });
      setSearchResults([]);
      setHasSearched(true);
    },
    [addNotification, t],
  );

  const handleSearchLoading = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const renderSearchResults = () => {
    if (!hasSearched) {
      return null;
    }

    return (
      <div className={styles.resultsContainer}>
        {loading ? (
          <SkeletonText heading />
        ) : (
          <Tile className={styles.resultsHeader}>
            {t('PATIENT_SEARCH_RESULTS')} ({searchResults.length})
          </Tile>
        )}
        <SortableDataTable
          headers={tableHeaders}
          rows={searchResults}
          ariaLabel={t('PATIENT_SEARCH_RESULTS_TABLE')}
          emptyStateMessage={t('PATIENT_SEARCH_NO_RESULTS')}
          loading={loading}
        />
      </div>
    );
  };

  return (
    <div className={styles.patientSearchPage}>
      <div className={styles.searchSection}>
        <PatientSearchWidget
          onSearchResults={handleSearchResults}
          onError={handleSearchError}
          onLoading={handleSearchLoading}
        />
      </div>

      {renderSearchResults()}
    </div>
  );
};

export default PatientSearch;
