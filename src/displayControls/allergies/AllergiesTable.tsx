import React, { useMemo } from 'react';
import {
  Tag,
  Toggletip,
  ToggletipButton,
  ToggletipContent,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { FormattedAllergy } from '@types/allergy';
import { DotMark } from '@carbon/icons-react';
import {
  getCategoryDisplayName,
  getSeverityDisplayName,
  sortAllergiesBySeverity,
} from '@utils/allergy';
import * as styles from './styles/AllergiesTable.module.scss';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_PADDING, ICON_SIZE } from '@constants/icon';

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

  // Format and sort allergies for display
  const displayAllergies = useMemo(() => {
    if (!allergies || allergies.length === 0) return [];
    const formatted = formatAllergies(allergies);
    return sortAllergiesBySeverity(formatted);
  }, [allergies]);

  // Function to render cell content based on the cell ID
  const renderCell = (allergy: FormattedAllergy, cellId: string) => {
    switch (cellId) {
      case 'display':
        return (
          <div className={styles.allergyDisplay}>
            <div className={styles.allergyName}>
              {allergy.display}
              <div className={styles.allergyCategory}>
                [{t(getCategoryDisplayName(allergy.category?.[0]))}]
              </div>
              {allergy.note && (
                <Toggletip autoAlign className={styles.allergyNote}>
                  <ToggletipButton>
                    <BahmniIcon
                      id="fa-file-lines"
                      name="fa-file-lines"
                      size={ICON_SIZE.LG}
                      padding={ICON_PADDING.NONE}
                    />
                  </ToggletipButton>
                  <ToggletipContent>{allergy.note}</ToggletipContent>
                </Toggletip>
              )}
            </div>
            <Tag className={getSeverityClassName(allergy.severity!)}>
              {t(getSeverityDisplayName(allergy.severity!))}
            </Tag>
          </div>
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

  return (
    <div data-testid="allergy-table">
      <ExpandableDataTable
        tableTitle={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        rows={displayAllergies}
        headers={headers}
        sortable={sortable}
        renderCell={renderCell}
        loading={loading}
        error={error}
        ariaLabel={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        emptyStateMessage={t('NO_ALLERGIES')}
        className={styles.allergiesTableBody}
        isOpen={true}
      />
    </div>
  );
};

export default AllergiesTable;
