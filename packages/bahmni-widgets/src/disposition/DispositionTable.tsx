import { DataTable } from '@bahmni/design-system';
import {
  formatDateTime,
  getCategoryUuidFromOrderTypes,
  getFormattedError,
  getServiceRequests,
  getUserPreferredLocale,
  shouldEnableEncounterFilter,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { DispositionViewModel } from './models';
import styles from './styles/DispositionTable.module.scss';
import {
  DISPOSITION_ORDER_TYPE,
  fetchDispositionTypeNames,
  mapDispositions,
} from './utils';

const TIME_FORMAT = 'h:mm a';

export const dispositionQueryKeys = (
  categoryUuid: string | null | undefined,
  patientUUID: string | null | undefined,
  encounterUuids?: string[],
) => ['disposition', categoryUuid, patientUUID, encounterUuids] as const;

const DispositionTable: React.FC<WidgetProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const orderType = (config?.orderType as string) || DISPOSITION_ORDER_TYPE;

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: categoryUuid,
    isLoading: isLoadingCategory,
    isError: isCategoryError,
    error: categoryError,
  } = useQuery({
    queryKey: ['categoryUuid', orderType],
    queryFn: () => getCategoryUuidFromOrderTypes(orderType),
  });

  const {
    data,
    isLoading: isLoadingDispositions,
    isError: isDispositionsError,
    error: dispositionsError,
    refetch,
  } = useQuery({
    queryKey: dispositionQueryKeys(categoryUuid, patientUUID, encounterUuids),
    enabled: !!patientUUID && !!categoryUuid,
    queryFn: async () =>
      mapDispositions(
        await getServiceRequests(categoryUuid!, patientUUID!, encounterUuids),
      ),
  });

  const { data: typeNames } = useQuery({
    queryKey: ['dispositionTypeNames', getUserPreferredLocale()],
    queryFn: fetchDispositionTypeNames,
    staleTime: Infinity,
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.serviceRequests?.[orderType.toLowerCase()]
      ) {
        refetch();
      }
    },
    [patientUUID, orderType],
  );

  useEffect(() => {
    const failure = isCategoryError
      ? categoryError
      : isDispositionsError
        ? dispositionsError
        : undefined;
    if (failure) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: getFormattedError(failure).message,
        type: 'error',
      });
    }
  }, [
    isCategoryError,
    categoryError,
    isDispositionsError,
    dispositionsError,
    addNotification,
    t,
  ]);

  const isLoading = isLoadingCategory || isLoadingDispositions;
  const isError = isCategoryError || isDispositionsError;
  const error = categoryError ?? dispositionsError;
  const rows = useMemo(
    () =>
      emptyEncounterFilter
        ? []
        : (data ?? []).map((row) => ({
            ...row,
            type: typeNames?.get(row.conceptUuid ?? '') ?? row.type,
          })),
    [emptyEncounterFilter, data, typeNames],
  );

  const headers = useMemo(
    () => [
      { key: 'type', header: t('DISPOSITION_TYPE_LABEL') },
      { key: 'date', header: t('DISPOSITION_DATE_LABEL') },
      { key: 'notes', header: t('DISPOSITION_NOTES_LABEL') },
      { key: 'recordedTime', header: t('DISPOSITION_RECORDED_TIME') },
      { key: 'recordedBy', header: t('DISPOSITION_RECORDED_BY') },
    ],
    [t],
  );

  const renderCell = useCallback(
    (row: DispositionViewModel, cellId: string) => {
      switch (cellId) {
        case 'type':
          return row.type;
        case 'date':
          return row.date ? formatDateTime(row.date, t).formattedResult : '-';
        case 'notes':
          return row.notes ?? '-';
        case 'recordedTime':
          return row.recordedTime
            ? formatDateTime(row.recordedTime, t, false, TIME_FORMAT)
                .formattedResult
            : '-';
        case 'recordedBy':
          return row.recordedBy ?? '-';
        default:
          return null;
      }
    },
    [t],
  );

  return (
    <div id="disposition-table" data-testid="disposition-table">
      <DataTable
        columns={headers}
        rows={rows}
        ariaLabel={t('DISPOSITION_FORM_TITLE')}
        loading={isLoading}
        errorStateMessage={isError ? error?.message : undefined}
        emptyStateMessage={t('NO_DISPOSITIONS')}
        renderCell={renderCell}
        className={styles.dispositionTable}
        dataTestId="disposition-table-data"
      />
    </div>
  );
};

export default DispositionTable;
