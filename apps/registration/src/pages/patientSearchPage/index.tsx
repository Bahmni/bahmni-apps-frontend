import {
  BaseLayout,
  Button,
  Header,
  Icon,
  ICON_SIZE,
  Link,
  Loading,
  SkeletonText,
  SortableDataTable,
  Stack,
  Tag,
  Tile,
} from '@bahmni/design-system';
import {
  AppointmentSearchResult,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  BAHMNI_HOME_PATH,
  dispatchAuditEvent,
  getRegistrationConfig,
  PatientSearchField,
  PatientSearchResult,
  PatientSearchResultBundle,
  useTranslation,
} from '@bahmni/services';
import { SearchPatient, useUserPrivilege } from '@bahmni/widgets';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAppointmentStatusClassName,
  handleActionButtonClick,
  isActionButtonEnabled,
  shouldRenderActionButton,
} from './appointmentSearchResultActionHandler';
import styles from './styles/index.module.scss';
import { formatPatientSearchResult, PatientSearchViewModel } from './utils';

const CELL_IDS = {
  IDENTIFIER: 'identifier',
  APPOINTMENT_STATUS: 'appointmentStatus',
  GENDER: 'gender',
  ACTIONS: 'actions',
} as const;

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
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<PatientSearchField[]>([]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedFieldType, setSelectedFieldType] = useState<string>('');
  const { userPrivileges } = useUserPrivilege();

  const handleCreateNewPatient = () => {
    navigate('/registration/patient/new');
  };

  const getSearchFieldsFromConfig = async (selectedType: string) => {
    const config = await getRegistrationConfig();

    const fields =
      selectedType === 'appointment'
        ? (config?.patientSearch?.appointment ?? [])
        : (config?.patientSearch?.customAttributes ?? []);

    return fields;
  };

  useEffect(() => {
    const loadSearchConfig = async () => {
      getSearchFieldsFromConfig(selectedFieldType).then((fields) => {
        setSearchFields(fields);
      });
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
    data: PatientSearchResultBundle | undefined,
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
    navigate(`/registration/patient/${patientUuid}`);
  };

  const renderIdentifier = (uuid: string, identifier: string) => {
    return (
      <Link
        onClick={(e) => {
          e.preventDefault();
          navigateToPatient(uuid);
        }}
      >
        {identifier}
      </Link>
    );
  };

  const renderAppointmentStatus = (uuid: string, status: string) => {
    return (
      <Tag
        className={`${styles[getAppointmentStatusClassName(String(status))]}`}
        data-testid={`appointment-status-${uuid}`}
      >
        {t(
          `REGISTRATION_SEARCH_PAGE_APPOINTMENT_STATUS_${String(status)
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toUpperCase()}`,
        )}
      </Tag>
    );
  };

  const renderActions = (
    row: PatientSearchViewModel<PatientSearchResult | AppointmentSearchResult>,
  ) => {
    return (
      <Stack gap={3} className={styles.actionButtonsContainer}>
        {searchFields.map((field) =>
          field.actions?.map((action) => {
            if (!shouldRenderActionButton(action, userPrivileges ?? []))
              return null;
            return (
              <Button
                key={action.translationKey}
                className={styles.actionButton}
                kind="tertiary"
                size="sm"
                data-testid={`patient-action-button-${action.translationKey}`}
                disabled={
                  !isActionButtonEnabled(
                    action.enabledRule,
                    row,
                    userPrivileges ?? [],
                  )
                }
                onClick={() =>
                  handleActionButtonClick(
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
  };

  const renderPatientSearchResult = useCallback(
    (
      row: PatientSearchViewModel<
        PatientSearchResult | AppointmentSearchResult
      >,
      cellId: string,
    ): React.ReactNode => {
      switch (cellId) {
        case CELL_IDS.IDENTIFIER:
          return renderIdentifier(row.uuid ?? '', row.identifier ?? '');

        case CELL_IDS.APPOINTMENT_STATUS:
          return renderAppointmentStatus(
            row.uuid ?? '',
            (row.appointmentStatus as string) ?? '',
          );

        case CELL_IDS.GENDER:
          return String(row.gender ?? '');

        case CELL_IDS.ACTIONS:
          return renderActions(row);
      }

      const cellValue =
        row[
          cellId as keyof PatientSearchViewModel<
            PatientSearchResult | AppointmentSearchResult
          >
        ];
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
      id: 'home',
      label: t('CREATE_PATIENT_BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
    },
    {
      id: 'search',
      label: t('CREATE_PATIENT_BREADCRUMB_SEARCH'),
      isCurrentPage: true,
    },
  ];
  const globalActions = [
    {
      id: 'user',
      label: 'user',
      renderIcon: <Icon id="user" name="fa-user" size={ICON_SIZE.LG} />,
      onClick: () => {},
    },
  ];
  const emptyMessage = isAdvancedSearch
    ? t('REGISTRATION_PATIENT_SEARCH_CUSTOM_ATTRIBUTE_EMPTY_MESSAGE', {
        searchTerm: searchTerm,
      })
    : t('REGISTRATION_PATIENT_SEARCH_EMPTY_MESSAGE', {
        searchTerm: searchTerm,
      });

  return (
    <BaseLayout
      header={
        <>
          <Header breadcrumbItems={breadcrumbs} globalActions={globalActions} />
          <Button
            onClick={handleCreateNewPatient}
            size="md"
            className={styles.headerButton}
            data-testid="create-new-patient-button"
          >
            {t('CREATE_PATIENT_BUTTON_TEXT')}
          </Button>
        </>
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
                emptyStateMessage={emptyMessage}
                className={styles.patientSearchTableBody}
                errorStateMessage={
                  isError
                    ? t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE')
                    : undefined
                }
              />
            </div>
          )}
        </div>
      }
    />
  );
};

export default PatientSearchPage;
