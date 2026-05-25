import { Table, TableContainer } from '@carbon/react';
import classnames from 'classnames';
import { useMemo, useState } from 'react';
import { DataTableBody } from './components/DataTableBody';
import { DataTableError } from './components/DataTableError';
import { DataTableFilterRow } from './components/DataTableFilterRow';
import { DataTableHeaderRow } from './components/DataTableHeaderRow';
import { DataTableLoading } from './components/DataTableLoading';
import {
  DataTablePagination,
  DEFAULT_PAGE_SIZES,
} from './components/DataTablePagination';
import { DataTableToolbar } from './components/DataTableToolbar';
import { useDataTable } from './hooks/useDataTable';
import styles from './styles/DataTable.module.scss';
import type { DataTableProps } from './types';

export const DataTable = <T extends { id: string }>({
  columns,
  rows,
  ariaLabel,
  loading = false,
  emptyStateMessage = 'No data available',
  errorStateMessage = null,
  renderCell,
  className,
  dataTestId = 'data-table',
  renderExpandedContent,
  shouldRowBeExpandable,
  initialExpandedRows,
  enablePagination = false,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  page,
  onPageChange,
  totalItems,
  manualPagination = false,
  enableGlobalSearch = false,
  globalSearchPlaceholder,
  id,
  title,
  description,
  actionButton,
}: DataTableProps<T>) => {
  const [showFilters, setShowFilters] = useState(false);

  const table = useDataTable({
    columns,
    rows,
    renderCell,
    enablePagination,
    pageSize,
    page,
    totalItems,
    manualPagination,
    onPaginationChange: onPageChange,
    initialExpandedRows,
  });

  const groupableColumns = useMemo(
    () => columns.filter((c) => c.enableGrouping),
    [columns],
  );
  const filterableColumnCount = useMemo(
    () => columns.filter((c) => c.enableFiltering).length,
    [columns],
  );

  if (errorStateMessage) {
    return (
      <DataTableError message={errorStateMessage} dataTestId={dataTestId} />
    );
  }

  if (loading) {
    return (
      <DataTableLoading
        columnCount={columns.length}
        className={className}
        dataTestId={dataTestId}
      />
    );
  }

  const expandable = !!renderExpandedContent;
  const totalForPagination = manualPagination
    ? (totalItems ?? rows.length)
    : table.getFilteredRowModel().rows.length;

  return (
    <TableContainer
      id={id ? `${id}-data-table` : undefined}
      title={title}
      description={description}
      className={classnames(className, styles.dataTableBody)}
      data-testid={dataTestId}
    >
      <DataTableToolbar
        table={table}
        id={id}
        dataTestId={dataTestId}
        actionButton={actionButton}
        enableGlobalSearch={enableGlobalSearch}
        globalSearchPlaceholder={globalSearchPlaceholder}
        hasFilterableColumns={filterableColumnCount > 0}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        groupableColumns={groupableColumns}
      />
      <Table aria-label={ariaLabel} size="md">
        <DataTableHeaderRow
          table={table}
          columns={columns}
          expandable={expandable}
        >
          {filterableColumnCount > 0 && showFilters && (
            <DataTableFilterRow
              table={table}
              columns={columns}
              expandable={expandable}
              dataTestId={dataTestId}
            />
          )}
        </DataTableHeaderRow>
        <DataTableBody
          table={table}
          columns={columns}
          emptyStateMessage={emptyStateMessage}
          renderExpandedContent={renderExpandedContent}
          shouldRowBeExpandable={shouldRowBeExpandable}
        />
      </Table>
      {enablePagination && (
        <DataTablePagination
          table={table}
          pageSizes={pageSizes}
          totalItems={totalForPagination}
          dataTestId={dataTestId}
        />
      )}
    </TableContainer>
  );
};
