import {
  DataTable,
  Pagination,
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
import React, { useEffect, useMemo, useState } from 'react';
import styles from './styles/SortableDataTable.module.scss';

export interface SortableDataTableProps<T> {
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
  pageSize?: number;
  pageSizes?: number[];
  onPageChange?: (page: number, pageSize: number) => void;
  totalItems?: number;
  page?: number;
}

export const SortableDataTable = <T extends { id: string }>({
  headers,
  rows,
  ariaLabel,
  sortable = headers.map((header) => ({ key: header.key, sortable: true })),
  loading = false,
  errorStateMessage = null,
  emptyStateMessage = 'No data available',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell = (row, cellId) => (row as any)[cellId],
  className = 'sortable-data-table',
  dataTestId = 'sortable-data-table',
  pageSize,
  pageSizes = [5, 10, 25, 50, 100],
  onPageChange,
  totalItems,
  page,
}: SortableDataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  // 0 is safe when pageSize is undefined — internalPageSize is never used
  // in slicing or rendering when pagination is disabled (guarded by pageSize !== undefined)
  const [internalPageSize, setInternalPageSize] = useState<number>(
    pageSize ?? 0,
  );

  useEffect(() => {
    if (pageSize !== undefined) setInternalPageSize(pageSize);
  }, [pageSize]);

  // Reset to page 1 when rows change to prevent showing a stale empty page
  // In server-side mode (totalItems defined), page is controlled externally
  useEffect(() => {
    if (totalItems === undefined) {
      setCurrentPage(1);
    }
  }, [rows?.length, totalItems]);

  // useMemo must be called before early returns (Rules of Hooks)
  const effectivePageSizes = useMemo(
    () =>
      pageSize !== undefined && !pageSizes.includes(pageSize)
        ? [pageSize, ...pageSizes].sort((a, b) => a - b)
        : pageSizes,
    [pageSize, pageSizes],
  );

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

  // Always show pagination footer when pageSize is defined, even if all items fit on one page.
  // This lets users see the total count and change the page size.
  const showPagination = pageSize !== undefined;

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
        }) => {
          const startIndex = (currentPage - 1) * internalPageSize;
          // In server-side mode, rows are already the correct page — no slicing needed
          const paginatedRows =
            pageSize !== undefined && totalItems === undefined
              ? tableRows.slice(startIndex, startIndex + internalPageSize)
              : tableRows;

          return (
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
                {paginatedRows.map((row) => {
                  const originalRow = rowMap.get(row.id);
                  if (!originalRow) return null;
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
          );
        }}
      </DataTable>
      {showPagination && (
        <div className={styles.sortableDataTablePagination}>
          <Pagination
            page={page ?? currentPage}
            pageSize={internalPageSize}
            pageSizes={effectivePageSizes}
            totalItems={totalItems ?? rows.length}
            onChange={({ page: newPage, pageSize: newPageSize }) => {
              setInternalPageSize(newPageSize);
              if (totalItems === undefined) {
                setCurrentPage(newPage);
              }
              onPageChange?.(newPage, newPageSize);
            }}
          />
        </div>
      )}
    </div>
  );
};
