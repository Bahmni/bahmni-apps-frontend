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
import { NOT_ADMINISTERED_COLUMN_SORTABILITY } from '../constants';
import {
  NotAdministeredImmunizationViewModel,
  NotAdministeredTabConfig,
} from '../model';
import styles from '../styles/Immunizations.module.scss';
import {
  createColumnSortConfig,
  createImmunizationHeaders,
  createNotAdministeredImmunizationViewModel,
} from '../utils';

interface NotAdministeredTabProps {
  patientUUID: string;
  config: NotAdministeredTabConfig;
}

const fetchNotAdministeredImmunizations = async (
  patientUUID: string,
): Promise<NotAdministeredImmunizationViewModel[]> => {
  const immunizations = await getPatientImmunizations(patientUUID, 'not-done');
  return immunizations.map(createNotAdministeredImmunizationViewModel);
};

const NotAdministeredTab: React.FC<NotAdministeredTabProps> = ({
  patientUUID,
  config,
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
    () => createImmunizationHeaders(config.columns, t),
    [config.columns, t],
  );

  const sortable = useMemo(
    () =>
      createColumnSortConfig(
        config.columns,
        NOT_ADMINISTERED_COLUMN_SORTABILITY,
      ),
    [config.columns],
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
        sortable={sortable}
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
        className={styles.table}
      />
    </div>
  );
};

export default NotAdministeredTab;
