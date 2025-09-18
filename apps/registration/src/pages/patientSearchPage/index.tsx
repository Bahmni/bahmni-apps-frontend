import {
  BaseLayout,
  Header,
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
} from '@bahmni-frontend/bahmni-services';
import { SearchPatient } from '@bahmni-frontend/bahmni-widgets';
import { useEffect, useState } from 'react';
import styles from './styles/index.module.scss';
import { formatPatientSearchResult } from './utils';

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
  const { t } = useTranslation();

  const breadcrumbItems = [
    {
      id: 'home',
      label: t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'current',
      label: t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_CURRENT'),
      isCurrentPage: true,
    },
  ];

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
  ) => {
    setPatientSearchData(data ?? undefined);
    setSearchTerm(searchTerm);
    setIsLoading(isLoading);
    setIsError(isError);
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
        <p className={styles.title} data-testid="patient-search-title-error">
          {t('ERROR_DEFAULT_TITLE')}
        </p>
      );
    } else {
      return (
        <p className={styles.title} data-testid="patient-search-title">
          {t('REGISTRATION_PATIENT_SEARCH_TABLE_TITLE', {
            count: dataLength,
          })}
        </p>
      );
    }
  };

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbItems={breadcrumbItems}
          ariaLabel="registration-search-page-header"
        />
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
            <Tile
              id="patient-search-result"
              aria-label="patient-search-result"
              className={styles.patientSearchResult}
            >
              {renderTitle(
                isLoading,
                isError,
                patientSearchData?.totalCount ?? 0,
              )}
              <SortableDataTable
                headers={headers}
                ariaLabel="patient-search-sortable-data-table"
                loading={isLoading}
                rows={formatPatientSearchResult(patientSearchData)}
                emptyStateMessage={t(
                  'REGISTRATION_PATIENT_SEARCH_EMPTY_MESSAGE',
                  {
                    searchTerm: searchTerm,
                  },
                )}
                className={styles.patientSearchTableBody}
                errorStateMessage={
                  isError
                    ? t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE')
                    : undefined
                }
              />
            </Tile>
          )}
        </div>
      }
    />
  );
};

export default PatientSearchPage;
