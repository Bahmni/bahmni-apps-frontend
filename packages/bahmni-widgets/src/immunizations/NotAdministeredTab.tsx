import { SortableDataTable } from '@bahmni/design-system';
import { formatDateTime, useTranslation } from '@bahmni/services';
import { Immunization } from 'fhir/r4';
import React, { useMemo } from 'react';
import { usePatientImmunizationQuery } from './hooks/usePatientImmunizationQuery';
import { NotAdministeredRow, toNotAdministeredRow } from './utils';

interface NotAdministeredTabProps {
  patientUUID: string;
}

const COLUMN_SORT_CONFIG = [
  { key: 'code', sortable: true },
  { key: 'reason', sortable: false },
  { key: 'date', sortable: true },
  { key: 'recordedBy', sortable: true },
];

const NotAdministeredTab: React.FC<NotAdministeredTabProps> = ({
  patientUUID,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = usePatientImmunizationQuery(
    patientUUID,
    'not-done',
  );

  const headers = useMemo(
    () => [
      { key: 'code', header: t('IMMUNIZATION_WIDGET_COL_CODE') },
      { key: 'reason', header: t('IMMUNIZATION_WIDGET_COL_REASON') },
      { key: 'date', header: t('IMMUNIZATION_WIDGET_COL_DATE') },
      { key: 'recordedBy', header: t('IMMUNIZATION_WIDGET_COL_RECORDED_BY') },
    ],
    [t],
  );

  const rows = useMemo(
    () =>
      (data?.entry ?? [])
        .map((entry) => entry.resource as Immunization)
        .map(toNotAdministeredRow),
    [data],
  );

  const renderCell = (row: NotAdministeredRow, key: string) => {
    if (key === 'date') {
      return row.date ? formatDateTime(row.date, t).formattedResult : '-';
    }
    return row[key as keyof NotAdministeredRow] ?? '-';
  };

  return (
    <SortableDataTable
      headers={headers}
      rows={rows}
      sortable={COLUMN_SORT_CONFIG}
      ariaLabel={t('IMMUNIZATION_WIDGET_NOT_ADMINISTERED_TABLE_ARIA')}
      loading={isLoading}
      errorStateMessage={
        isError ? t('IMMUNIZATION_WIDGET_ERROR_FETCHING_DATA') : null
      }
      emptyStateMessage={t('IMMUNIZATION_WIDGET_NO_IMMUNIZATIONS_RECORDED')}
      renderCell={renderCell}
      dataTestId="not-administered-immunizations-table"
    />
  );
};

export default NotAdministeredTab;
