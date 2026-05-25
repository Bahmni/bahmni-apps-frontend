import { TableRow } from '@carbon/react';
import type { Table } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';
import type { DataTableColumn } from '../types';
import { DataTableDateRangeFilter } from './DataTableDateRangeFilter';
import { DataTableSelectFilter } from './DataTableSelectFilter';
import { DataTableTextFilter } from './DataTableTextFilter';

interface DataTableFilterRowProps<T extends { id: string }> {
  table: Table<T>;
  columns: DataTableColumn<T>[];
  expandable: boolean;
  dataTestId: string;
}

export const DataTableFilterRow = <T extends { id: string }>({
  table,
  columns,
  expandable,
  dataTestId,
}: DataTableFilterRowProps<T>) => (
  <TableRow
    className={styles.filterRow}
    data-testid={`${dataTestId}-filter-row`}
  >
    {expandable && <td className={styles.filterPlaceholderCell} />}
    {columns.map((col) => {
      if (!col.enableFiltering) {
        return <td key={col.key} className={styles.filterPlaceholderCell} />;
      }
      const tanstackCol = table.getColumn(col.key);
      if (!tanstackCol) {
        return <td key={col.key} className={styles.filterPlaceholderCell} />;
      }
      return (
        <td key={col.key} className={styles.filterCell}>
          {col.filterType === 'select' && (
            <DataTableSelectFilter
              column={tanstackCol}
              header={col.header}
              explicitOptions={col.filterOptions}
              dataTestId={dataTestId}
            />
          )}
          {col.filterType === 'dateRange' && (
            <DataTableDateRangeFilter
              column={tanstackCol}
              header={col.header}
              dataTestId={dataTestId}
            />
          )}
          {(!col.filterType || col.filterType === 'text') && (
            <DataTableTextFilter
              column={tanstackCol}
              header={col.header}
              dataTestId={dataTestId}
            />
          )}
        </td>
      );
    })}
  </TableRow>
);
