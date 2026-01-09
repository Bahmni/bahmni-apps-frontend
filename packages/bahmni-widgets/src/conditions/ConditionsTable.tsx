import { SortableDataTable, StatusTag, Tile } from '@bahmni/design-system';
import {
  getConditions,
  useTranslation,
  FormatDateResult,
  formatDateDistance,
  useConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { ConditionViewModel, ConditionStatus } from './models';
import styles from './styles/ConditionsTable.module.scss';
import { createConditionViewModels } from './utils';

//TODO: Figure out a better place to create Query Keys
export const conditionsQueryKeys = (patientUUID: string) =>
  ['conditions', patientUUID] as const;

const fetchConditions = async (
  patientUUID: string,
): Promise<ConditionViewModel[]> => {
  const response = await getConditions(patientUUID!);
  return createConditionViewModels(response);
};

// TODO: Take UUID As A Prop
/**
 * Component to display patient conditions using SortableDataTable
 */
const ConditionsTable: React.FC = () => {
  const [conditions, setConditions] = useState<ConditionViewModel[]>([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: conditionsQueryKeys(patientUUID!),
    enabled: !!patientUUID,
    queryFn: () => fetchConditions(patientUUID!),
  });

  // Listen to consultation saved events and refetch if conditions were updated
  useConsultationSaved(
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Conditions were modified during consultation
      // eslint-disable-next-line no-console
      console.log('Received consultation saved event:', payload);
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.conditions
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    if (data) setConditions(data);
  }, [data, isLoading, isError, error]);

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
          rows={conditions}
          loading={isLoading}
          errorStateMessage={isError ? error.message : null}
          emptyStateMessage={t('CONDITION_LIST_NO_CONDITIONS')}
          renderCell={renderCell}
          className={styles.conditionsTableBody}
        />
      </div>
    </>
  );
};

export default ConditionsTable;
