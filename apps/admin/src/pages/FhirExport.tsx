import {
  Button,
  Checkbox,
  DataTable,
  DataTableColumn,
  DatePicker,
  DatePickerInput,
  InlineLoading,
  Link,
  Tag,
  Tile,
} from '@bahmni/design-system';
import {
  FhirExportTask,
  formatDateTime,
  hasPrivilege,
  submitFhirExport,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfDay, subDays } from 'date-fns';
import React, { FormEvent, useCallback, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  FHIR_EXPORT_DEFAULT_RANGE_DAYS,
  FHIR_EXPORT_NON_ANONYMISED_PRIVILEGE,
  FHIR_EXPORT_PRIVILEGE,
} from '../constants/app';
import {
  FHIR_EXPORT_TASKS_QUERY_KEY,
  useFhirExportTasks,
} from '../hooks/useFhirExportTasks';
import styles from './styles/FhirExport.module.scss';

const NOTIFICATION_TIMEOUT_MS = 5000;
const API_DATE_FORMAT = 'yyyy-MM-dd';

const STATUS_LABEL_KEYS: Record<string, string> = {
  requested: 'ADMIN_FHIR_EXPORT_STATUS_REQUESTED',
  accepted: 'ADMIN_FHIR_EXPORT_STATUS_ACCEPTED',
  'in-progress': 'ADMIN_FHIR_EXPORT_STATUS_IN_PROGRESS',
  completed: 'ADMIN_FHIR_EXPORT_STATUS_COMPLETED',
  failed: 'ADMIN_FHIR_EXPORT_STATUS_FAILED',
  // The backend marks an export that threw as REJECTED, which the user sees as a failure
  rejected: 'ADMIN_FHIR_EXPORT_STATUS_FAILED',
  cancelled: 'ADMIN_FHIR_EXPORT_STATUS_CANCELLED',
};

const STATUS_TAG_TYPES: Record<string, 'green' | 'red' | 'blue' | 'gray'> = {
  completed: 'green',
  failed: 'red',
  rejected: 'red',
  cancelled: 'gray',
};

export const FhirExport: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const { userPrivileges } = useUserPrivilege();

  const canExportNonAnonymised = hasPrivilege(
    userPrivileges,
    FHIR_EXPORT_NON_ANONYMISED_PRIVILEGE,
  );
  const canExport =
    canExportNonAnonymised ||
    hasPrivilege(userPrivileges, FHIR_EXPORT_PRIVILEGE);

  const [startDate, setStartDate] = useState<Date | null>(() =>
    subDays(startOfDay(new Date()), FHIR_EXPORT_DEFAULT_RANGE_DAYS),
  );
  const [endDate, setEndDate] = useState<Date | null>(() =>
    startOfDay(new Date()),
  );
  const [anonymise, setAnonymise] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useFhirExportTasks(canExport);

  const startDateError =
    !startDate && hasSubmitted
      ? t('ADMIN_FHIR_EXPORT_DATE_REQUIRED')
      : undefined;

  const endDateError = useMemo(() => {
    if (!endDate) {
      return hasSubmitted ? t('ADMIN_FHIR_EXPORT_DATE_REQUIRED') : undefined;
    }
    if (startDate && endDate < startDate) {
      return t('ADMIN_FHIR_EXPORT_DATE_RANGE_INVALID');
    }
    return undefined;
  }, [hasSubmitted, startDate, endDate, t]);

  const exportMutation = useMutation({
    mutationFn: submitFhirExport,
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: t('ADMIN_FHIR_EXPORT_SUBMITTED_TITLE'),
        message: t('ADMIN_FHIR_EXPORT_SUBMITTED_MESSAGE'),
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
      // Show the new "Requested" row straight away; polling then follows it
      queryClient.invalidateQueries({ queryKey: FHIR_EXPORT_TASKS_QUERY_KEY });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: t('ADMIN_FHIR_EXPORT_ERROR_TITLE'),
        message: error.message,
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (exportMutation.isPending || !canExport) return;
    setHasSubmitted(true);
    if (!startDate || !endDate || endDate < startDate) return;
    exportMutation.mutate({
      startDate: format(startDate, API_DATE_FORMAT),
      endDate: format(endDate, API_DATE_FORMAT),
      // Without the privilege a non-anonymised export is not allowed, so never ask for one
      anonymise: canExportNonAnonymised ? anonymise : true,
    });
  };

  const columns: DataTableColumn<FhirExportTask>[] = useMemo(
    () => [
      { key: 'userName', header: t('ADMIN_FHIR_EXPORT_COLUMN_USER') },
      { key: 'authoredOn', header: t('ADMIN_FHIR_EXPORT_COLUMN_TRIGGERED') },
      { key: 'startDate', header: t('ADMIN_FHIR_EXPORT_COLUMN_START_DATE') },
      { key: 'endDate', header: t('ADMIN_FHIR_EXPORT_COLUMN_END_DATE') },
      { key: 'anonymised', header: t('ADMIN_FHIR_EXPORT_COLUMN_ANONYMISED') },
      { key: 'status', header: t('ADMIN_FHIR_EXPORT_COLUMN_STATUS') },
      { key: 'downloadUrl', header: t('ADMIN_FHIR_EXPORT_COLUMN_DOWNLOAD') },
    ],
    [t],
  );

  const renderCell = useCallback(
    (task: FhirExportTask, columnKey: string) => {
      switch (columnKey) {
        case 'authoredOn':
          return task.authoredOn
            ? formatDateTime(task.authoredOn, t, true).formattedResult
            : '';
        case 'startDate':
        case 'endDate': {
          const value = task[columnKey];
          return value ? formatDateTime(value, t).formattedResult : '';
        }
        case 'anonymised':
          return (
            <Checkbox
              id={`fhir-export-anonymised-${task.id}`}
              labelText={t('ADMIN_FHIR_EXPORT_COLUMN_ANONYMISED')}
              hideLabel
              checked={task.anonymised}
              readOnly
              disabled
            />
          );
        case 'status': {
          const labelKey = STATUS_LABEL_KEYS[task.status];
          return (
            <>
              <Tag
                type={STATUS_TAG_TYPES[task.status] ?? 'blue'}
                testId={`fhir-export-status-${task.id}-test-id`}
              >
                {labelKey ? t(labelKey) : task.status}
              </Tag>
              {task.errorMessage && (
                <div className={styles.errorMessage}>{task.errorMessage}</div>
              )}
            </>
          );
        }
        case 'downloadUrl':
          return task.downloadUrl ? (
            <Link
              href={task.downloadUrl}
              testId={`fhir-export-download-${task.id}-test-id`}
            >
              {t('ADMIN_FHIR_EXPORT_DOWNLOAD_LINK')}
            </Link>
          ) : null;
        default:
          return task[columnKey as keyof FhirExportTask]?.toString() ?? '';
      }
    },
    [t],
  );

  return (
    <AdminLayout breadcrumbLabel={t('BREADCRUMB_FHIR_EXPORT')}>
      <div
        id="admin-fhir-export-page"
        data-testid="admin-fhir-export-page-test-id"
        aria-label="FHIR Export Page"
        className={styles.page}
      >
        <Tile className={styles.tile}>
          <h2 className={styles.title}>{t('ADMIN_FHIR_EXPORT_TITLE')}</h2>
          <p
            className={styles.warning}
            data-testid="fhir-export-warning-test-id"
          >
            {canExport
              ? t('ADMIN_FHIR_EXPORT_WARNING')
              : t('ADMIN_FHIR_EXPORT_NO_PRIVILEGE')}
          </p>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <DatePicker
              datePickerType="single"
              dateFormat="d/m/Y"
              maxDate={new Date()}
              value={startDate ?? undefined}
              onChange={(dates: Date[]) => setStartDate(dates?.[0] ?? null)}
            >
              <DatePickerInput
                id="fhir-export-start-date"
                labelText={t('ADMIN_FHIR_EXPORT_START_DATE_LABEL')}
                invalid={!!startDateError}
                invalidText={startDateError}
                disabled={!canExport}
                testId="fhir-export-start-date-input"
              />
            </DatePicker>
            <DatePicker
              datePickerType="single"
              dateFormat="d/m/Y"
              maxDate={new Date()}
              value={endDate ?? undefined}
              onChange={(dates: Date[]) => setEndDate(dates?.[0] ?? null)}
            >
              <DatePickerInput
                id="fhir-export-end-date"
                labelText={t('ADMIN_FHIR_EXPORT_END_DATE_LABEL')}
                invalid={!!endDateError}
                invalidText={endDateError}
                disabled={!canExport}
                testId="fhir-export-end-date-input"
              />
            </DatePicker>
            <div className={styles.checkbox}>
              <Checkbox
                id="fhir-export-anonymise"
                labelText={t('ADMIN_FHIR_EXPORT_ANONYMISE_LABEL')}
                helperText={
                  canExport && !canExportNonAnonymised
                    ? t('ADMIN_FHIR_EXPORT_ANONYMISE_LOCKED_HELPER')
                    : undefined
                }
                checked={canExportNonAnonymised ? anonymise : true}
                disabled={!canExportNonAnonymised}
                onChange={(_, { checked }) => setAnonymise(checked)}
                testId="fhir-export-anonymise-test-id"
              />
            </div>
            <div className={styles.submit}>
              <Button
                type="submit"
                kind="primary"
                size="md"
                testId="fhir-export-button-test-id"
                disabled={exportMutation.isPending || !canExport}
              >
                {exportMutation.isPending ? (
                  <InlineLoading
                    description={t('ADMIN_FHIR_EXPORT_IN_PROGRESS')}
                    testId="fhir-export-loading-test-id"
                  />
                ) : (
                  t('ADMIN_FHIR_EXPORT_BUTTON')
                )}
              </Button>
            </div>
          </form>
        </Tile>
        <Tile className={styles.tile}>
          <div className={styles.tableHeader}>
            <h2 className={styles.title}>
              {t('ADMIN_FHIR_EXPORT_TABLE_TITLE')}
            </h2>
            <Button
              kind="tertiary"
              size="sm"
              testId="fhir-export-refresh-button-test-id"
              disabled={!canExport || isFetching}
              onClick={() => refetch()}
            >
              {t('ADMIN_FHIR_EXPORT_REFRESH_BUTTON')}
            </Button>
          </div>
          <DataTable
            columns={columns}
            rows={tasks}
            ariaLabel={t('ADMIN_FHIR_EXPORT_TABLE_TITLE')}
            loading={isLoading && canExport}
            errorStateMessage={
              isError ? t('ADMIN_FHIR_EXPORT_FETCH_ERROR') : null
            }
            emptyStateMessage={t('ADMIN_FHIR_EXPORT_NO_TASKS')}
            renderCell={renderCell}
            dataTestId="fhir-export-tasks-table-test-id"
          />
        </Tile>
      </div>
    </AdminLayout>
  );
};
