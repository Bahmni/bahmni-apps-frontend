import {
  BaseLayout,
  Header,
  Link,
  Loading,
  SkeletonText,
  SortableDataTable,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  PatientSearchResultBundle,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import { SearchPatient } from '@bahmni-frontend/bahmni-widgets';
import { useCallback, useEffect, useState } from 'react';
import styles from './styles/index.module.scss';
import { formatPatientSearchResult, PatientSearchViewModel } from './utils';

/**
 * PatientSearchPage
 * Registration Patient Search interface that let's the user search for a patient using keywords.
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  const [patientSearchData, setPatientSearchData] = useState<
    PatientSearchResultBundle | undefined
  >();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isPhoneSearch, setIsPhoneSearch] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCreateNewPatient = () => {
    navigate('/new');
  };

  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
    });
  }, []);

  const handleOnSearch = (
    data: PatientSearchResultBundle | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
    isPhoneSearch: boolean,
  ) => {
    setPatientSearchData(data ?? undefined);
    setSearchTerm(searchTerm);
    setIsLoading(isLoading);
    setIsError(isError);
    setIsPhoneSearch(isPhoneSearch);
  };

  const headers = [
    { key: 'identifier', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ID') },
    { key: 'name', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_NAME') },
    { key: 'gender', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_GENDER') },
    { key: 'age', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_AGE') },
    {
      key: 'phoneNumber',
      header: t('REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER'),
    },
    {
      key: 'alternatePhoneNumber',
      header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER'),
    },
  ];

  const renderTitle = (
    isLoading: boolean,
    isError: boolean,
    dataLength: number,
  ) => {
    if (isLoading) {
      return <SkeletonText testId="patient-search-title-loading" />;
    } else if (isError) {
      return (
        <span data-testid="patient-search-title-error">
          {t('ERROR_DEFAULT_TITLE')}
        </span>
      );
    } else {
      return (
        <span data-testid="patient-search-title">
          {t('REGISTRATION_PATIENT_SEARCH_TABLE_TITLE', {
            count: dataLength,
          })}
        </span>
      );
    }
  };

  const navigateToPatient = (patientUuid: string) => {
    setIsNavigating(true);
    window.location.href = `/bahmni/registration/index.html#/patient/${patientUuid}`;
  };

  const handleRowClick = (row: PatientSearchViewModel<PatientSearchResult>) => {
    if (row.uuid) {
      navigateToPatient(row.uuid);
    }
  };

  const renderCell = useCallback(
    (row: PatientSearchViewModel<PatientSearchResult>, cellId: string) => {
      if (cellId === 'identifier') {
        return (
          <Link
            href={`/bahmni/registration/index.html#/patient/${row.uuid}`}
            onClick={(e) => {
              e.preventDefault();
              navigateToPatient(row.uuid);
            }}
          >
            {row.identifier}
          </Link>
        );
      }
      const cellValue =
        row[cellId as keyof PatientSearchViewModel<PatientSearchResult>];
      if (cellValue instanceof Date) {
        return cellValue.toLocaleDateString();
      }
      return cellValue;
    },
    [navigateToPatient],
  );

  if (isNavigating) {
    return <Loading description={t('LOADING_PATIENT_DETAILS')} role="status" />;
  }

  return (
    <BaseLayout
      header={
        <div className={styles.customHeader}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumbSection}>
              <nav className={styles.breadcrumb}>
                <a href={BAHMNI_HOME_PATH} className={styles.breadcrumbLink}>
                  {t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_HOME')}
                </a>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>
                  Search patient
                </span>
              </nav>
            </div>
            <div className={styles.rightActions}>
              <Button
                kind="primary"
                size="sm"
                onClick={handleCreateNewPatient}
                testId="create-new-patient-button"
                className={styles.createPatientButton}
              >
                Create new patient
              </Button>
              <div className={styles.profileSection}>
                <div className={styles.userAvatar}></div>
                <span className={styles.profileText}>Hi, Profile name</span>
              </div>
            </div>
          </div>
        </div>
      }
      main={
        <div className={styles.main}>
          <SearchPatient
            buttonTitle={t('REGISTRATION_PATIENT_SEARCH_BUTTON_TITLE')}
            searchBarPlaceholder={t(
              'REGISTRATION_PATIENT_SEARCH_INPUT_PLACEHOLDER',
            )}
            onSearch={handleOnSearch}
          />
          {searchTerm !== '' && (
            <div className={styles.patientSearchResult}>
              <Tile
                id="patient-search-result"
                aria-label="patient-search-result"
                className={styles.resultsTitle}
              >
                {renderTitle(
                  isLoading,
                  isError,
                  patientSearchData?.totalCount ?? 0,
                )}
              </Tile>
              <SortableDataTable
                headers={headers}
                ariaLabel="patient-search-sortable-data-table"
                loading={isLoading}
                rows={formatPatientSearchResult(patientSearchData)}
                renderCell={renderCell}
                emptyStateMessage={
                  isPhoneSearch
                    ? t('REGISTRATION_PATIENT_SEARCH_PHONE_EMPTY_MESSAGE', {
                        searchTerm: searchTerm,
                      })
                    : t('REGISTRATION_PATIENT_SEARCH_EMPTY_MESSAGE', {
                        searchTerm: searchTerm,
                      })
                }
                className={styles.patientSearchTableBody}
                errorStateMessage={
                  isError
                    ? t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE')
                    : undefined
                }
                onRowClick={handleRowClick}
              />
            </div>
          )}
        </div>
      }
    />
  );
};

export default PatientSearchPage;
