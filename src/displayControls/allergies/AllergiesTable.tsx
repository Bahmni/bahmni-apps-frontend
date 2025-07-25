import { DotMark } from '@carbon/icons-react';
import {
  Tag,
  Toggletip,
  ToggletipButton,
  ToggletipContent,
} from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableDataTable } from '@/components/common/sortableDataTable/SortableDataTable';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_PADDING, ICON_SIZE } from '@constants/icon';
import { useAllergies } from '@hooks/useAllergies';
import { formatAllergies } from '@services/allergyService';
import { FormattedAllergy } from '@types/allergy';
import {
  getCategoryDisplayName,
  getSeverityDisplayName,
  sortAllergiesBySeverity,
} from '@utils/allergy';
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
  const { allergies, loading, error } = useAllergies();

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
          <div>
            <div className={styles.allergyName}>
              <span>{allergy.display}</span>
              <span className={styles.allergyCategory}>
                [{t(getCategoryDisplayName(allergy.category?.[0]))}]
              </span>
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
        return allergy.recorder ?? t('ALLERGY_TABLE_NOT_AVAILABLE');
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

  if (error) {
    return (
      <div data-testid="allergies-table-error">
        <p className={styles.allergiesTableError}>{error.message}</p>
      </div>
    );
  }

  return (
    <div data-testid="allergy-table">
      <SortableDataTable
        headers={headers}
        ariaLabel={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        rows={displayAllergies}
        loading={loading}
        errorStateMessage={error}
        sortable={sortable}
        emptyStateMessage={t('NO_ALLERGIES')}
        renderCell={renderCell}
        className={styles.allergiesTableBody}
      />
    </div>
  );
};

export default AllergiesTable;
