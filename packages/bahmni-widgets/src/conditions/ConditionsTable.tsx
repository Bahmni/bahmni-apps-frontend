import {
  SortableDataTable,
  StatusTag,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  useTranslation,
  ConditionStatus,
  FormatDateResult,
  FormattedCondition,
  formatDateDistance,
} from '@bahmni-frontend/bahmni-services';
import React, { useMemo } from 'react';
import styles from './styles/ConditionsTable.module.scss';
import { useConditions } from './useConditions';

/**
 * Component to display patient conditions using SortableDataTable
 */
const ConditionsTable: React.FC = () => {
  const { t } = useTranslation();
  const { conditions, loading, error } = useConditions();

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('CONDITION_LIST_CONDITION') },
      { key: 'onsetDate', header: t('CONDITION_TABLE_DURATION') },
      { key: 'recorder', header: t('CONDITION_TABLE_RECORDED_BY') },
      { key: 'status', header: t('CONDITION_LIST_STATUS') },
    ],
    [t],
  );

  // Function to render cell content based on the cell ID
  const renderCell = (condition: FormattedCondition, cellId: string) => {
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
      default:
        return null;
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
          loading={loading}
          errorStateMessage={error?.message}
          emptyStateMessage={t('CONDITION_LIST_NO_CONDITIONS')}
          renderCell={renderCell}
          className={styles.conditionsTableBody}
        />
      </div>
    </>
  );
};

export default ConditionsTable;
