import {
  DataTable,
  TableExpandedRow,
  TooltipIcon,
  type DataTableColumn,
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
import {
  ADMINISTERED_COLUMN_FILTERABILITY,
  ADMINISTERED_COLUMN_FILTER_TYPE,
  ADMINISTERED_COLUMN_GROUPABILITY,
  ADMINISTERED_COLUMN_SORTABILITY,
} from '../constants';
import {
  AdministeredImmunizationViewModel,
  AdministeredTabConfig,
} from '../model';
import styles from '../styles/Immunizations.module.scss';
import { createAdministeredImmunizationViewModel } from '../utils';

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

const isoToTimestamp = (value: string | null): number | null =>
  value ? new Date(value).getTime() : null;

const buildColumns = (
  fields: string[],
  t: (key: string) => string,
): DataTableColumn<AdministeredImmunizationViewModel>[] =>
  fields.map((field) => {
    const filterType = ADMINISTERED_COLUMN_FILTER_TYPE[field];
    return {
      key: field,
      header: t(
        `IMMUNIZATION_HISTORY_WIDGET_COL_${field
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toUpperCase()}`,
      ),
      enableSorting: ADMINISTERED_COLUMN_SORTABILITY[field] ?? false,
      enableFiltering: ADMINISTERED_COLUMN_FILTERABILITY[field] ?? false,
      filterType,
      enableGrouping: ADMINISTERED_COLUMN_GROUPABILITY[field] ?? false,
      defaultSortDirection: field === 'administeredOn' ? 'desc' : undefined,
    };
  });

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

  const columns = useMemo(
    () => buildColumns(config.columns, t),
    [config.columns, t],
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

  const accessor = (row: AdministeredImmunizationViewModel, key: string) => {
    if (key === 'administeredOn') {
      return isoToTimestamp(row.administeredOn);
    }
    return row[key as keyof AdministeredImmunizationViewModel] ?? null;
  }
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
        expiryDate: {
          label: t('IMMUNIZATION_HISTORY_WIDGET_DETAIL_EXPIRY_DATE'),
          value: row.expiryDate
            ? formatDateTime(row.expiryDate, t).formattedResult
            : null,
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
      <TableExpandedRow colSpan={config.columns.length + 1}>
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
      <DataTable
        columns={columns}
        rows={data ?? []}
        dataTestId="administered-immunizations-table"
        ariaLabel={t('IMMUNIZATION_HISTORY_WIDGET_ADMINISTERED_TABLE_ARIA')}
        loading={isLoading}
        errorStateMessage={
          isError ? t('IMMUNIZATION_HISTORY_WIDGET_ERROR_FETCHING_DATA') : null
        }
        emptyStateMessage={t(
          'IMMUNIZATION_HISTORY_WIDGET_NO_IMMUNIZATIONS_RECORDED',
        )}
        renderCell={renderCell}
        accessor={accessor}
        className={styles.table}
        renderExpandedContent={renderExpandedContent}
        shouldRowBeExpandable={(row) => row.hasDetails}
        enableGlobalSearch
        globalSearchPlaceholder="Search immunizations"
        enablePagination
        pageSize={10}
        actionButton={{
          label: "Add Immunization",
          onClick: () => {
            console.log('Add Immunization clicked');
          }
        }}
      />
    </div>
  );
};

export default AdministeredTab;
