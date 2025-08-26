import {
  BaseLayout,
  Header,
  SkeletonText,
  SortableDataTable,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  PatientSearch,
  useTranslation,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni-frontend/bahmni-services';
import {
  SearchPatient,
  useNotification,
} from '@bahmni-frontend/bahmni-widgets';
import { useEffect, useState } from 'react';
import styles from './styles/PatientSearchPage.module.scss';

type PatientSearchViewModel<T> = T & {
  id: string;
  name: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
};

/**
 * PatientSearchPage
 * Registration Patient Search interface that let's the user search for a patient using keywords.
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  const [patientSearchData, setPatientSearchData] = useState<
    PatientSearch[] | undefined
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const breadcrumbItems = [
    {
      id: 'home',
      label: t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'current',
      label: t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_REGISTRATION'),
      isCurrentPage: true,
    },
  ];

  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
    });
  }, []);

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE'),
        type: 'error',
      });
  }, [isError]);

  const handleSearchPatientUpdate = (
    data: PatientSearch[] | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
  ) => {
    setPatientSearchData(data ?? []);
    setSearchTerm(searchTerm);
    setIsLoading(isLoading);
    setIsError(isError);
  };

  const patientSearchResult: PatientSearchViewModel<PatientSearch>[] =
    patientSearchData!.map((item, index) => ({
      ...item,
      id: index.toString(),
      name: [item.givenName, item.middleName, item.familyName].join(' '),
      phoneNumber: item.customAttribute
        ? JSON.parse(item.customAttribute)['phoneNumber']
        : '',
      alternatePhoneNumber: item.customAttribute
        ? JSON.parse(item.customAttribute)['alternatePhoneNumber']
        : '',
    }));

  const headers = [
    { key: 'id', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ID') },
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

  const renderCell = (
    row: PatientSearchViewModel<PatientSearch>,
    key: string,
  ) => {
    switch (key) {
      case 'id':
        return row.identifier;
      case 'name':
        return row.name;
      case 'gender':
        return row.gender;
      case 'age':
        return row.age;
      case 'phoneNumber':
        return row.phoneNumber;
      case 'alternatePhoneNumber':
        return row.alternatePhoneNumber;
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
            handleSearchPatient={handleSearchPatientUpdate}
          />
          {patientSearchData && searchTerm !== '' && (
            <Tile
              id="patient-search-result"
              aria-label="patient-search-result"
              className={styles.patientSearchTable}
            >
              {renderTitle(isLoading, isError, patientSearchResult.length)}
              <SortableDataTable
                headers={headers}
                ariaLabel="patient-search-sortable-data-table"
                loading={isLoading}
                rows={patientSearchResult}
                emptyStateMessage={t(
                  'REGISTRATION_PATIENT_SEARCH_EMPTY_MESSAGE',
                  {
                    searchTerm: searchTerm,
                  },
                )}
                errorStateMessage={
                  isError
                    ? t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE')
                    : undefined
                }
                renderCell={renderCell}
              />
            </Tile>
          )}
        </div>
      }
    />
  );
};

export default PatientSearchPage;
