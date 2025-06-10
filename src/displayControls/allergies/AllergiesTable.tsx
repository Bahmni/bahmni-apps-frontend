import React, { useMemo } from 'react';
import { Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { FormattedAllergy } from '@types/allergy';
import { generateId } from '@utils/common';
import { DotMark } from '@carbon/icons-react';
import { getCategoryDisplayName, getSeverityDisplayName } from '@utils/allergy';
import * as styles from './styles/AllergiesTable.module.scss';

// Helper function to get severity CSS class
const getSeverityClassName = (severity: string): string | undefined => {
  switch (severity?.toLowerCase()) {
    case 'mild':
      return styles.mildSeverity;
    case 'moderate':
      return styles.moderateSeverity;
    case 'severe':
      return styles.severeSeverity;
  }
};

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

  // Function to render cell content based on the cell ID
  const renderCell = (allergy: FormattedAllergy, cellId: string) => {
    switch (cellId) {
      case 'display':
        return (
          <>
            {`${allergy.display} [${t(getCategoryDisplayName(allergy.category?.[0]))}] `}
            <Tag className={getSeverityClassName(allergy.severity!)}>
              {t(getSeverityDisplayName(allergy.severity!))}
            </Tag>
          </>
        );
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
          <Tag
            type="outline"
            renderIcon={DotMark}
            className={
              allergy.status === 'Active'
                ? styles.activeStatus
                : styles.inactiveStatus
            }
          >
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
        <p className={styles.allergiesNote} key={generateId()}>
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
        className={styles.allergiesTableBody}
      />
    </div>
  );
};

export default AllergiesTable;
