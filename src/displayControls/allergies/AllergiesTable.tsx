import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { FormattedAllergy } from '@types/allergy';
import { generateId } from '@utils/common';
import { getCategoryDisplayName } from '@utils/allergy';

/**
 * Component to display patient allergies in a DataTable with expandable rows
 */
const AllergiesTable: React.FC = () => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { allergies, loading, error } = useAllergies(patientUUID);

  // Define table headers
  const headers = useMemo(
    () => [
      { key: 'display', header: t('ALLERGEN') },
      { key: 'manifestation', header: t('REACTIONS') },
      { key: 'recorder', header: t('ALLERGY_LIST_RECORDED_BY') },
      { key: 'status', header: t('ALLERGY_LIST_STATUS') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'display', sortable: true },
      { key: 'manifestation', sortable: false },
      { key: 'recorder', sortable: true },
      { key: 'status', sortable: true },
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
        return `${allergy.display} [${t(getCategoryDisplayName(allergy.category?.[0]))}]`;
      case 'manifestation':
        return allergy.reactions
          ? allergy.reactions
              .map((reaction) => reaction.manifestation.join(', '))
              .join(', ')
          : t('ALLERGY_TABLE_NOT_AVAILABLE');
      case 'recorder':
        return allergy.recorder || t('ALLERGY_TABLE_NOT_AVAILABLE');
      case 'status':
        return (
          <Tag type={allergy.status === 'Active' ? 'green' : 'gray'}>
            {allergy.status === 'Active'
              ? t('ALLERGY_LIST_ACTIVE')
              : t('ALLERGY_LIST_INACTIVE')}
          </Tag>
        );
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
    <div data-testid="allergy-table">
      <ExpandableDataTable
        tableTitle={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        rows={formattedAllergies}
        headers={headers}
        sortable={sortable}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={loading}
        error={error}
        ariaLabel={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        emptyStateMessage={t('NO_ALLERGIES')}
        rowClassNames={rowClassNames}
      />
    </div>
  );
};

export default AllergiesTable;
