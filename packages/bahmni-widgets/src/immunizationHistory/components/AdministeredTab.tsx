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
import { ADMINISTERED_COLUMN_SORTABILITY } from '../constants';
import {
  AdministeredImmunizationViewModel,
  AdministeredTabConfig,
} from '../model';
import styles from '../styles/Immunizations.module.scss';
import {
  createAdministeredImmunizationViewModel,
  createColumnSortConfig,
  createImmunizationHeaders,
} from '../utils';

interface AdministeredTabProps {
  patientUUID: string;
  config: AdministeredTabConfig;
}

const fetchAdministeredImmunizations = async (
  patientUUID: string,
): Promise<AdministeredImmunizationViewModel[]> => {
  const immunizations = await getPatientImmunizations(patientUUID, 'completed');
  return immunizations.map(createAdministeredImmunizationViewModel);
};

const AdministeredTab: React.FC<AdministeredTabProps> = ({
  patientUUID,
  config,
}) => {
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
    () => createImmunizationHeaders(config.columns, t),
    [config.columns, t],
  );

  const sortable = useMemo(
    () =>
      createColumnSortConfig(config.columns, ADMINISTERED_COLUMN_SORTABILITY),
    [config.columns],
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

    const allDetails: Record<string, { label: string; value: string | null }> =
      {
        route: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_ROUTE'),
          value: row.route,
        },
        site: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_SITE'),
          value: row.site,
        },
        manufacturer: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_MANUFACTURER'),
          value: row.manufacturer,
        },
        batchNumber: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_BATCH_NUMBER'),
          value: row.batchNumber,
        },
        recordedBy: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_RECORDED_BY'),
          value: row.recordedBy,
        },
        orderedBy: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_ORDERED_BY'),
          value: row.orderedBy,
        },
      };

    const details = config.expandedFields
      .map((field) => allDetails[field])
      .filter((d): d is { label: string; value: string } => Boolean(d?.value));

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
        sortable={sortable}
        ariaLabel={t('IMMUNIZATION_HISTORY_WIDGET_ADMINISTERED_TABLE_ARIA')}
        loading={isLoading}
        errorStateMessage={
          isError ? t('IMMUNIZATION_HISTORY_WIDGET_ERROR_FETCHING_DATA') : null
        }
        emptyStateMessage={t(
          'IMMUNIZATION_HISTORY_WIDGET_NO_IMMUNIZATIONS_RECORDED',
        )}
        renderCell={renderCell}
        className={styles.table}
        renderExpandedContent={renderExpandedContent}
      />
    </div>
  );
};

export default AdministeredTab;
