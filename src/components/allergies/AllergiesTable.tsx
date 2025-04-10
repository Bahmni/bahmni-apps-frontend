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
      { key: 'manifestation', header: 'Reaction(s)' },
      { key: 'status', header: 'Status' },
      { key: 'severity', header: 'Severity' },
      { key: 'recorder', header: 'Provider' },
      { key: 'recordedDate', header: 'Recorded Date' },
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
    return formattedAllergies.map((allergy) =>
      allergy.reactions?.some((reaction) => reaction.severity === 'severe')
        ? 'criticalCell'
        : '',
    );
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
        return allergy.reactions
          ? allergy.reactions
              .map((reaction) => reaction.severity)
              .filter((severity): severity is string => !!severity)
              .map((severity) => capitalize(severity))
              .join(', ')
          : 'Not available';
      case 'recorder':
        return allergy.recorder || 'Not available';
      case 'recordedDate':
        return formatDateTime(allergy.recordedDate || '');
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
