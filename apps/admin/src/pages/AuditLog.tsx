import {
  Button,
  DataTable,
  DataTableColumn,
  DatePicker,
  DatePickerInput,
  TextInput,
  Tile,
  TimePicker,
} from '@bahmni/design-system';
import {
  AuditLogListEntry,
  formatDateTime,
  interpolateMessage,
  useTranslation,
} from '@bahmni/services';
import React, { useCallback, useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useAuditLogs } from '../hooks/useAuditLogs';
import styles from './styles/AuditLog.module.scss';

const AUDIT_LOG_PAGE_SIZE = 50;

export const AuditLog: React.FC = () => {
  const { t } = useTranslation();
  const {
    filters,
    setFilters,
    logs,
    isLoading,
    isFetching,
    isError,
    emptyMessageKey,
    next,
    prev,
    runReport,
    reset,
  } = useAuditLogs();

  const columns: DataTableColumn<AuditLogListEntry>[] = useMemo(
    () => [
      { key: 'auditLogId', header: t('EVENT_ID') },
      { key: 'dateCreated', header: t('CREATED_AT') },
      { key: 'eventType', header: t('EVENT_TYPE') },
      { key: 'userId', header: t('USERNAME') },
      { key: 'patientId', header: t('PATIENT_ID') },
      { key: 'message', header: t('MESSAGE') },
      { key: 'module', header: t('MODULE') },
    ],
    [t],
  );

  const renderCell = useCallback(
    (log: AuditLogListEntry, columnKey: string) => {
      switch (columnKey) {
        case 'dateCreated':
          return formatDateTime(log.dateCreated, t, true).formattedResult;
        case 'message': {
          // `log.message` may be either a legacy translation key (resolved
          // and interpolated by `t()` below) or already-translated plain
          // text with unresolved `{{}}` tokens, produced by the current
          // `logAuditEvent` write path (see `interpolateMessage`'s doc
          // comment in bahmni-services for why both cases need handling).
          const context = {
            auditLogId: log.auditLogId,
            dateCreated: log.dateCreated,
            eventType: log.eventType,
            userId: log.userId,
            patientId: log.patientId,
            module: log.module,
            ...(log.messageParams ?? {}),
          };
          return interpolateMessage(t(log.message, context), context);
        }
        default:
          return (log as unknown as Record<string, React.ReactNode>)[columnKey];
      }
    },
    [t],
  );

  return (
    <AdminLayout>
      <div
        id="admin-audit-log-page"
        data-testid="admin-audit-log-page-test-id"
        aria-label="admin-audit-log-page-aria-label"
        className={styles.page}
      >
        <h1>{t('ADMIN_AUDIT_LOG_TITLE')}</h1>

        <Tile className={styles.filters} aria-label={t('FILTERS_HEADER_LABEL')}>
          <h2>{t('FILTERS_HEADER_LABEL')}</h2>
          <div className={styles.filterRow}>
            <DatePicker
              datePickerType="single"
              dateFormat="d/m/Y"
              maxDate={new Date()}
              value={filters.startDate ?? undefined}
              onChange={(dates: Date[]) => {
                const selectedDate = dates?.[0] ?? null;
                setFilters((prev) => ({ ...prev, startDate: selectedDate }));
              }}
            >
              <DatePickerInput
                id="audit-log-start-date"
                labelText={t('START_FROM_FILTER_LABEL')}
                testId="audit-log-start-date-input"
              />
            </DatePicker>
            <TimePicker
              id="audit-log-start-time"
              labelText={t('START_FROM_FILTER_LABEL')}
              hideLabel
              value={filters.startTime}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, startTime: value }));
              }}
              testId="audit-log-start-time-input"
            />
            <TextInput
              id="audit-log-username"
              labelText={t('USERNAME_FILTER_LABEL')}
              placeholder={t('ENTER_USERNAME_PLACEHOLDER')}
              value={filters.username}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, username: value }));
              }}
              testId="audit-log-username-input"
            />
            <TextInput
              id="audit-log-patient-id"
              labelText={t('PATIENT_ID_FILTER_LABEL')}
              placeholder={t('ENTER_PATIENT_ID_PLACEHOLDER')}
              value={filters.patientId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const value = event.target.value;
                setFilters((prev) => ({ ...prev, patientId: value }));
              }}
              testId="audit-log-patient-id-input"
            />
            <Button
              kind="tertiary"
              onClick={reset}
              disabled={isFetching}
              testId="audit-log-reset-button"
            >
              {t('AUDIT_LOG_RESET_BUTTON_LABEL')}
            </Button>
            <Button
              kind="primary"
              onClick={runReport}
              disabled={isFetching}
              testId="audit-log-apply-button"
            >
              {t('AUDIT_LOG_APPLY_BUTTON_LABEL')}
            </Button>
          </div>
        </Tile>

        <div>
          <DataTable
            columns={columns}
            rows={logs}
            ariaLabel={t('AUDIT_LOG_TABLE_HEADER_LABEL')}
            title={t('AUDIT_LOG_TABLE_HEADER_LABEL')}
            dataTestId="audit-log-table"
            loading={isLoading}
            renderCell={renderCell}
            emptyStateMessage={emptyMessageKey ? t(emptyMessageKey) : undefined}
            errorStateMessage={isError ? t('ADMIN_ERROR_FETCH_CONFIG') : null}
            pagination={{
              mode: 'cursor',
              pageSize: AUDIT_LOG_PAGE_SIZE,
              hasNext: true,
              hasPrevious: true,
              disabled: isFetching,
              iconOnly: true,
              hidePageNumbers: true,
              previousLabel: t('AUDIT_LOG_PREV_BUTTON_LABEL'),
              nextLabel: t('AUDIT_LOG_NEXT_BUTTON_LABEL'),
              onSetChange: (direction) =>
                direction === 'next' ? next() : prev(),
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
};
