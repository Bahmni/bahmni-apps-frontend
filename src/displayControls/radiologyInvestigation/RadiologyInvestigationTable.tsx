import React, { useMemo } from 'react';
import { Tag, Tile, DataTableSkeleton } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { useRadiologyInvestigation } from '@hooks/useRadiologyInvestigation';
import { RadiologyInvestigation } from '@/types/radiologyInvestigation';
import { formatDate } from '@utils/date';
import { FULL_MONTH_DATE_FORMAT } from '@constants/date';
import { sortRadiologyInvestigationsByPriority } from '@utils/radiologyInvestigation';
import * as styles from './styles/RadiologyInvestigationTable.module.scss';

/**
 * Component to display patient radiology orders grouped by date in accordion format
 * Each accordion item contains an ExpandableDataTable with radiology orders for that date
 */
const RadiologyInvestigationTable: React.FC = () => {
  const { t } = useTranslation();
  const { radiologyInvestigations, loading, error } =
    useRadiologyInvestigation();

  // Define table headers
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

  // Sort radiology investigations within each date group by priority: urgent → routine
  const sortedRadiologyInvestigations = useMemo(() => {
    return radiologyInvestigations.map((investigationsByDate) => ({
      ...investigationsByDate,
      orders: sortRadiologyInvestigationsByPriority(
        investigationsByDate.orders,
      ),
    }));
  }, [radiologyInvestigations]);

  // Function to render cell content based on the cell ID
  const renderCell = (order: RadiologyInvestigation, cellId: string) => {
    switch (cellId) {
      case 'testName':
        return (
          <>
            {order.testName + ' '}
            {order.priority === 'urgent' && (
              <Tag className={styles.urgentCell}>{order.priority}</Tag>
            )}
          </>
        );
      case 'results':
        return '--';
      case 'orderedBy':
        return order.orderedBy;
    }
  };

  return (
    <Tile
      title={t('RADIOLOGY_INVESTIGATION_HEADING')}
      data-testid="radiology-orders-table"
      className={styles.radiologyInvestigationTable}
    >
      <div className={styles.radiologyInvestigationTableTitle}>
        {t('RADIOLOGY_INVESTIGATION_HEADING')}
      </div>
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
          {t('ERROR_FETCHING_RADIOLOGY_ORDERS')}
        </p>
      )}
      {!loading && !error && radiologyInvestigations.length === 0 && (
        <p className={styles.radiologyInvestigationTableBodyError}>
          {t('NO_RADIOLOGY_ORDERS')}
        </p>
      )}
      {sortedRadiologyInvestigations.map((ordersByDate, index) => {
        const { date, orders } = ordersByDate;

        // Format the date for display
        const formattedDate = formatDate(
          date,
          FULL_MONTH_DATE_FORMAT,
        ).formattedResult;

        return (
          <ExpandableDataTable
            key={date}
            tableTitle={formattedDate}
            rows={orders}
            headers={headers}
            sortable={sortable}
            renderCell={renderCell}
            loading={false}
            error={null}
            emptyStateMessage={t('NO_RADIOLOGY_ORDERS')}
            className={styles.radiologyInvestigationTableBody}
            isOpen={index === 0}
          />
        );
      })}
    </Tile>
  );
};

export default RadiologyInvestigationTable;
