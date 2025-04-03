import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { ExpandableDataTable } from '@components/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import { ConditionStatus, FormattedCondition } from '@types/condition';
import { formatDateTime } from '@utils/date';

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
  const patientUUID = usePatientUUID();
  const { conditions, loading, error } = useConditions(patientUUID);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: 'Condition' },
      { key: 'status', header: 'Status' },
      { key: 'onsetDate', header: 'Onset Date' },
      { key: 'recorder', header: 'Provider' },
      { key: 'recordedDate', header: 'Recorded Date' },
    ],
    [],
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
            {condition.status}
          </Tag>
        );
      case 'onsetDate':
        return formatDateTime(condition.onsetDate || '');
      case 'recorder':
        return condition.recorder || 'Not available';
      case 'recordedDate':
        return formatDateTime(condition.recordedDate || '');
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
    <div
      style={{ width: '100%', paddingTop: '1rem' }}
      data-testid="condition-table"
    >
      <ExpandableDataTable
        tableTitle="Conditions"
        rows={formattedConditions}
        headers={headers}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        error={error}
        ariaLabel="Patient conditions"
        emptyStateMessage="No conditions found"
      />
    </div>
  );
};

export default ConditionsTable;
