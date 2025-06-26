import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMedicationRequest } from '@hooks/useMedicationRequest';
import {
  formatMedicationRequest,
  sortMedicationsByStatus,
  sortMedicationsByPriority,
} from '@utils/medicationRequest';
import {
  FormattedMedicationRequest,
  MedicationRequest,
} from '@types/medicationRequest';
import { DotMark } from '@carbon/icons-react';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { SortableDataTable } from '@components/common/sortableDataTable/SortableDataTable';
import { Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from '@carbon/react';
import * as styles from './styles/MedicationsTable.module.scss';
import { groupByDate } from '@utils/common';
import { formatDate } from '@utils/date';
import {
  DATE_FORMAT,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
} from '@constants/date';

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

const MedicationsTable: React.FC = () => {
  const { t } = useTranslation();
  const { medications, loading, error } = useMedicationRequest();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTabChange = (selectedIndex: number) => {
    setSelectedIndex(selectedIndex);
  };

  // Helper function to process medications into date-grouped structure
  const processGroupedMedications = (
    medications: FormattedMedicationRequest[],
  ) => {
    if (!medications || medications.length === 0) return [];

    const grouped = groupByDate(medications, (medication) => {
      return formatDate(medication.orderDate, ISO_DATE_FORMAT).formattedResult;
    });

    // Sort by date descending (most recent first)
    const sortedGroups = grouped.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Sort medications within each group by status
    sortedGroups.forEach((group) => {
      group.items = sortMedicationsByStatus(group.items);
    });

    // Sort medications within each group by priority
    sortedGroups.forEach((group) => {
      group.items = sortMedicationsByPriority(group.items);
    });

    return sortedGroups.map((group) => ({
      date: group.date,
      medications: group.items,
    }));
  };

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
  }, [formattedMedications]);

  const activeAndScheduledMedications = useMemo(() => {
    if (!allMedications) return [];
    return sortMedicationsByPriority(
      allMedications.filter(
        (medication) =>
          medication.status === 'active' || medication.status === 'on-hold',
      ),
    );
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
            <p className={styles.medicineName}>{row.name}</p>
            <p className={styles.medicineDetails}>{row.quantity}</p>
            {row.isImmediate && <Tag className={styles.STAT}>STAT</Tag>}
            {row.asNeeded && <Tag className={styles.PRN}>PRN</Tag>}
          </>
        );
      case 'dosage':
        return <p className={styles.dosage}>{row.dosage}</p>;
      case 'instruction':
        return row.instruction;
      case 'startDate':
        return formatDate(row.startDate, DATE_FORMAT).formattedResult;
      case 'orderedBy':
        return row.orderedBy;
      case 'orderDate':
        return formatDate(row.orderDate, DATE_FORMAT).formattedResult;
      case 'status':
        return (
          <Tag
            type="outline"
            renderIcon={DotMark}
            className={getMedicationStatusClassName(row.status)}
          >
            {t(getMedicationStatusKey(row.status))}
          </Tag>
        );
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
        <TabList aria-label={t('MEDICATIONS_TAB_LIST_ARIA_LABEL')}>
          <Tab tabIndex={0}>{t('MEDICATIONS_TAB_ACTIVE_SCHEDULED')}</Tab>
          <Tab tabIndex={1}>{t('MEDICATIONS_TAB_ALL')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel className={styles.medicationTabs}>
            <SortableDataTable
              headers={headers}
              ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
              rows={activeAndScheduledMedications}
              loading={loading}
              errorStateMessage={error}
              sortable={sortable}
              emptyStateMessage={t('NO_ACTIVE_MEDICATIONS')}
              renderCell={renderCell}
              className={styles.activeMedicationsTableBody}
            />
          </TabPanel>
          <TabPanel className={styles.medicationTabs}>
            {(loading || error || processedAllMedications.length === 0) && (
              <SortableDataTable
                headers={headers}
                ariaLabel={t('MEDICATIONS_TABLE_ARIA_LABEL')}
                rows={[]}
                loading={loading}
                errorStateMessage={error}
                sortable={sortable}
                emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                renderCell={renderCell}
                className={styles.activeMedicationsTableBody}
              />
            )}
            {processedAllMedications.map((medicationsByDate, index) => {
              const { date, medications } = medicationsByDate;
              const formattedDate = formatDate(
                date,
                FULL_MONTH_DATE_FORMAT,
              ).formattedResult;

              return (
                <ExpandableDataTable
                  key={date}
                  tableTitle={formattedDate}
                  rows={medications}
                  headers={headers}
                  sortable={sortable}
                  renderCell={renderCell}
                  loading={loading}
                  error={error}
                  emptyStateMessage={t('NO_MEDICATION_HISTORY')}
                  className={styles.allMedicationsTableBody}
                  isOpen={index === 0}
                />
              );
            })}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default MedicationsTable;
