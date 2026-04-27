import { SortableDataTable } from '@bahmni/design-system';
import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { NotAdministeredImmunizationViewModel } from '../model';
import styles from '../styles/Immunizations.module.scss';
import { createNotAdministeredImmunizationViewModel } from '../utils';

interface NotAdministeredTabProps {
  patientUUID: string;
}

const COLUMN_SORT_CONFIG = [
  { key: 'code', sortable: true },
  { key: 'reason', sortable: false },
  { key: 'date', sortable: true },
  { key: 'recordedBy', sortable: true },
];

const fetchNotAdministeredImmunizations = async (
  patientUUID: string,
): Promise<NotAdministeredImmunizationViewModel[]> => {
  const immunizations = await getPatientImmunizations(patientUUID, 'not-done');
  return immunizations.map(createNotAdministeredImmunizationViewModel);
};

const NotAdministeredTab: React.FC<NotAdministeredTabProps> = ({
  patientUUID,
}) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['immunizations', patientUUID, 'not-done'],
    queryFn: () => fetchNotAdministeredImmunizations(patientUUID),
    enabled: !!patientUUID,
  });

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.immunizationHistory
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  const headers = useMemo(
    () => [
      { key: 'code', header: t('IMMUNIZATION_HISTORY_WIDGET_COL_CODE') },
      { key: 'reason', header: t('IMMUNIZATION_HISTORY_WIDGET_COL_REASON') },
      { key: 'date', header: t('IMMUNIZATION_HISTORY_WIDGET_COL_DATE') },
      {
        key: 'recordedBy',
        header: t('IMMUNIZATION_HISTORY_WIDGET_COL_RECORDED_BY'),
      },
    ],
    [t],
  );

  const renderCell = (
    row: NotAdministeredImmunizationViewModel,
    key: string,
  ) => {
    if (key === 'code') {
      return <span className={styles.code}>{row.code ?? '-'}</span>;
    }
    if (key === 'date') {
      return row.date ? formatDateTime(row.date, t).formattedResult : '-';
    }
    return row[key as keyof NotAdministeredImmunizationViewModel] ?? '-';
  };

  return (
    <div
      id="immunization-not-administered-tab"
      data-testid="immunization-not-administered-tab-test-id"
    >
      <SortableDataTable
        headers={headers}
        rows={data}
        sortable={COLUMN_SORT_CONFIG}
        ariaLabel={t('IMMUNIZATION_HISTORY_WIDGET_NOT_ADMINISTERED_TABLE_ARIA')}
        loading={isLoading}
        errorStateMessage={
          isError ? t('IMMUNIZATION_HISTORY_WIDGET_ERROR_FETCHING_DATA') : null
        }
        emptyStateMessage={t(
          'IMMUNIZATION_HISTORY_WIDGET_NO_IMMUNIZATIONS_RECORDED',
        )}
        renderCell={renderCell}
        dataTestId="not-administered-immunizations-table"
      />
    </div>
  );
};

export default NotAdministeredTab;
