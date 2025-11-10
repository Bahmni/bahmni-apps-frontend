import {
  BaseLayout,
  Button,
  Link,
  Loading,
  SkeletonText,
  SortableDataTable,
  Stack,
  Tag,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  AppointmentSearchResult,
  AppointmentSearchResultBundle,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  BAHMNI_HOME_PATH,
  dispatchAuditEvent,
  getRegistrationConfig,
  PatientSearchField,
  PatientSearchResult,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import {
  SearchPatient,
  useUserPrivilege,
} from '@bahmni-frontend/bahmni-widgets';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import {
  getAppointmentStatusClassName,
  handleButtonClick,
  isButtonEnabled,
  shouldRenderButton,
} from './appointmentSearchHandler';
import styles from './styles/index.module.scss';
import { formatPatientSearchResult, PatientSearchViewModel } from './utils';

/**
 * PatientSearchPage
 * Registration Patient Search interface that let's the user search for a patient using keywords.
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  const [patientSearchData, setPatientSearchData] = useState<
    AppointmentSearchResultBundle | undefined
  >();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<PatientSearchField[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedFieldType, setSelectedFieldType] = useState<string>('');
  const { userPrivileges } = useUserPrivilege();

  const handleCreateNewPatient = () => {
    navigate('/registration/new');
  };
  useEffect(() => {
    const loadSearchConfig = async () => {
      const config = await getRegistrationConfig();
      let fields: PatientSearchField[] = [];

      if (selectedFieldType === 'appointment') {
        fields = [...(config?.patientSearch?.appointment ?? [])];
      } else {
        fields = [...(config?.patientSearch?.customAttributes ?? [])];
      }

      setSearchFields(fields);
    };
    loadSearchConfig();
  }, [selectedFieldType]);

  useEffect(() => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
        .eventType as AuditEventType,
      module: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
    });
  }, []);

  const handleOnSearch = (
    data: AppointmentSearchResultBundle | undefined,
    searchTerm: string,
    isLoading: boolean,
    isError: boolean,
    isAdvancedSearch: boolean,
    selectedFieldType?: string,
  ) => {
    setPatientSearchData(data ?? undefined);
    setSearchTerm(searchTerm);
    setIsLoading(isLoading);
    setIsError(isError);
    setIsAdvancedSearch(isAdvancedSearch);
    setSelectedFieldType(isAdvancedSearch ? (selectedFieldType ?? '') : '');
  };

  const headers = [
    { key: 'identifier', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ID') },
    { key: 'name', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_NAME') },
    { key: 'gender', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_GENDER') },
    { key: 'age', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_AGE') },
    ...(selectedFieldType == 'appointment'
      ? [
          {
            key: 'birthDate',
            header: t('REGISTRATION_PATIENT_SEARCH_HEADER_BIRTH_DATE'),
          },
        ]
      : []),
    ...(searchFields.length > 0
      ? searchFields
          .flatMap((field) =>
            field.expectedFields?.map((expectedField) => ({
              key: expectedField.field,
              header: expectedField.translationKey
                ? t(expectedField.translationKey)
                : expectedField.field,
            })),
          )
          .filter((header) => header !== undefined)
      : []),

    ...(searchFields.some((field) => field.actions && field.actions.length > 0)
      ? [
          {
            key: 'actions',
            header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ACTIONS'),
          },
        ]
      : []),
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
    if (selectedFieldType === 'appointment') return;
    if (row.uuid) {
      navigateToPatient(row.uuid);
    }
  };

  const renderPatientSearchResult = useCallback(
    (
      row: PatientSearchViewModel<AppointmentSearchResult>,
      cellId: string,
    ): React.ReactNode => {
      switch (cellId) {
        case 'identifier':
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

        case 'appointmentStatus':
          return (
            <Tag
              className={`${
                styles[
                  getAppointmentStatusClassName(
                    String(row.appointmentStatus ?? ''),
                  )
                ]
              }`}
              data-testid={`appointment-status-${row.uuid}`}
            >
              {String(row.appointmentStatus ?? '')}
            </Tag>
          );

        case 'actions':
          return (
            <Stack gap={3} className={styles.actionButtonsContainer}>
              {searchFields.map((field) =>
                field.actions?.map((action) => {
                  if (!shouldRenderButton(action, userPrivileges ?? []))
                    return <></>;
                  return (
                    <Button
                      key={action.translationKey}
                      className={styles.actionButton}
                      kind="tertiary"
                      size="sm"
                      disabled={
                        !isButtonEnabled(
                          action.enabledRule,
                          row,
                          userPrivileges ?? [],
                        )
                      }
                      onClick={() =>
                        handleButtonClick(
                          action,
                          row,
                          patientSearchData!,
                          setPatientSearchData,
                          navigate,
                        )
                      }
                    >
                      {t(action.translationKey)}
                    </Button>
                  );
                }),
              )}
            </Stack>
          );
      }

      const cellValue =
        row[cellId as keyof PatientSearchViewModel<AppointmentSearchResult>];
      if (cellValue instanceof Date) {
        return cellValue.toLocaleDateString();
      }
      return String(cellValue ?? '');
    },
    [navigateToPatient],
  );

  if (isNavigating) {
    return <Loading description={t('LOADING_PATIENT_DETAILS')} role="status" />;
  }

  const breadcrumbs = [
    {
      label: t('REGISTRATION_PATIENT_SEARCH_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      label: 'Search Patient',
    },
  ];

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbs={breadcrumbs}
          showButton
          buttonText="Create new patient"
          onButtonClick={handleCreateNewPatient}
          buttonTestId="create-new-patient-button"
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
                rows={formatPatientSearchResult(
                  patientSearchData,
                  searchFields,
                )}
                renderCell={renderPatientSearchResult}
                emptyStateMessage={
                  isAdvancedSearch
                    ? t(
                        'REGISTRATION_PATIENT_SEARCH_CUSTOM_ATTRIBUTE_EMPTY_MESSAGE',
                        {
                          searchTerm: searchTerm,
                        },
                      )
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
