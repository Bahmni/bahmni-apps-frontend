import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { DotMark } from '@carbon/icons-react';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import { ConditionStatus, FormattedCondition } from '@types/condition';
import { formatDateDistance } from '@utils/date';
import { FormatDateResult } from '@types/date';
import * as styles from './styles/ConditionsTable.module.scss';

/**
 * Component to display patient conditions in a DataTable with expandable rows
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

  // Format conditions for display
  const formattedConditions = useMemo(() => {
    if (!conditions || conditions.length === 0) return [];
    return formatConditions(conditions);
  }, [conditions]);

  // Function to render cell content based on the cell ID
  const renderCell = (condition: FormattedCondition, cellId: string) => {
    switch (cellId) {
      case 'display':
        return condition.display;
      case 'status':
        return (
          <Tag
            type="outline"
            renderIcon={DotMark}
            className={
              condition.status === ConditionStatus.Active
                ? styles.activeStatus
                : styles.inactiveStatus
            }
          >
            {condition.status === ConditionStatus.Active
              ? t('CONDITION_LIST_ACTIVE')
              : t('CONDITION_LIST_INACTIVE')}
          </Tag>
        );
      case 'onsetDate': {
        const onsetDate: FormatDateResult = formatDateDistance(
          condition.onsetDate || '',
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

  // Function to render expanded content for a condition
  const renderExpandedContent = (condition: FormattedCondition) => {
    if (condition.note && condition.note.length > 0) {
      return (
        <p className={styles.conditionsNote} key={condition.id}>
          {condition.note.join(', ')}
        </p>
      );
    }
    return undefined;
  };

  return (
    <div data-testid="condition-table">
      <ExpandableDataTable
        tableTitle={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
        rows={formattedConditions}
        headers={headers}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        error={error}
        ariaLabel={t('CONDITION_LIST_DISPLAY_CONTROL_TITLE')}
        emptyStateMessage={t('CONDITION_LIST_NO_CONDITIONS')}
        className={styles.conditionsTableBody}
      />
    </div>
  );
};

export default ConditionsTable;
