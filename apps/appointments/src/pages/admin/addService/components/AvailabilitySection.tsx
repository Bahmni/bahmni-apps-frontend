import {
  Button,
  Close,
  IconButton,
  NumberInput,
  SortableDataTable,
  TimePickerInput,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useCallback, useMemo } from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { AvailabilityRow, useAddServiceStore } from '../stores';
import styles from '../styles/index.module.scss';

const AvailabilitySection: React.FC = () => {
  const { t } = useTranslation();

  const {
    availabilityRows,
    updateAvailabilityRow,
    toggleDayOfWeek,
    addAvailabilityRow,
    removeAvailabilityRow,
  } = useAddServiceStore();

  const availabilityHeaders = useMemo(
    () => [
      {
        key: 'startTime',
        header: t('ADMIN_ADD_SERVICE_TABLE_HEADER_START_TIME'),
      },
      { key: 'endTime', header: t('ADMIN_ADD_SERVICE_TABLE_HEADER_END_TIME') },
      { key: 'maxLoad', header: t('ADMIN_ADD_SERVICE_TABLE_HEADER_MAX_LOAD') },
      {
        key: 'daysOfWeek',
        header: t('ADMIN_ADD_SERVICE_TABLE_HEADER_DAYS_OF_WEEK'),
      },
      {
        key: 'actions',
        header: '',
      },
    ],
    [],
  );

  const renderAvailabilityCell = useCallback(
    (row: AvailabilityRow, cellId: string) => {
      if (cellId === 'startTime') {
        return (
          <div>
            <TimePickerInput
              id={`start-time-${row.id}`}
              testId={`start-time-${row.id}-test-id`}
              hideLabel
              invalid={!!row.errors.startTime}
              invalidText={row.errors.startTime ? t(row.errors.startTime) : ''}
              value={row.startTime}
              meridiem={row.startMeridiem}
              onChange={(time, meridiem) => {
                updateAvailabilityRow(row.id, 'startTime', time);
                updateAvailabilityRow(row.id, 'startMeridiem', meridiem);
              }}
            />
            {row.errors.overlap && (
              <div
                id={`overlap-${row.id}-error`}
                data-testid={`overlap-${row.id}-error-test-id`}
                aria-label={`overlap-${row.id}-error-aria-label`}
                className={styles.errorText}
              >
                {t(row.errors.overlap)}
              </div>
            )}
          </div>
        );
      }

      if (cellId === 'endTime') {
        return (
          <TimePickerInput
            id={`end-time-${row.id}`}
            testId={`end-time-${row.id}-test-id`}
            hideLabel
            invalid={!!row.errors.endTime}
            invalidText={row.errors.endTime ? t(row.errors.endTime) : ''}
            value={row.endTime}
            meridiem={row.endMeridiem}
            onChange={(time, meridiem) => {
              updateAvailabilityRow(row.id, 'endTime', time);
              updateAvailabilityRow(row.id, 'endMeridiem', meridiem);
            }}
          />
        );
      }

      if (cellId === 'maxLoad') {
        return (
          <NumberInput
            id={`max-load-${row.id}`}
            testId={`max-load-${row.id}-btn-test-id`}
            aria-label={`max-load-${row.id}-btn-aria-label`}
            label=""
            hideLabel
            value={row.maxLoad ?? undefined}
            min={0}
            onChange={(_, { value }) => {
              updateAvailabilityRow(row.id, 'maxLoad', Number(value));
            }}
          />
        );
      }

      if (cellId === 'daysOfWeek') {
        return (
          <div
            id={`days-of-week-${row.id}`}
            data-testid={`days-of-week-${row.id}-test-id`}
            aria-label={`days-of-week-${row.id}-aria-label`}
            className={styles.daysOfWeekCell}
          >
            <div>
              {DAYS_OF_WEEK.map((day) => (
                <IconButton
                  id={`days-of-week-${row.id}-${day}-btn`}
                  testId={`days-of-week-${row.id}-${day}-btn-test-id`}
                  aria-label={`days-of-week-${row.id}-${day}-btn-aria-label`}
                  key={day}
                  kind={row.daysOfWeek.includes(day) ? 'primary' : 'tertiary'}
                  label={t(`DAY_${day}`)}
                  size="md"
                  onClick={() => toggleDayOfWeek(row.id, day)}
                >
                  {day[0]}
                </IconButton>
              ))}
            </div>
            {row.errors.daysOfWeek && (
              <div
                id={`days-of-week-${row.id}-error`}
                data-testid={`days-of-week-${row.id}-test-id-error`}
                aria-label={`days-of-week-${row.id}-aria-label-error`}
                className={styles.errorText}
              >
                {t(row.errors.daysOfWeek)}
              </div>
            )}
          </div>
        );
      }

      return (
        <IconButton
          id={`remove-availability-service-row-${row.id}-btn`}
          testId={`remove-availability-service-row-${row.id}-btn-test-id`}
          aria-label={`remove-availability-service-row-${row.id}-btn-aria-label`}
          kind="ghost"
          label={t('ADMIN_ALL_SERVICES_REMOVE_ROW_ICON_LABEL')}
          onClick={() => removeAvailabilityRow(row.id)}
        >
          <Close />
        </IconButton>
      );
    },
    [],
  );

  return (
    <div
      id="add-appointment-availability-section"
      data-testid="add-appointment-availability-section-test-id"
      aria-label="add-appointment-availability-section-aria-label"
      className={styles.section}
    >
      <h3
        id="add-appointment-availability-section-title"
        data-testid="add-appointment-availability-section-title-test-id"
        aria-label="add-appointment-availability-section-title-aria-label"
      >
        {t('ADMIN_ADD_SERVICE_AVAILABILITY_TITLE')}
      </h3>
      <div className={styles.serviceAvailabilityTable}>
        <SortableDataTable
          headers={availabilityHeaders}
          rows={availabilityRows}
          ariaLabel="service-availability-table"
          sortable={availabilityHeaders.map((h) => ({
            key: h.key,
            sortable: false,
          }))}
          renderCell={renderAvailabilityCell}
          dataTestId="service-availability-table-test-id"
        />
      </div>
      <Button
        id="add-availability-row-btn"
        data-testid="add-availability-row-btn-test-id"
        aria-label="add-availability-row-btn-aria-label"
        kind="tertiary"
        onClick={addAvailabilityRow}
        className={styles.addRowBtn}
      >
        {t('ADMIN_ADD_SERVICE_ADD_ROW_BUTTON')}
      </Button>
    </div>
  );
};

export default AvailabilitySection;
