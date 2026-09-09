import { TableBody, TableCell, TableExpandRow, TableRow } from '@carbon/react';
import { flexRender, type Row, type Table } from '@tanstack/react-table';
import { Fragment, type ReactNode } from 'react';
import styles from '../styles/DataTable.module.scss';
import type { DataTableColumn } from '../types';
import { DataTableGroupRow } from './DataTableGroupRow';

interface DataTableBodyProps<T extends { id: string }> {
  table: Table<T>;
  columns: DataTableColumn<T>[];
  emptyStateMessage: ReactNode;
  renderExpandedContent?: (row: T) => ReactNode;
  shouldRowBeExpandable?: (row: T) => boolean;
}

const renderRowCells = <T,>(row: Row<T>) =>
  row.getVisibleCells().map((cell) => (
    <TableCell
      key={cell.id}
      data-testid={`table-cell-${(row.original as { id: string }).id}-${cell.column.id}`}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  ));

export const DataTableBody = <T extends { id: string }>({
  table,
  columns,
  emptyStateMessage,
  renderExpandedContent,
  shouldRowBeExpandable,
}: DataTableBodyProps<T>) => {
  const rows = table.getRowModel().rows;
  const expandable = !!renderExpandedContent;
  const totalColumnCount = columns.length + (expandable ? 1 : 0);

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <td colSpan={totalColumnCount} className={styles.emptyStateCell}>
            {emptyStateMessage}
          </td>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => {
        if (row.getIsGrouped()) {
          const groupColumnHeader =
            columns.find((c) => c.key === row.groupingColumnId)?.header ?? '';
          return (
            <DataTableGroupRow
              key={row.id}
              row={row}
              groupColumnHeader={groupColumnHeader}
              totalColumnCount={totalColumnCount}
            />
          );
        }

        const isExpandable =
          expandable && (shouldRowBeExpandable?.(row.original) ?? true);
        const isExpanded = row.getIsExpanded();
        const cells = renderRowCells(row);
        const testId = `table-row-${row.original.id}`;

        if (!expandable) {
          return (
            <TableRow key={row.id} data-testid={testId}>
              {cells}
            </TableRow>
          );
        }

        if (!isExpandable) {
          return (
            <TableRow key={row.id} data-testid={testId}>
              <TableCell key={`expand-spacer-${row.original.id}`} />
              {cells}
            </TableRow>
          );
        }

        return (
          <Fragment key={row.id}>
            <TableExpandRow
              aria-label={
                isExpanded ? 'Collapse current row' : 'Expand current row'
              }
              isExpanded={isExpanded}
              onExpand={() => row.toggleExpanded()}
              data-testid={testId}
            >
              {cells}
            </TableExpandRow>
            {isExpanded ? renderExpandedContent?.(row.original) : null}
          </Fragment>
        );
      })}
    </TableBody>
  );
};
