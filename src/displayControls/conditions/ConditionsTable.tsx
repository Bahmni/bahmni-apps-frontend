import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import { ConditionStatus, FormattedCondition } from '@types/condition';
import { formatDate, formatDateTime } from '@utils/date';
import { FormatDateResult } from '@types/date';

/**
 * Maps condition status to appropriate tag type
 * @param status - The condition status
 * @returns The tag type for the status
 */
const getStatusTagType = (status: ConditionStatus): 'green' | 'gray' => {
  switch (status) {
    case ConditionStatus.Active:
      return 'green';
    case ConditionStatus.Inactive:
    default:
      return 'gray';
  }
};

/**
 * Component to display patient conditions in a DataTable with expandable rows
 */
const ConditionsTable: React.FC = () => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { conditions, loading, error } = useConditions(patientUUID);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('CONDITION_LIST_CONDITION') },
      { key: 'status', header: t('CONDITION_LIST_STATUS') },
      { key: 'onsetDate', header: t('CONDITION_TABLE_ONSET_DATE') },
      { key: 'recorder', header: t('CONDITION_TABLE_PROVIDER') },
      { key: 'recordedDate', header: t('CONDITION_TABLE_RECORDED_DATE') },
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
          <Tag type={getStatusTagType(condition.status)}>
            {condition.status == ConditionStatus.Active
              ? t('CONDITION_LIST_ACTIVE')
              : t('CONDITION_LIST_INACTIVE')}
          </Tag>
        );
      case 'onsetDate': {
        const onsetDate: FormatDateResult = formatDate(
          condition.onsetDate || '',
        );
        return onsetDate.formattedResult || t('CONDITION_TABLE_NOT_AVAILABLE');
      }
      case 'recorder':
        return condition.recorder || t('CONDITION_TABLE_NOT_AVAILABLE');
      case 'recordedDate': {
        const recordedDate: FormatDateResult = formatDateTime(
          condition.recordedDate || '',
        );
        return (
          recordedDate.formattedResult || t('CONDITION_TABLE_NOT_AVAILABLE')
        );
      }
    }
  };

  // Function to render expanded content for a condition
  const renderExpandedContent = (condition: FormattedCondition) => {
    if (condition.note && condition.note.length > 0) {
      return condition.note.map((note, index) => (
        <p style={{ padding: '0.5rem' }} key={index}>
          {note}
        </p>
      ));
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
      />
    </div>
  );
};

export default ConditionsTable;
