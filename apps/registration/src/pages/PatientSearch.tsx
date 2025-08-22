import {
  PageHeader,
  SortableDataTable,
  Tile,
  type BreadcrumbItem,
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

  // Breadcrumb navigation
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      id: 'home',
      label: t('HOME'),
      href: '/',
    },
    {
      id: 'registration',
      label: t('REGISTRATION'),
      isCurrentPage: true,
    },
  ];

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
    [],
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

    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <p>{t('PATIENT_SEARCH_LOADING')}</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className={styles.noResultsContainer}>
          <p className={styles.noResultsText}>
            {t('PATIENT_SEARCH_NO_RESULTS')}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.resultsContainer}>
        <Tile className={styles.resultsHeader}>
          {t('PATIENT_SEARCH_RESULTS')} ({searchResults.length})
        </Tile>
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
      <PageHeader
        breadcrumbItems={breadcrumbItems}
        testId="patient-search-page-header"
      />

      <div className={styles.mainContent}>
        <div className={styles.searchSection}>
          <PatientSearchWidget
            onSearchResults={handleSearchResults}
            onError={handleSearchError}
            onLoading={handleSearchLoading}
          />
        </div>

        {renderSearchResults()}
      </div>
    </div>
  );
};

export default PatientSearch;
