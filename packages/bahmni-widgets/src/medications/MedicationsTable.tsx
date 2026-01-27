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
  formatDate,
  DATE_FORMAT,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  FormattedMedicationRequest,
  MedicationRequest,
  shouldEnableEncounterFilter,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
  getPatientMedications,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
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

const MedicationsTable: React.FC<WidgetProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const code = (config?.code as string[]) || [];

  const [selectedIndex, setSelectedIndex] = useState(0);

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  // Use TanStack Query for data fetching and caching
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['medications', patientUUID!, code, encounterUuids],
    enabled: !!patientUUID,
    queryFn: () => getPatientMedications(patientUUID!, code, encounterUuids!),
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
  }, [isError, error, addNotification, t]);

  // Listen to consultation saved events and refetch if medications were updated
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      // Only refetch if:
      // 1. Event is for the same patient
      // 2. Medications were modified during consultation
      if (
        payload.patientUUID === patientUUID &&
        payload.updatedResources.medications
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
        return formatDate(medication.orderDate, t, ISO_DATE_FORMAT)
          .formattedResult;
      });

      // Sort by date descending (most recent first)
      const sortedGroups = grouped.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

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

  const headers = useMemo(
    () => [
      { key: 'name', header: t('MEDICATIONS_MEDICINE_NAME') },
      { key: 'dosage', header: t('MEDICATIONS_DOSAGE') },
      { key: 'instruction', header: t('MEDICATIONS_INSTRUCTIONS') },
      { key: 'startDate', header: t('MEDICATIONS_START_DATE') },
      { key: 'orderedBy', header: t('MEDICATIONS_ORDERED_BY') },
      { key: 'orderDate', header: t('MEDICATIONS_ORDERED_ON') },
      { key: 'status', header: t('MEDICATIONS_STATUS') },
    ],
    [t],
  );
  const sortable = useMemo(
    () => [
      { key: 'name', sortable: true },
      { key: 'dosage', sortable: false },
      { key: 'instruction', sortable: false },
      { key: 'startDate', sortable: true },
      { key: 'orderedBy', sortable: true },
      { key: 'orderDate', sortable: true },
      { key: 'status', sortable: true },
    ],
    [],
  );

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
            <p className={styles.medicineDetails}>{row.quantity}</p>
            {row.isImmediate && <Tag className={styles.STAT}>STAT</Tag>}
            {row.asNeeded && <Tag className={styles.PRN}>PRN</Tag>}
          </>
        );
      case 'dosage': {
        if (typeof row.dosage === 'string') {
          return <p className={styles.columnDataBold}>{row.dosage}</p>;
        }
        if (
          row.dosage &&
          typeof row.dosage === 'object' &&
          'value' in row.dosage &&
          'unit' in row.dosage
        ) {
          const dosage = row.dosage as { value: number; unit: string };
          return (
            <p className={styles.columnDataBold}>
              {dosage.value} {dosage.unit}
            </p>
          );
        }
        return (
          <p className={styles.columnDataBold}>
            {t('MEDICATIONS_TABLE_NOT_AVAILABLE')}
          </p>
        );
      }
      case 'instruction':
        return row.instruction;
      case 'startDate':
        return formatDate(row.startDate, t, DATE_FORMAT).formattedResult;
      case 'orderedBy':
        return row.orderedBy;
      case 'orderDate':
        return formatDate(row.orderDate, t, DATE_FORMAT).formattedResult;
      case 'status':
        return (
          <StatusTag
            testId={`medication-status-${row.id}`}
            label={t(getMedicationStatusKey(row.status))}
            dotClassName={getMedicationStatusClassName(row.status)}
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
    <div data-testid="medications-table">
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
              headers={headers}
              ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
              rows={emptyEncounterFilter ? [] : activeAndScheduledMedications}
              loading={isLoading}
              errorStateMessage={error}
              sortable={sortable}
              emptyStateMessage={t('NO_ACTIVE_MEDICATIONS')}
              renderCell={renderCell}
              className={styles.medicationsTableBody}
            />
          </TabPanel>
          <TabPanel className={styles.medicationTabs}>
            {isLoading ||
            !!error ||
            processedAllMedications.length === 0 ||
            emptyEncounterFilter ? (
              <SortableDataTable
                headers={headers}
                ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
                rows={[]}
                loading={isLoading}
                errorStateMessage={error}
                sortable={sortable}
                emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                renderCell={renderCell}
                className={styles.medicationsTableBody}
              />
            ) : (
              <Accordion align="start">
                {processedAllMedications.map((medicationsByDate) => {
                  const { date, medications } = medicationsByDate;
                  const formattedDate = formatDate(
                    date,
                    t,
                    FULL_MONTH_DATE_FORMAT,
                  ).formattedResult;

                  return (
                    <AccordionItem
                      title={formattedDate}
                      key={date}
                      className={styles.customAccordianItem}
                    >
                      <SortableDataTable
                        headers={headers}
                        ariaLabel={t('MEDICATIONS_DISPLAY_CONTROL_HEADING')}
                        rows={medications}
                        loading={isLoading}
                        errorStateMessage={error}
                        sortable={sortable}
                        emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                        renderCell={renderCell}
                        className={classNames(
                          styles.medicationsTableBody,
                          styles.rowSeperator,
                        )}
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
