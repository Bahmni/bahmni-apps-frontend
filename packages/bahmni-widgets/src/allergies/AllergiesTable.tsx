import {
  Edit,
  IconButton,
  Tag,
  TooltipIcon,
  StatusTag,
  SortableDataTable,
} from '@bahmni/design-system';
import {
  AllergySeverity,
  AllergyStatus,
  FormattedAllergy,
  getAllergies,
  getFormattedAllergies,
  mapAllergyToInputEntry,
  useTranslation,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetActionConfig, WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import styles from './styles/AllergiesTable.module.scss';
import {
  getCategoryDisplayName,
  getSeverityDisplayName,
  sortAllergiesBySeverity,
} from './utils';

const CONSULTATION_START_EVENT = 'startConsultation';

const EDIT_ALLERGY_LABEL = 'EDIT_ALLERGY';

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
const AllergiesTable: React.FC<WidgetProps> = ({
  config,
  disableActions = false,
}) => {
  const [allergies, setAllergies] = useState<FormattedAllergy[]>([]);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();

  const configActions = useMemo(
    () => (config?.actions as WidgetActionConfig[] | undefined) ?? [],
    [config?.actions],
  );
  const actionPrivileges = useMemo(
    () => configActions.flatMap((a) => a.requiredPrivilege ?? []),
    [configActions],
  );
  const hasActionPrivilege = useHasPrivilege(
    actionPrivileges.length > 0 ? actionPrivileges : undefined,
  );
  const showActions =
    configActions.length > 0 &&
    (actionPrivileges.length === 0 || hasActionPrivilege);

  const handleRowEdit = useCallback(
    async (resourceId: string) => {
      try {
        if (!patientUUID) return;
        const rawAllergies = await getAllergies(patientUUID);
        const target = rawAllergies.find((fhir) => fhir.id === resourceId);
        if (!target) return;
        globalThis.dispatchEvent(
          new CustomEvent(CONSULTATION_START_EVENT, {
            detail: {
              editOnly: 'allergies',
              editTitle: 'EDIT_ALLERGIES_TITLE',
              preloadedAllergies: [mapAllergyToInputEntry(target)],
            },
          }),
        );
      } catch {
        addNotification({
          title: t('ERROR_DEFAULT_TITLE'),
          message: t('ERROR_LOADING_ALLERGIES'),
          type: 'error',
        });
      }
    },
    [patientUUID, addNotification, t],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['allergies', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getFormattedAllergies(patientUUID!),
  });

  useSubscribeConsultationSaved(
    (payload) => {
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

  const headers = useMemo(() => {
    const base = [
      { key: 'display', header: t('ALLERGEN') },
      { key: 'manifestation', header: t('REACTIONS') },
      { key: 'recorder', header: t('ALLERGY_LIST_RECORDED_BY') },
      { key: 'status', header: t('ALLERGY_LIST_STATUS') },
    ];
    if (showActions) base.push({ key: 'actions', header: t('ACTIONS') });
    return base;
  }, [t, showActions]);

  const sortable = useMemo(
    () => [
      { key: 'display', sortable: true },
      { key: 'manifestation', sortable: false },
      { key: 'recorder', sortable: true },
      { key: 'status', sortable: true },
    ],
    [],
  );

  const displayAllergies = useMemo(
    () => sortAllergiesBySeverity(allergies),
    [allergies],
  );

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
      case 'actions':
        return (
          <IconButton
            label={t(EDIT_ALLERGY_LABEL)}
            kind="ghost"
            size="sm"
            disabled={disableActions}
            testId={`edit-allergy-${allergy.id}`}
            onClick={() =>
              !disableActions && handleRowEdit(allergy.resourceId ?? allergy.id)
            }
          >
            <Edit />
          </IconButton>
        );
      default:
        return undefined;
    }
  };

  return (
    <div data-testid="allergy-table" className={styles.allergiesTableWrapper}>
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
