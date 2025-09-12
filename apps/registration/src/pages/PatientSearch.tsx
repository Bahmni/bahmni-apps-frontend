import {
  SkeletonText,
  SortableDataTable,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  PatientSearchResult,
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
} from '@bahmni-frontend/bahmni-services';
import {
  PatientSearch as PatientSearchWidget,
  useNotification,
} from '@bahmni-frontend/bahmni-widgets';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styles from './styles/PatientSearch.module.scss';

/**
 * PatientSearch page component
 * Provides patient search functionality with results display
 */
const PatientSearch: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [searchResults, setSearchResults] = useState<
    PatientSearchResult[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
    });
  }, []);

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
    (results: PatientSearchResult[]) => {
      setSearchResults(results);
      setHasSearched(true);
      setError(false);
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.REGISTRATION_PATIENT_SEARCHED
          .eventType as AuditEventType,
      });
    },
    [],
  );

  const handleSearchError = useCallback(
    (errorMessage: string) => {
      setError(true);
      addNotification({
        type: 'error',
        title: t('ERROR_SEARCHING_PATIENTS'),
        message: errorMessage,
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
    if (!hasSearched || error) {
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
          className={styles.patientSearchResultsTable}
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
