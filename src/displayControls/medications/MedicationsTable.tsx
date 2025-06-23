import React, { useMemo, useCallback, useState } from 'react';
import {
  Tag,
  Tile,
  DataTableSkeleton,
  Tabs,
  Tab,
  TabPanel,
  TabList,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { useMedications } from '@hooks/useMedications';
import { FormattedMedication, MedicationStatus } from '@types/medication';
import { formatDate } from '@utils/date';
import { FULL_MONTH_DATE_FORMAT, ISO_DATE_FORMAT } from '@constants/date';
import { groupByDate } from '@utils/common';
import * as styles from './styles/MedicationsTable.module.scss';

const MedicationsTable: React.FC = () => {
  const { t } = useTranslation();
  const { medications, loading, error } = useMedications();
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Table headers
  const headers = useMemo(
    () => [
      { key: 'name', header: t('MEDICATIONS_MEDICINE_NAME') },
      { key: 'dose', header: t('MEDICATIONS_DOSAGE') },
      { key: 'frequency', header: t('MEDICATIONS_INSTRUCTIONS') },
      { key: 'startDate', header: t('MEDICATIONS_START_DATE') },
      { key: 'orderDate', header: t('MEDICATIONS_ORDERED_ON') },
      { key: 'orderedBy', header: t('MEDICATIONS_ORDERED_BY') },
      { key: 'status', header: t('MEDICATIONS_STATUS') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'name', sortable: true },
      { key: 'dose', sortable: false },
      { key: 'frequency', sortable: false },
      { key: 'startDate', sortable: true },
      { key: 'orderDate', sortable: true },
      { key: 'orderedBy', sortable: true },
      { key: 'status', sortable: true },
    ],
    [],
  );

  const sortMedicationsByPriority = useCallback(
    (meds: FormattedMedication[]) => {
      return [...meds].sort((a, b) => {
        const statusPriority = {
          active: 0,
          scheduled: 1,
          completed: 2,
          stopped: 3,
        };
        const aPriority = statusPriority[a.status] ?? 4;
        const bPriority = statusPriority[b.status] ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aDate = new Date(a.orderDate || '').getTime();
        const bDate = new Date(b.orderDate || '').getTime();
        return bDate - aDate;
      });
    },
    [],
  );

  const activeAndScheduledMedications = useMemo(
    () => medications.filter((med) => med.isActive || med.isScheduled),
    [medications],
  );

  const processedActiveScheduledMedications = useMemo(
    () => sortMedicationsByPriority(activeAndScheduledMedications),
    [activeAndScheduledMedications, sortMedicationsByPriority],
  );

  const processedAllMedications = useMemo(() => {
    const sorted = sortMedicationsByPriority(medications);
    const grouped = groupByDate(
      sorted,
      (med) => formatDate(med.orderDate || '', ISO_DATE_FORMAT).formattedResult,
    );
    return grouped.map((group) => ({
      date: group.date,
      medications: group.items,
    }));
  }, [medications, sortMedicationsByPriority]);

  const renderCell = useCallback(
    (medication: FormattedMedication, cellId: string) => {
      switch (cellId) {
        case 'name':
          return (
            <>
              {medication.name}
              {medication.form && ` (${medication.form})`}
              {medication.priority?.toLowerCase() === 'stat' && (
                <Tag className={styles.statTag} size="sm">
                  {t('MEDICATIONS_PRIORITY_STAT')}
                </Tag>
              )}
              {medication.priority?.toLowerCase() === 'prn' && (
                <Tag className={styles.prnTag} size="sm">
                  {t('MEDICATIONS_PRIORITY_PRN')}
                </Tag>
              )}
            </>
          );
        case 'dose':
          return medication.dose || '--';
        case 'frequency':
          return medication.frequency || '--';
        case 'startDate':
          return medication.startDate
            ? formatDate(medication.startDate, FULL_MONTH_DATE_FORMAT)
                .formattedResult
            : '--';
        case 'orderDate':
          return medication.orderDate
            ? formatDate(medication.orderDate, FULL_MONTH_DATE_FORMAT)
                .formattedResult
            : '--';
        case 'orderedBy':
          return medication.orderedBy || '--';
        case 'status':
          return (
            <Tag
              className={
                medication.status === MedicationStatus.Active
                  ? styles.activeTag
                  : medication.status === MedicationStatus.Scheduled
                    ? styles.scheduledTag
                    : styles.otherStatusTag
              }
              size="sm"
            >
              {t(`MEDICATIONS_STATUS_${medication.status.toUpperCase()}`)}
            </Tag>
          );
        default:
          return '--';
      }
    },
    [t],
  );

  const renderAllMedicationsTable = useCallback(
    (
      processedMedications: Array<{
        date: string;
        medications: FormattedMedication[];
      }>,
      emptyMessage: string,
    ) => {
      return processedMedications.map((medicationsByDate, index) => {
        const { date, medications: medicationsList } = medicationsByDate;
        const formattedDate =
          formatDate(date, FULL_MONTH_DATE_FORMAT).formattedResult || date;
        return (
          <ExpandableDataTable
            key={date}
            tableTitle={formattedDate}
            rows={medicationsList}
            headers={headers}
            sortable={sortable}
            renderCell={renderCell}
            loading={false}
            error={null}
            ariaLabel={`${t('MEDICATIONS_DISPLAY_CONTROL_HEADING')} - ${formattedDate}`}
            emptyStateMessage={emptyMessage}
            className={styles.medicationsTableBody}
            isOpen={index === 0}
          />
        );
      });
    },
    [headers, sortable, renderCell, t],
  );

  const renderActiveandScheduledMedicationsTable = useCallback(
    (medications: FormattedMedication[], emptyMessage: string) => {
      return (
        <ExpandableDataTable
          tableTitle={t('MEDICATIONS_TAB_ACTIVE_SCHEDULED')}
          rows={medications}
          headers={headers}
          sortable={sortable}
          renderCell={renderCell}
          loading={false}
          error={null}
          ariaLabel={t('MEDICATIONS_DISPLAY_CONTROL_HEADING')}
          emptyStateMessage={emptyMessage}
          className={styles.medicationsTableBody}
        />
      );
    },
    [headers, sortable, renderCell, t],
  );

  return (
    <Tile
      title={t('MEDICATIONS_DISPLAY_CONTROL_HEADING')}
      data-testid="medications-table"
      className={styles.medicationsTable}
    >
      <div className={styles.medicationsTableTitle}>
        {t('MEDICATIONS_DISPLAY_CONTROL_HEADING')}
      </div>

      {loading && (
        <DataTableSkeleton
          columnCount={headers.length}
          rowCount={3}
          showHeader={false}
          showToolbar={false}
          compact
          data-testid="medications-table-skeleton"
        />
      )}

      {error && (
        <div className={styles.errorState}>
          <p>{t('ERROR_FETCHING_MEDICATIONS')}</p>
        </div>
      )}

      {!loading && !error && (
        <Tabs
          selectedIndex={selectedTabIndex}
          onChange={({ selectedIndex }) => setSelectedTabIndex(selectedIndex)}
        >
          <TabList>
            <Tab>{t('MEDICATIONS_TAB_ACTIVE_SCHEDULED')}</Tab>
            <Tab>{t('MEDICATIONS_TAB_ALL')}</Tab>
          </TabList>
          <TabPanel>
            {renderActiveandScheduledMedicationsTable(
              processedActiveScheduledMedications,
              t('NO_ACTIVE_MEDICATIONS'),
            )}
          </TabPanel>
          <TabPanel>
            {renderAllMedicationsTable(
              processedAllMedications,
              t('NO_MEDICATION_HISTORY'),
            )}
          </TabPanel>
        </Tabs>
      )}
    </Tile>
  );
};

export default MedicationsTable;
