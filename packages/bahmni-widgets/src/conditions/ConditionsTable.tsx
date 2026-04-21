import { SortableDataTable, StatusTag, Tile } from '@bahmni/design-system';
import {
  getConditionPage,
  useTranslation,
  FormatDateResult,
  formatDateDistance,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { ConditionViewModel, ConditionStatus } from './models';
import styles from './styles/ConditionsTable.module.scss';
import { createConditionViewModels } from './utils';

// TODO: Take UUID As A Prop
/**
 * Component to display patient conditions using SortableDataTable
 */
const ConditionsTable: React.FC<WidgetProps> = ({ config }) => {
  // Number() safely handles non-numeric config values (NaN → falsy → fallback 10)
  const configPageSize = Number(config?.pageSize) || 10;
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(configPageSize);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['conditions', patientUUID!, currentPage, selectedPageSize],
    enabled: !!patientUUID,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const page = await getConditionPage(
        patientUUID!,
        selectedPageSize,
        currentPage,
      );
      return {
        conditions: createConditionViewModels(page.conditions),
        total: page.total,
      };
    },
  });

  // Listen to consultation saved events and refetch if conditions were updated
  useSubscribeConsultationSaved(
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Conditions were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  // Reset pagination when patient changes
  useEffect(() => {
    setCurrentPage(1);
  }, [patientUUID]);

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
  }, [isError, error, addNotification, t]);

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      if (newPageSize !== selectedPageSize) {
        // Page size changed: reset to page 1, re-fetch with new _count
        setSelectedPageSize(newPageSize);
        setCurrentPage(1);
      } else {
        // Offset-based pagination: any page can be fetched directly via
        // _getpagesoffset = (page - 1) * _count — no cursor cache needed
        setCurrentPage(newPage);
      }
    },
    [selectedPageSize],
  );

  const headers = useMemo(
    () => [
      { key: 'display', header: t('CONDITION_LIST_CONDITION') },
      { key: 'onsetDate', header: t('CONDITION_TABLE_DURATION') },
      { key: 'recorder', header: t('CONDITION_TABLE_RECORDED_BY') },
      { key: 'status', header: t('CONDITION_LIST_STATUS') },
    ],
    [t],
  );

  const renderCell = (condition: ConditionViewModel, cellId: string) => {
    switch (cellId) {
      case 'display':
        return (
          <span className={styles.conditionName}>{condition.display}</span>
        );
      case 'status':
        return (
          <StatusTag
            label={
              condition.status === ConditionStatus.Active
                ? t('CONDITION_LIST_ACTIVE')
                : t('CONDITION_LIST_INACTIVE')
            }
            dotClassName={
              condition.status === ConditionStatus.Active
                ? styles.activeStatus
                : styles.inactiveStatus
            }
            testId={`condition-status-${condition.code}`}
          />
        );
      case 'onsetDate': {
        const onsetDate: FormatDateResult = formatDateDistance(
          condition.onsetDate ?? '',
          t,
        );
        if (onsetDate.error) {
          return t('CONDITION_TABLE_NOT_AVAILABLE');
        }
        return t('CONDITION_ONSET_SINCE_FORMAT', {
          timeAgo: onsetDate.formattedResult,
        });
      }
      case 'recorder':
        return condition.recorder;
    }
  };

  return (
    <>
      {/* Recent and all Tabs will come inplace of Tile */}
      <Tile
        title={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
        data-testid="conditions-title"
        className={styles.conditionsTableTitle}
      >
        <p>{t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}</p>
      </Tile>
      <div data-testid="condition-table">
        <SortableDataTable
          headers={headers}
          ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
          rows={data?.conditions ?? []}
          loading={isLoading}
          errorStateMessage={isError ? error.message : null}
          emptyStateMessage={t('CONDITION_LIST_NO_CONDITIONS')}
          renderCell={renderCell}
          className={styles.conditionsTableBody}
          dataTestId="conditions-table"
          pageSize={selectedPageSize}
          totalItems={data?.total}
          page={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
};

export default ConditionsTable;
