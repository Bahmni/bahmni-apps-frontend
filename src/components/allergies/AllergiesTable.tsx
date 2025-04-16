import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { ExpandableDataTable } from '@components/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { FormattedAllergy } from '@types/allergy';
import { formatDateTime } from '@utils/date';
import { generateId, capitalize } from '@utils/common';

/**
 * Component to display patient allergies in a DataTable with expandable rows
 */
const AllergiesTable: React.FC = () => {
  const patientUUID = usePatientUUID();
  const { allergies, loading, error } = useAllergies(patientUUID);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: 'Allergy' },
      { key: 'severity', header: 'Severity' },
      { key: 'manifestation', header: 'Reaction(s)' },
      { key: 'status', header: 'Status' },
      { key: 'recorder', header: 'Provider' },
      { key: 'recordedDate', header: 'Recorded Date' },
    ],
    [],
  );

  const sortable = useMemo(
    () => [
      { key: 'display', sortable: true },
      { key: 'severity', sortable: true },
      { key: 'manifestation', sortable: false },
      { key: 'status', sortable: true },
      { key: 'recorder', sortable: true },
      { key: 'recordedDate', sortable: true },
    ],
    [],
  );

  // Format allergies for display
  const formattedAllergies = useMemo(() => {
    if (!allergies || allergies.length === 0) return [];
    return formatAllergies(allergies);
  }, [allergies]);

  // Create row class names array for styling rows with severe allergies
  const rowClassNames = useMemo(() => {
    const classNames: Record<string, string> = {};

    formattedAllergies.forEach((allergy) => {
      if (allergy.id && allergy.severity && allergy.severity === 'severe') {
        classNames[allergy.id] = 'criticalCell';
      }
    });

    return classNames;
  }, [formattedAllergies]);

  // Function to render cell content based on the cell ID
  const renderCell = (allergy: FormattedAllergy, cellId: string) => {
    switch (cellId) {
      case 'display':
        return allergy.display;
      case 'status':
        return (
          <Tag type={allergy.status === 'Active' ? 'green' : 'gray'}>
            {allergy.status}
          </Tag>
        );
      case 'manifestation':
        return allergy.reactions
          ? allergy.reactions
              .map((reaction) => reaction.manifestation.join(', '))
              .join(', ')
          : 'Not available';
      case 'severity':
        return capitalize(allergy.severity || 'Unknown');
      case 'recorder':
        return allergy.recorder || 'Not available';
      case 'recordedDate': {
        const recordedDate = formatDateTime(allergy.recordedDate || '');
        return recordedDate.formattedResult || 'Not available';
      }
    }
  };

  // Function to render expanded content for an allergy
  const renderExpandedContent = (allergy: FormattedAllergy) => {
    if (allergy.note && allergy.note.length > 0) {
      return (
        <p style={{ padding: '0.5rem' }} key={generateId()}>
          {allergy.note.join(', ')}
        </p>
      );
    }
    return undefined;
  };

  return (
    <div
      style={{ width: '100%', paddingTop: '1rem' }}
      data-testid="allergy-table"
    >
      <ExpandableDataTable
        tableTitle="Allergies"
        rows={formattedAllergies}
        headers={headers}
        sortable={sortable}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        error={error}
        ariaLabel="Patient allergies"
        emptyStateMessage="No allergies found"
        rowClassNames={rowClassNames}
      />
    </div>
  );
};

export default AllergiesTable;
