import { Tag, Tile, DataTableSkeleton } from '@carbon/react';
import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { FULL_MONTH_DATE_FORMAT, ISO_DATE_FORMAT } from '@constants/date';
import { useRadiologyInvestigation } from '@hooks/useRadiologyInvestigation';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import { groupByDate } from '@utils/common';
import { formatDate } from '@utils/date';
import {
  sortRadiologyInvestigationsByPriority,
  filterRadiologyInvestionsReplacementEntries,
} from '@utils/radiologyInvestigation';
import * as styles from './styles/RadiologyInvestigationTable.module.scss';

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an ExpandableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC = () => {
  const { t } = useTranslation();
  const { radiologyInvestigations, loading, error } =
    useRadiologyInvestigation();

  const headers = useMemo(
    () => [
      { key: 'testName', header: t('RADIOLOGY_TEST_NAME') },
      { key: 'results', header: t('RADIOLOGY_RESULTS') },
      { key: 'orderedBy', header: t('RADIOLOGY_ORDERED_BY') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'testName', sortable: true },
      { key: 'results', sortable: true },
      { key: 'orderedBy', sortable: true },
    ],
    [],
  );

  const processedInvestigations = useMemo(() => {
    const filteredInvestigations = filterRadiologyInvestionsReplacementEntries(
      radiologyInvestigations,
    );

    const grouped = groupByDate(filteredInvestigations, (investigation) => {
      const result = formatDate(investigation.orderedDate, ISO_DATE_FORMAT);
      return result.formattedResult;
    });

    const groupedData = grouped.map((group) => ({
      date: group.date,
      investigations: group.items,
    }));

    return groupedData.map((investigationsByDate) => ({
      ...investigationsByDate,
      investigations: sortRadiologyInvestigationsByPriority(
        investigationsByDate.investigations,
      ),
    }));
  }, [radiologyInvestigations]);

  const renderCell = useCallback(
    (investigation: RadiologyInvestigation, cellId: string) => {
      switch (cellId) {
        case 'testName':
          return (
            <>
              {investigation.testName + ' '}
              {investigation.priority === 'stat' && (
                <Tag className={styles.urgentCell}>
                  {t('RADIOLOGY_PRIORITY_URGENT')}
                </Tag>
              )}
            </>
          );
        case 'results':
          return '--';
        case 'orderedBy':
          return investigation.orderedBy;
      }
    },
    [t],
  );

  return (
    <Tile
      title={t('RADIOLOGY_INVESTIGATION_HEADING')}
      data-testid="radiology-investigations-table"
      className={styles.radiologyInvestigationTable}
    >
      {loading && (
        <DataTableSkeleton
          columnCount={3}
          rowCount={1}
          showHeader={false}
          showToolbar={false}
          compact
          data-testid="data-table-skeleton"
        />
      )}
      {error && (
        <p className={styles.radiologyInvestigationTableBodyError}>
          {t('ERROR_FETCHING_RADIOLOGY_INVESTIGATIONS')}
        </p>
      )}
      {!loading && !error && radiologyInvestigations.length === 0 && (
        <p className={styles.radiologyInvestigationTableBodyError}>
          {t('NO_RADIOLOGY_INVESTIGATIONS')}
        </p>
      )}
      {processedInvestigations.map((investigationsByDate, index) => {
        const { date, investigations } = investigationsByDate;

        const formattedDate = formatDate(
          date,
          FULL_MONTH_DATE_FORMAT,
        ).formattedResult;

        return (
          <ExpandableDataTable
            key={date}
            tableTitle={formattedDate}
            rows={investigations}
            headers={headers}
            sortable={sortable}
            renderCell={renderCell}
            loading={false}
            error={null}
            emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
            className={styles.radiologyInvestigationTableBody}
            isOpen={index === 0}
          />
        );
      })}
    </Tile>
  );
};

export default RadiologyInvestigationTable;
