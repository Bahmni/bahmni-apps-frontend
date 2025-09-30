import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  DataTableHeader,
  DataTableSkeleton,
} from '@carbon/react';
import classnames from 'classnames';
import React from 'react';
import styles from './styles/SortableDataTable.module.scss';

interface SortableDataTableProps<T> {
  headers: DataTableHeader[];
  rows: T[];
  sortable?: { key: string; sortable: boolean }[];
  ariaLabel: string;
  loading?: boolean;
  errorStateMessage?: string | null;
  emptyStateMessage?: string;
  renderCell?: (row: T, cellId: string) => React.ReactNode;
  className?: string;
  onRowClick?: (row: T) => void;
}

export const SortableDataTable = <T extends { id: string }>({
  headers,
  rows,
  ariaLabel,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  loading = false,
  errorStateMessage: error = null,
  emptyStateMessage = 'No data available.',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (row, cellId) => (row as any)[cellId],
  className = 'sortable-data-table',
  onRowClick,
}: SortableDataTableProps<T>) => {
  if (error) {
    return (
      <p
        data-testid="sortable-table-error"
        className={styles.sortableDataTableBodyEmpty}
      >
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div data-testid="sortable-table-skeleton" className={className}>
        <DataTableSkeleton
          columnCount={headers.length}
          rowCount={5}
          showHeader={false}
          showToolbar={false}
          compact
          className={styles.sortableDataTableSkeleton}
        />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="sortable-table-empty"
        className={styles.sortableDataTableBodyEmpty}
      >
        {emptyStateMessage}
      </p>
    );
  }

  const rowMap = new Map(rows.map((row) => [row.id, row]));

  return (
    <div
      className={classnames(className, styles.sortableDataTableBody)}
      data-testid="sortable-data-table"
    >
      <DataTable rows={rows} headers={headers} isSortable size="md">
        {({
          rows: tableRows,
          headers: tableHeaders,
          getHeaderProps,
          getRowProps,
          getTableProps,
        }) => (
          <Table {...getTableProps()} aria-label={ariaLabel} size="md">
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => {
                  const headerProps = getHeaderProps({
                    header,
                    isSortable:
                      sortable.find((s) => s.key === header.key)?.sortable ??
                      false,
                  });
                  return (
                    <TableHeader {...headerProps} key={header.key}>
                      {header.header}
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows.map((row) => {
                const originalRow = rowMap.get(row.id)!;
                return (
                  <TableRow
                    {...getRowProps({ row })}
                    key={row.id}
                    onClick={
                      onRowClick ? () => onRowClick(originalRow) : undefined
                    }
                    className={onRowClick ? styles.interactiveRow : ''}
                  >
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {renderCell(originalRow, cell.info.header)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
};
