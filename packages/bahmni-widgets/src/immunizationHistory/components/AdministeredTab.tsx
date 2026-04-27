import {
  ExpandableDataTable,
  TableExpandedRow,
  TooltipIcon,
} from '@bahmni/design-system';
import {
  ConsultationSavedEventPayload,
  formatDateTime,
  getPatientImmunizations,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { AdministeredImmunizationViewModel } from '../model';
import styles from '../styles/Immunizations.module.scss';
import { createAdministeredImmunizationViewModel } from '../utils';

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

const fetchAdministeredImmunizations = async (
  patientUUID: string,
): Promise<AdministeredImmunizationViewModel[]> => {
  const immunizations = await getPatientImmunizations(patientUUID, 'completed');
  return immunizations.map(createAdministeredImmunizationViewModel);
};

const AdministeredTab: React.FC<AdministeredTabProps> = ({ patientUUID }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['immunizations', patientUUID, 'completed'],
    queryFn: () => fetchAdministeredImmunizations(patientUUID),
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
      {
        key: 'doseSequence',
        header: t('IMMUNIZATION_HISTORY_WIDGET_COL_DOSE_SEQUENCE'),
      },
      {
        key: 'drugName',
        header: t('IMMUNIZATION_HISTORY_WIDGET_COL_DRUG_NAME'),
      },
      {
        key: 'administeredOn',
        header: t('IMMUNIZATION_HISTORY_WIDGET_COL_ADMINISTERED_ON'),
      },
      {
        key: 'administeredLocation',
        header: t('IMMUNIZATION_HISTORY_WIDGET_COL_ADMINISTERED_LOCATION'),
      },
    ],
    [t],
  );

  const renderCell = (row: AdministeredImmunizationViewModel, key: string) => {
    if (key === 'code') {
      return (
        <div className={styles.code}>
          <span>{row.code ?? '-'}</span>
          {row.notes && (
            <TooltipIcon
              iconName="fa-file-lines"
              content={row.notes}
              ariaLabel={row.notes}
            />
          )}
        </div>
      );
    }
    if (key === 'administeredOn') {
      return row.administeredOn
        ? formatDateTime(row.administeredOn, t).formattedResult
        : '-';
    }
    return row[key as keyof AdministeredImmunizationViewModel] ?? '-';
  };

  const renderExpandedContent = (row: AdministeredImmunizationViewModel) => {
    if (!row.hasDetails) return null;

    const details: { label: string; value: string }[] = [
      row.route && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_ROUTE'),
        value: row.route,
      },
      row.site && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_SITE'),
        value: row.site,
      },
      row.manufacturer && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_MANUFACTURER'),
        value: row.manufacturer,
      },
      row.batchNumber && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_BATCH_NUMBER'),
        value: row.batchNumber,
      },
      row.recordedBy && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_RECORDED_BY'),
        value: row.recordedBy,
      },
      row.orderedBy && {
        label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_ORDERED_BY'),
        value: row.orderedBy,
      },
    ].filter((detail): detail is { label: string; value: string } =>
      Boolean(detail),
    );

    return (
      <TableExpandedRow colSpan={headers.length + 1}>
        <div
          id={`immunization-expanded-row-${row.id}`}
          data-testid={`immunization-expanded-row-${row.id}-test-id`}
        >
          {details.length > 0 && (
            <p
              id={`immunization-expanded-row-details-${row.id}`}
              data-testid={`immunization-expanded-row-details-${row.id}-test-id`}
              className={styles.expandedRowContent}
            >
              {details.map((detail) => (
                <span key={detail.label}>
                  <strong>{detail.label}</strong>
                  {' : '}
                  {detail.value}
                </span>
              ))}
            </p>
          )}
        </div>
      </TableExpandedRow>
    );
  };

  return (
    <div
      id="immunization-administered-tab"
      data-testid="immunization-administered-tab-test-id"
    >
      <ExpandableDataTable
        headers={headers}
        rows={data}
        dataTestId="administered-immunizations-table"
        sortable={COLUMN_SORT_CONFIG}
        ariaLabel={t('IMMUNIZATION_HISTORY_WIDGET_ADMINISTERED_TABLE_ARIA')}
        loading={isLoading}
        errorStateMessage={
          isError ? t('IMMUNIZATION_HISTORY_WIDGET_ERROR_FETCHING_DATA') : null
        }
        emptyStateMessage={t(
          'IMMUNIZATION_HISTORY_WIDGET_NO_IMMUNIZATIONS_RECORDED',
        )}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />
    </div>
  );
};

export default AdministeredTab;
