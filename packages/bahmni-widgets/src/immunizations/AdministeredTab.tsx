import { ExpandableDataTable } from '@bahmni/design-system';
import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Immunization } from 'fhir/r4';
import React, { useMemo } from 'react';
import ImmunizationExpandedRow from './ImmunizationExpandedRow';
import {
  AdministeredRow,
  hasAdministeredRowDetails,
  toAdministeredRow,
} from './utils';

interface AdministeredTabProps {
  patientUUID: string;
}

const COLUMN_SORT_CONFIG = [
  { key: 'code', sortable: true },
  { key: 'doseSequence', sortable: false },
  { key: 'drugName', sortable: false },
  { key: 'administeredOn', sortable: true },
  { key: 'administeredLocation', sortable: true },
];

const AdministeredTab: React.FC<AdministeredTabProps> = ({ patientUUID }) => {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['immunizations', patientUUID, 'completed'],
    queryFn: () => getPatientImmunizations(patientUUID, 'completed'),
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
      {
        key: 'doseSequence',
        header: t('IMMUNIZATION_WIDGET_COL_DOSE_SEQUENCE'),
      },
      { key: 'drugName', header: t('IMMUNIZATION_WIDGET_COL_DRUG_NAME') },
      {
        key: 'administeredOn',
        header: t('IMMUNIZATION_WIDGET_COL_ADMINISTERED_ON'),
      },
      {
        key: 'administeredLocation',
        header: t('IMMUNIZATION_WIDGET_COL_ADMINISTERED_LOCATION'),
      },
    ],
    [t],
  );

  const rows = useMemo(
    () =>
      (data?.entry ?? [])
        .map((entry) => entry.resource as Immunization)
        .map(toAdministeredRow),
    [data],
  );

  const renderCell = (row: AdministeredRow, key: string) => {
    if (key === 'administeredOn') {
      return row.administeredOn
        ? formatDateTime(row.administeredOn, t).formattedResult
        : '-';
    }
    return row[key as keyof AdministeredRow] ?? '-';
  };

  return (
    <ExpandableDataTable
      headers={headers}
      rows={rows}
      sortable={COLUMN_SORT_CONFIG}
      ariaLabel={t('IMMUNIZATION_WIDGET_ADMINISTERED_TABLE_ARIA')}
      loading={isLoading}
      errorStateMessage={
        isError ? t('IMMUNIZATION_WIDGET_ERROR_FETCHING_DATA') : null
      }
      emptyStateMessage={t('IMMUNIZATION_WIDGET_NO_IMMUNIZATIONS_RECORDED')}
      renderCell={renderCell}
      renderExpandedContent={(row) =>
        hasAdministeredRowDetails(row) ? (
          <ImmunizationExpandedRow row={row} />
        ) : null
      }
      dataTestId="administered-immunizations-table"
    />
  );
};

export default AdministeredTab;
