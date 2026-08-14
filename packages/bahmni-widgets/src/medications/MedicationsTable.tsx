import {
  SortableDataTable,
  Accordion,
  AccordionItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  StatusTag,
  TooltipIcon,
} from '@bahmni/design-system';
import {
  useTranslation,
  groupByDate,
  formatDateTime,
  hasPrivilege,
  MedicationRequest,
  shouldEnableEncounterFilter,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
  getPatientMedications,
  CVX_CODE_SYSTEM,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import Actions from './components/Actions';
import { MEDICATION_REQUEST_PRIORITY } from './constants';
import { FormattedMedicationRequest, MedicationAction } from './models';
import styles from './styles/MedicationsTable.module.scss';
import {
  formatMedicationRequest,
  sortMedicationsByStatus,
  sortMedicationsByPriority,
  sortMedicationsByDateDistance,
} from './utils';

// Helper function to get severity CSS class
const getMedicationStatusClassName = (status: string): string => {
  switch (status) {
    case 'active':
      return styles.activeStatus;
    case 'on-hold':
      return styles.scheduledStatus;
    case 'cancelled':
      return styles.cancelledStatus;
    case 'completed':
      return styles.completedStatus;
    case 'stopped':
      return styles.stoppedStatus;
    case 'entered-in-error':
    case 'draft':
    case 'unknown':
    default:
      return styles.unknownStatus;
  }
};

const getMedicationStatusKey = (status: string): string => {
  switch (status) {
    case 'active':
      return 'MEDICATIONS_STATUS_ACTIVE';
    case 'on-hold':
      return 'MEDICATIONS_STATUS_SCHEDULED';
    case 'cancelled':
      return 'MEDICATIONS_STATUS_CANCELLED';
    case 'completed':
      return 'MEDICATIONS_STATUS_COMPLETED';
    case 'stopped':
      return 'MEDICATIONS_STATUS_STOPPED';
    case 'entered-in-error':
    case 'draft':
    case 'unknown':
    default:
      return 'MEDICATIONS_STATUS_UNKNOWN';
  }
};

const BASE_SORTABLE = [
  { key: 'name', sortable: true },
  { key: 'dosage', sortable: false },
  { key: 'instruction', sortable: false },
  { key: 'startDate', sortable: true },
  { key: 'orderedBy', sortable: true },
  { key: 'orderDate', sortable: true },
  { key: 'status', sortable: true },
];

const MedicationsTable: React.FC<WidgetProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
  canEditOrCreate: canEditEncounter = false,
  activeEncounterUuid = null,
  disableActions = false,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const { userPrivileges } = useUserPrivilege();
  const code = (config?.code as string[]) || [];
  const isVaccine = code.some((c) => c.startsWith(CVX_CODE_SYSTEM));
  const rawActions = (config?.actions as MedicationAction[]) ?? [];
  const actions = useMemo(
    () =>
      rawActions.map((action) =>
        action.type === 'stop'
          ? { ...action, metadata: { ...action.metadata, isVaccine } }
          : action,
      ),
    [rawActions, isVaccine],
  );
  const permittedActions = useMemo(
    () =>
      actions.filter((action) =>
        hasPrivilege(userPrivileges, action.requiredPrivilege),
      ),
    [actions, userPrivileges],
  );
  const hasActions = permittedActions.length > 0;
  const editAction = permittedActions.find((a) => a.type === 'edit');
  const canEdit = !!editAction;

  const [selectedIndex, setSelectedIndex] = useState(0);

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  // Use TanStack Query for data fetching and caching
  // includeRelated=true fetches related Medication resources with form information
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['medications', patientUUID!, code, encounterUuids],
    enabled: !!patientUUID,
    queryFn: () =>
      getPatientMedications(patientUUID!, code, encounterUuids!, true),
  });

  // Handle errors with notifications
  useEffect(() => {
    if (isError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: error.message,
        type: 'error',
      });
    }
  }, [isError, error, addNotification]);

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        (payload.updatedResources.medications ||
          payload.updatedResources.immunizationHistory)
      ) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  const medications = data ?? [];

  const handleTabChange = (selectedIndex: number) => {
    setSelectedIndex(selectedIndex);
  };

  // Helper function to process medications into date-grouped structure
  const processGroupedMedications = useCallback(
    (medications: FormattedMedicationRequest[]) => {
      if (!medications || medications.length === 0) return [];

      const grouped = groupByDate(medications, (medication) => {
        return formatDateTime(medication.orderDate, t).formattedResult;
      });

      // Sort by date descending (most recent first) using the raw orderDate
      // from the first item in each group, since group.date is a formatted
      // display string (e.g. "Today") that cannot be parsed by new Date().
      const sortedGroups = grouped.sort((a, b) => {
        const dateA = new Date(a.items[0]?.orderDate ?? 0).getTime();
        const dateB = new Date(b.items[0]?.orderDate ?? 0).getTime();
        return dateB - dateA;
      });

      // Sort medications within each group by priority
      sortedGroups.forEach((group) => {
        group.items = sortMedicationsByPriority(group.items);
      });

      // Sort medications within each group by status
      sortedGroups.forEach((group) => {
        group.items = sortMedicationsByStatus(group.items);
      });
      return sortedGroups.map((group) => ({
        date: group.date,
        medications: group.items,
      }));
    },
    [t],
  );

  const { baseHeaders, activeHeaders, activeSortable } = useMemo(() => {
    const base = [
      { key: 'name', header: t('MEDICATIONS_MEDICINE_NAME') },
      { key: 'dosage', header: t('MEDICATIONS_DOSAGE') },
      { key: 'instruction', header: t('MEDICATIONS_INSTRUCTIONS') },
      { key: 'startDate', header: t('MEDICATIONS_START_DATE') },
      { key: 'orderedBy', header: t('MEDICATIONS_ORDERED_BY') },
      { key: 'orderDate', header: t('MEDICATIONS_ORDERED_ON') },
      { key: 'status', header: t('MEDICATIONS_STATUS') },
    ];
    return {
      baseHeaders: base,
      activeHeaders: hasActions
        ? [
            ...base,
            { key: 'actions', header: t('MEDICATIONS_WIDGET_COL_ACTIONS') },
          ]
        : base,
      activeSortable: hasActions
        ? [...BASE_SORTABLE, { key: 'actions', sortable: false }]
        : BASE_SORTABLE,
    };
  }, [hasActions]);

  const formattedMedications = useMemo(() => {
    if (!medications) return [];
    return medications.map((m: MedicationRequest) =>
      formatMedicationRequest(m),
    );
  }, [medications]);

  // Format and sort allergies for display
  const allMedications = useMemo(() => {
    if (!medications) return [];
    const formatted = formattedMedications;
    return sortMedicationsByStatus(formatted);
  }, [medications, formattedMedications]);

  const activeAndScheduledMedications = useMemo(() => {
    const activeMedicationsByDate = sortMedicationsByDateDistance(
      allMedications.filter((medication) => medication.status === 'active'),
    );
    const activeMedications = sortMedicationsByPriority(
      activeMedicationsByDate,
    );
    const scheduledMedications = sortMedicationsByPriority(
      allMedications.filter((medication) => medication.status === 'on-hold'),
    );
    return [...activeMedications, ...scheduledMedications];
  }, [allMedications]);

  const editableMedications = useMemo(() => {
    if (!canEdit || !canEditEncounter || !activeEncounterUuid) return [];
    return activeAndScheduledMedications.filter(
      (m) =>
        (m.status === 'active' || m.status === 'on-hold') &&
        m.fhirResource?.encounter?.reference?.endsWith(activeEncounterUuid),
    );
  }, [
    activeAndScheduledMedications,
    canEdit,
    canEditEncounter,
    activeEncounterUuid,
  ]);

  const isEditable = useCallback(
    (medication: FormattedMedicationRequest) =>
      editableMedications.some((m) => m.id === medication.id),
    [editableMedications],
  );

  // Process medications for date grouping (only for All medications tab)
  const processedAllMedications = useMemo(() => {
    return processGroupedMedications(allMedications);
  }, [allMedications, processGroupedMedications]);

  const renderCell = (row: FormattedMedicationRequest, key: string) => {
    switch (key) {
      case 'name':
        return (
          <>
            <div className={styles.medicationName}>
              <span>{row.name}</span>
              {row.note && (
                <TooltipIcon
                  iconName="fa-file-lines"
                  content={row.note}
                  ariaLabel={row.note}
                />
              )}
            </div>
            <p className={styles.medicineDetails}>
              {row.doseForm
                ? `${row.doseForm} | ${row.quantity}`
                : row.quantity}
            </p>
            {row.priority === MEDICATION_REQUEST_PRIORITY.STAT && (
              <Tag className={styles.STAT}>STAT</Tag>
            )}
            {row.asNeeded && <Tag className={styles.PRN}>PRN</Tag>}
          </>
        );
      case 'dosage': {
        const dosageClassName = styles.columnDataBold;
        if (typeof row.dosage === 'string') {
          return <p className={dosageClassName}>{row.dosage}</p>;
        }
        if (
          row.dosage &&
          typeof row.dosage === 'object' &&
          'value' in row.dosage &&
          'unit' in row.dosage
        ) {
          const dosage = row.dosage as { value: number; unit: string };
          return (
            <p className={dosageClassName}>
              {dosage.value} {dosage.unit}
            </p>
          );
        }
        return (
          <p className={dosageClassName}>
            {t('MEDICATIONS_TABLE_NOT_AVAILABLE')}
          </p>
        );
      }
      case 'instruction':
        return row.instruction;
      case 'startDate':
        return formatDateTime(row.startDate, t).formattedResult;
      case 'orderedBy':
        return row.orderedBy;
      case 'orderDate':
        return formatDateTime(row.orderDate, t).formattedResult;
      case 'status':
        return (
          <>
            <StatusTag
              testId={`medication-status-${row.id}`}
              label={t(getMedicationStatusKey(row.status))}
              dotClassName={getMedicationStatusClassName(row.status)}
            />
            {(row.status === 'stopped' || row.status === 'cancelled') && (
              <div className={styles.stopDetails}>
                {row.dateStopped && (
                  <span className={styles.stopReasonText}>
                    {t('MEDICATIONS_STOPPED_ON')}{' '}
                    {formatDateTime(row.dateStopped, t).formattedResult}
                  </span>
                )}
                {row.stopReason && (
                  <span className={styles.stopReasonText}>
                    {t('MEDICATIONS_STOPPED_DUE_TO')} {row.stopReason}
                  </span>
                )}
              </div>
            )}
          </>
        );
      case 'actions':
        return (
          <Actions
            actions={actions}
            medication={row.fhirResource}
            startDate={row.startDate}
            disabledActionTypes={[
              ...(isEditable(row) ? [] : ['edit']),
              ...(disableActions || !['active', 'on-hold'].includes(row.status)
                ? ['stop', 'cancel']
                : []),
            ]}
          />
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div data-testid="medications-table-error">
        <p className={styles.medicationTableEmpty}>
          {t('MEDICATIONS_ERROR_FETCHING')}
        </p>
      </div>
    );
  }

  return (
    <div
      id="medications-table"
      data-testid="medications-table"
      className={styles.medicationsTableWrapper}
    >
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(state) => handleTabChange(state.selectedIndex)}
      >
        <TabList
          aria-label={t('MEDICATIONS_TAB_LIST_ARIA_LABEL')}
          className={styles.medicationTabList}
        >
          <Tab tabIndex={0}>{t('MEDICATIONS_TAB_ACTIVE_SCHEDULED')}</Tab>
          <Tab tabIndex={1}>{t('MEDICATIONS_TAB_ALL')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel className={styles.medicationTabs}>
            <SortableDataTable
              headers={activeHeaders}
              ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
              rows={emptyEncounterFilter ? [] : activeAndScheduledMedications}
              loading={isLoading}
              errorStateMessage={error}
              sortable={activeSortable}
              emptyStateMessage={t('NO_ACTIVE_MEDICATIONS')}
              renderCell={renderCell}
              className={styles.medicationsTableBody}
              dataTestId="medications-active-scheduled-table"
            />
          </TabPanel>
          <TabPanel className={styles.medicationTabs}>
            {isLoading ||
            !!error ||
            processedAllMedications.length === 0 ||
            emptyEncounterFilter ? (
              <SortableDataTable
                headers={baseHeaders}
                ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
                rows={[]}
                loading={isLoading}
                errorStateMessage={error}
                sortable={BASE_SORTABLE}
                emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                renderCell={renderCell}
                className={styles.medicationsTableBody}
                dataTestId="medications-all-table"
              />
            ) : (
              <Accordion align="start">
                {processedAllMedications.map((medicationsByDate) => {
                  const { date, medications } = medicationsByDate;

                  return (
                    <AccordionItem
                      title={date}
                      key={date}
                      className={styles.customAccordianItem}
                    >
                      <SortableDataTable
                        headers={baseHeaders}
                        ariaLabel={t('MEDICATIONS_DISPLAY_CONTROL_HEADING')}
                        rows={medications}
                        loading={isLoading}
                        errorStateMessage={error}
                        sortable={BASE_SORTABLE}
                        emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                        renderCell={renderCell}
                        className={classNames(
                          styles.medicationsTableBody,
                          styles.rowSeperator,
                        )}
                        dataTestId={`medications-table-${date}`}
                      />
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default MedicationsTable;
