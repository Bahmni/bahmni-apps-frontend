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
  dataTestId?: string;
}

export const SortableDataTable = <T extends { id: string }>({
  headers,
  rows,
  ariaLabel,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  loading = false,
  errorStateMessage = null,
  emptyStateMessage = 'No data available.',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (row, cellId) => (row as any)[cellId],
  className = 'sortable-data-table',
  dataTestId = 'sortable-data-table',
}: SortableDataTableProps<T>) => {
  if (errorStateMessage) {
    return (
      <p
        data-testid={`${dataTestId}-error`}
        className={styles.sortableDataTableBodyEmpty}
      >
        {errorStateMessage}
      </p>
    );
  }

  if (loading) {
    return (
      <div data-testid={`${dataTestId}-skeleton`} className={className}>
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
        data-testid={`${dataTestId}-empty`}
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
      data-testid={dataTestId}
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
                    <TableHeader
                      {...headerProps}
                      key={header.key}
                      data-testid={`table-header-${header.key}`}
                    >
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
                    data-testid={`table-row-${row.id}`}
                  >
                    {row.cells.map((cell) => (
                      <TableCell
                        key={cell.id}
                        data-testid={`table-cell-${row.id}-${cell.info.header}`}
                      >
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
