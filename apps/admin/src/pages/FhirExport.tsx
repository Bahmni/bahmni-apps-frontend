import {
  Button,
  Checkbox,
  DataTable,
  DataTableColumn,
  DatePicker,
  DatePickerInput,
  InlineLoading,
  Tag,
  Tile,
} from '@bahmni/design-system';
import {
  FhirExportTask,
  formatDateTime,
  hasPrivilege,
  logAuditEvent,
  submitFhirExport,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { FormEvent, useCallback, useMemo, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  FHIR_EXPORT_PLAIN_PRIVILEGE,
  FHIR_EXPORT_PRIVILEGE,
} from '../constants/app';
import {
  FHIR_EXPORT_TASKS_QUERY_KEY,
  useFhirExportTasks,
} from '../hooks/useFhirExportTasks';
import styles from './styles/FhirExport.module.scss';

const NOTIFICATION_TIMEOUT_MS = 5000;
const SERVER_DATE_FORMAT = 'yyyy-MM-dd';

interface ExportRequest {
  startDate: string;
  endDate: string;
  anonymise: boolean;
}

export const FhirExport: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();
  const { userPrivileges } = useUserPrivilege();

  const canExport = hasPrivilege(userPrivileges, [
    FHIR_EXPORT_PRIVILEGE,
    FHIR_EXPORT_PLAIN_PRIVILEGE,
  ]);
  const canExportPlain = hasPrivilege(userPrivileges, [
    FHIR_EXPORT_PLAIN_PRIVILEGE,
  ]);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [anonymiseChoice, setAnonymiseChoice] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  // Without the plain-export privilege the export is always anonymised.
  const anonymise = canExportPlain ? anonymiseChoice : true;

  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useFhirExportTasks(canExport);

  const exportMutation = useMutation({
    mutationFn: async (request: ExportRequest) => {
      await submitFhirExport(request);
      // The export is already queued, so a failing audit entry must not fail it.
      try {
        await logAuditEvent(
          undefined,
          'PATIENT_DATA_BULK_EXPORT',
          {
            startDate: request.startDate,
            endDate: request.endDate,
            exportMode: request.anonymise ? 'Anonymized' : 'Non-Anonymized',
          },
          'MODULE_LABEL_EXPORT_KEY',
        );
      } catch {
        // intentionally ignored
      }
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: t('ADMIN_FHIR_EXPORT_SUCCESS_TITLE'),
        message: t('ADMIN_FHIR_EXPORT_SUCCESS_MESSAGE'),
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
      void queryClient.invalidateQueries({
        queryKey: FHIR_EXPORT_TASKS_QUERY_KEY,
      });
    },
    onError: () => {
      addNotification({
        type: 'error',
        title: t('ADMIN_FHIR_EXPORT_ERROR_TITLE'),
        message: t('ADMIN_FHIR_EXPORT_ERROR_MESSAGE'),
        timeout: NOTIFICATION_TIMEOUT_MS,
      });
    },
  });

  const startDateError = !startDate
    ? 'ADMIN_FHIR_EXPORT_START_DATE_REQUIRED'
    : endDate && startDate > endDate
      ? 'ADMIN_FHIR_EXPORT_DATE_RANGE_INVALID'
      : null;
  const endDateError = !endDate ? 'ADMIN_FHIR_EXPORT_END_DATE_REQUIRED' : null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (exportMutation.isPending || !startDate || !endDate) return;
    if (startDateError || endDateError) return;
    exportMutation.mutate({
      startDate: format(startDate, SERVER_DATE_FORMAT),
      endDate: format(endDate, SERVER_DATE_FORMAT),
      anonymise,
    });
  };

  const columns: DataTableColumn<FhirExportTask>[] = useMemo(
    () => [
      { key: 'userName', header: t('ADMIN_FHIR_EXPORT_COLUMN_USER') },
      { key: 'triggeredDate', header: t('ADMIN_FHIR_EXPORT_COLUMN_TRIGGERED') },
      { key: 'startDate', header: t('ADMIN_FHIR_EXPORT_COLUMN_START_DATE') },
      { key: 'endDate', header: t('ADMIN_FHIR_EXPORT_COLUMN_END_DATE') },
      { key: 'anonymised', header: t('ADMIN_FHIR_EXPORT_COLUMN_ANONYMISED') },
      { key: 'status', header: t('ADMIN_FHIR_EXPORT_COLUMN_STATUS') },
      { key: 'downloadUrl', header: t('ADMIN_FHIR_EXPORT_COLUMN_DOWNLOAD') },
    ],
    [t],
  );

  const renderCell = useCallback(
    (task: FhirExportTask, columnKey: string): React.ReactNode => {
      switch (columnKey) {
        case 'triggeredDate':
          return task.triggeredDate
            ? formatDateTime(task.triggeredDate, t, true).formattedResult
            : '';
        case 'startDate':
        case 'endDate': {
          const value = task[columnKey];
          return value ? formatDateTime(value, t).formattedResult : '';
        }
        case 'anonymised':
          return task.anonymised
            ? t('ADMIN_FHIR_EXPORT_YES')
            : t('ADMIN_FHIR_EXPORT_NO');
        case 'status':
          return (
            <>
              <Tag type={task.status === 'failed' ? 'red' : 'gray'}>
                {t(`ADMIN_FHIR_EXPORT_STATUS_${task.status.toUpperCase()}`, {
                  defaultValue: task.status,
                })}
              </Tag>
              {task.status === 'failed' && task.statusReason ? (
                <span data-testid="fhir-export-failure-reason">
                  {task.statusReason}
                </span>
              ) : null}
            </>
          );
        case 'downloadUrl':
          return task.downloadUrl ? (
            <a href={task.downloadUrl}>{t('ADMIN_FHIR_EXPORT_DOWNLOAD')}</a>
          ) : (
            ''
          );
        default:
          return String(task[columnKey as keyof FhirExportTask] ?? '');
      }
    },
    [t],
  );

  return (
    <AdminLayout breadcrumbLabel={t('MODULE_LABEL_FHIR_EXPORT_KEY')}>
      <div
        id="admin-fhir-export-page"
        data-testid="admin-fhir-export-page-test-id"
        className={styles.page}
      >
        <Tile className={styles.tile} aria-label={t('ADMIN_FHIR_EXPORT_TITLE')}>
          <h2 className={styles.title}>{t('ADMIN_FHIR_EXPORT_TITLE')}</h2>
          {canExport ? (
            <p className={styles.warning}>
              {t('ADMIN_FHIR_EXPORT_PATIENT_DATA_WARNING')}
            </p>
          ) : (
            <p
              className={styles.warning}
              data-testid="fhir-export-no-privilege-test-id"
            >
              {t('ADMIN_FHIR_EXPORT_INSUFFICIENT_PRIVILEGE')}
            </p>
          )}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <DatePicker
              datePickerType="single"
              maxDate={new Date()}
              value={startDate ?? undefined}
              onChange={(dates: Date[]) => setStartDate(dates?.[0] ?? null)}
              // Clearing the text input only emits a close event, not a change.
              onClose={(dates: Date[]) => setStartDate(dates?.[0] ?? null)}
            >
              <DatePickerInput
                id="fhir-export-start-date"
                labelText={t('ADMIN_FHIR_EXPORT_START_DATE_LABEL')}
                testId="fhir-export-start-date-input"
                disabled={!canExport}
                invalid={submitted && !!startDateError}
                invalidText={startDateError ? t(startDateError) : undefined}
              />
            </DatePicker>
            <DatePicker
              datePickerType="single"
              maxDate={new Date()}
              value={endDate ?? undefined}
              onChange={(dates: Date[]) => setEndDate(dates?.[0] ?? null)}
              // Clearing the text input only emits a close event, not a change.
              onClose={(dates: Date[]) => setEndDate(dates?.[0] ?? null)}
            >
              <DatePickerInput
                id="fhir-export-end-date"
                labelText={t('ADMIN_FHIR_EXPORT_END_DATE_LABEL')}
                testId="fhir-export-end-date-input"
                disabled={!canExport}
                invalid={submitted && !!endDateError}
                invalidText={endDateError ? t(endDateError) : undefined}
              />
            </DatePicker>
            <Checkbox
              id="fhir-export-anonymise"
              className={styles.checkbox}
              labelText={t('ADMIN_FHIR_EXPORT_ANONYMISE_LABEL')}
              checked={anonymise}
              disabled={!canExportPlain}
              onChange={(_, { checked }) => setAnonymiseChoice(checked)}
              testId="fhir-export-anonymise-checkbox"
            />
            <Button
              type="submit"
              kind="primary"
              size="md"
              className={styles.submit}
              testId="fhir-export-button-test-id"
              disabled={!canExport || exportMutation.isPending}
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
          </form>
        </Tile>

        <DataTable
          columns={columns}
          rows={tasks}
          ariaLabel={t('ADMIN_FHIR_EXPORT_TABLE_TITLE')}
          title={t('ADMIN_FHIR_EXPORT_TABLE_TITLE')}
          dataTestId="fhir-export-tasks-table"
          loading={isLoading}
          renderCell={renderCell}
          emptyStateMessage={t('ADMIN_FHIR_EXPORT_NO_TASKS')}
          errorStateMessage={
            isError ? t('ADMIN_FHIR_EXPORT_TASKS_ERROR') : null
          }
        />
      </div>
    </AdminLayout>
  );
};
