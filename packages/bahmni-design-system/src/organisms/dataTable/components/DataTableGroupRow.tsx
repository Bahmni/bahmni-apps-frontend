import { TableRow } from '@carbon/react';
import type { Row } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';

interface DataTableGroupRowProps<T> {
  row: Row<T>;
  groupColumnHeader: string;
  totalColumnCount: number;
}

export const DataTableGroupRow = <T,>({
  row,
  groupColumnHeader,
  totalColumnCount,
}: DataTableGroupRowProps<T>) => (
  <TableRow className={styles.groupRow}>
    <td colSpan={totalColumnCount} className={styles.groupCell}>
      <button
        type="button"
        className={styles.groupToggle}
        onClick={row.getToggleExpandedHandler()}
        aria-expanded={row.getIsExpanded()}
      >
        <span aria-hidden="true">{row.getIsExpanded() ? '▾' : '▸'}</span>
        <span>
          {groupColumnHeader}: {String(row.groupingValue ?? '')}
        </span>
        <span className={styles.groupCount}>({row.subRows.length})</span>
      </button>
    </td>
  </TableRow>
);
