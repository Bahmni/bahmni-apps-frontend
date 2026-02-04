import {
  Tag,
  TooltipIcon,
  StatusTag,
  SortableDataTable,
} from '@bahmni/design-system';
import {
  AllergySeverity,
  AllergyStatus,
  FormattedAllergy,
  getFormattedAllergies,
  useTranslation,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import styles from './styles/AllergiesTable.module.scss';
import {
  getCategoryDisplayName,
  getSeverityDisplayName,
  sortAllergiesBySeverity,
} from './utils';

// Helper function to get severity CSS class
const getSeverityClassName = (severity: string): string | undefined => {
  switch (severity?.toLowerCase()) {
    case AllergySeverity.mild:
      return styles.mildSeverity;
    case AllergySeverity.moderate:
      return styles.moderateSeverity;
    case AllergySeverity.severe:
      return styles.severeSeverity;
    default:
      return undefined;
  }
};

// TODO: Take UUID As A Prop
/**
 * Component to display patient allergies using SortableDataTable
 */
const AllergiesTable: React.FC = () => {
  const [allergies, setAllergies] = useState<FormattedAllergy[]>([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['allergies', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getFormattedAllergies(patientUUID!),
  });

  // Listen to consultation saved events and refetch if allergies were updated
  useSubscribeConsultationSaved(
    (payload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Allergies were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.allergies
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  useEffect(() => {
    if (isError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    if (data) setAllergies(data);
  }, [data, isLoading, isError, error, addNotification, t]);

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
    return sortAllergiesBySeverity(allergies);
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
                <TooltipIcon
                  iconName="fa-file-lines"
                  content={allergy.note}
                  ariaLabel={allergy.note}
                />
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
          <StatusTag
            label={
              allergy.status === AllergyStatus.Active
                ? t('ALLERGY_LIST_ACTIVE')
                : t('ALLERGY_LIST_INACTIVE')
            }
            dotClassName={
              allergy.status === AllergyStatus.Active
                ? styles.activeStatus
                : styles.inactiveStatus
            }
            testId={`status-${allergy.id}`}
          />
        );
      default:
        return undefined;
    }
  };

  return (
    <div data-testid="allergy-table">
      <SortableDataTable
        headers={headers}
        ariaLabel={t('ALLERGIES_DISPLAY_CONTROL_HEADING')}
        rows={displayAllergies}
        loading={isLoading}
        errorStateMessage={isError ? error.message : null}
        sortable={sortable}
        emptyStateMessage={t('NO_ALLERGIES')}
        renderCell={renderCell}
        className={styles.allergiesTableBody}
        dataTestId="allergies-table"
      />
    </div>
  );
};

export default AllergiesTable;
