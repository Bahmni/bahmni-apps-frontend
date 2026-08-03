import {
  Button,
  Link,
  SkeletonText,
  SortableDataTable,
  Stack,
  Tag,
  Tile,
} from '@bahmni/design-system';
import {
  AppointmentSearchResult,
  PatientSearchField,
  PatientSearchResult,
  PatientSearchResultBundle,
  formatUrl,
  useTranslation,
} from '@bahmni/services';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import {
  getAppointmentStatusClassName,
  handleActionButtonClick,
  shouldRenderActionButton,
} from './appointmentSearchResultActionHandler';
import styles from './styles/SearchPatient.module.scss';
import { PatientSearchViewModel, formatPatientSearchResult } from './utils';

const CELL_IDS = {
  IDENTIFIER: 'identifier',
  APPOINTMENT_STATUS: 'appointmentStatus',
  GENDER: 'gender',
  ACTIONS: 'actions',
} as const;

const INTERNAL_PATH_PATTERN = /^\//;
const EXTERNAL_OR_HASH_PATTERN = /^(https?:\/\/|#)/i;

interface PatientSearchResultsProps {
  data: PatientSearchResultBundle | undefined;
  searchTerm: string;
  isLoading: boolean;
  isError: boolean;
  isAdvancedSearch: boolean;
  searchFields: PatientSearchField[];
  selectedFieldType: string;
  patientDetailUrl?: string;
  setData: (data: PatientSearchResultBundle) => void;
}

const PatientSearchResults = ({
  data,
  searchTerm,
  isLoading,
  isError,
  isAdvancedSearch,
  searchFields,
  selectedFieldType,
  patientDetailUrl,
  setData,
}: PatientSearchResultsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();

  const headers = [
    { key: 'identifier', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_ID') },
    { key: 'name', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_NAME') },
    { key: 'gender', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_GENDER') },
    { key: 'age', header: t('REGISTRATION_PATIENT_SEARCH_HEADER_AGE') },
    ...(selectedFieldType === 'appointment'
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

  const renderTitle = () => {
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
            count: data?.totalCount ?? 0,
          })}
        </span>
      );
    }
  };

  const renderIdentifier = (uuid: string, identifier: string) => {
    if (!patientDetailUrl) {
      return <span>{identifier}</span>;
    }
    const url = formatUrl(patientDetailUrl, { patientUuid: uuid }, true).trim();

    if (INTERNAL_PATH_PATTERN.test(url)) {
      return (
        <Link
          href={url}
          onClick={(e) => {
            e.preventDefault();
            navigate(url);
          }}
        >
          {identifier}
        </Link>
      );
    }

    if (EXTERNAL_OR_HASH_PATTERN.test(url)) {
      return <a href={url}>{identifier}</a>;
    }

    return <span>{identifier}</span>;
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
            if (
              !shouldRenderActionButton(
                action,
                userPrivileges ?? [],
                row as PatientSearchViewModel<AppointmentSearchResult>,
              )
            )
              return null;
            return (
              <Button
                key={action.translationKey}
                className={styles.actionButton}
                kind="tertiary"
                size="sm"
                data-testid={`patient-action-button-${action.translationKey}`}
                onClick={() => {
                  if (!data) return;
                  handleActionButtonClick(
                    action,
                    row as PatientSearchViewModel<AppointmentSearchResult>,
                    data,
                    setData,
                    navigate,
                    addNotification,
                    t,
                  );
                }}
              >
                {t(action.translationKey)}
              </Button>
            );
          }),
        )}
      </Stack>
    );
  };

  const renderPatientSearchResult = (
    row: PatientSearchViewModel<PatientSearchResult | AppointmentSearchResult>,
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
  };

  const emptyMessage = isAdvancedSearch
    ? t('REGISTRATION_PATIENT_SEARCH_CUSTOM_ATTRIBUTE_EMPTY_MESSAGE', {
        searchTerm,
      })
    : t('REGISTRATION_PATIENT_SEARCH_EMPTY_MESSAGE', { searchTerm });

  return (
    <div className={styles.patientSearchResult}>
      <Tile
        id="patient-search-result"
        aria-label="patient-search-result"
        className={styles.resultsTitle}
      >
        {renderTitle()}
      </Tile>
      <SortableDataTable
        headers={headers}
        ariaLabel="patient-search-sortable-data-table"
        loading={isLoading}
        rows={formatPatientSearchResult(data, searchFields)}
        renderCell={renderPatientSearchResult}
        emptyStateMessage={emptyMessage}
        className={styles.patientSearchTableBody}
        errorStateMessage={
          isError ? t('REGISTRATION_PATIENT_SEARCH_ERROR_MESSAGE') : undefined
        }
      />
    </div>
  );
};

export default PatientSearchResults;
