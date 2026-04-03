import { ExpandableDataTable } from '@bahmni/design-system';
import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  ImmunizationStatus,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Immunization } from 'fhir/r4';
import React, { useMemo } from 'react';
import { NotAdministeredRow, toNotAdministeredRow } from './utils';

interface NotAdministeredTabProps {
  patientUUID: string | null;
}

const NotAdministeredTab: React.FC<NotAdministeredTabProps> = ({
  patientUUID,
}) => {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['immunizations', patientUUID, 'not-done'],
    queryFn: () =>
      getPatientImmunizations(patientUUID!, ImmunizationStatus.NotDone),
    enabled: !!patientUUID,
  });

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.immunizations
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
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

  const sortable = useMemo(
    () => [
      { key: 'code', sortable: true },
      { key: 'reason', sortable: false },
      { key: 'date', sortable: true },
      { key: 'recordedBy', sortable: true },
    ],
    [],
  );

  const rows = useMemo(
    () =>
      (data?.entry ?? [])
        .map((entry) => entry.resource as Immunization)
        .filter(Boolean)
        .map(toNotAdministeredRow),
    [data],
  );

  const renderCell = (row: NotAdministeredRow, key: string) => {
    switch (key) {
      case 'code':
        return row.code ?? '';
      case 'reason':
        return row.reason ?? '';
      case 'date':
        return row.date ? formatDateTime(row.date, t).formattedResult : '';
      case 'recordedBy':
        return row.recordedBy ?? '';
      default:
        return null;
    }
  };

  return (
    <ExpandableDataTable
      headers={headers}
      rows={rows}
      sortable={sortable}
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
