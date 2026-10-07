import { Table, TableContainer } from '@carbon/react';
import classnames from 'classnames';
import { useMemo, useState } from 'react';
import { DataTableBody } from './components/DataTableBody';
import { DataTableError } from './components/DataTableError';
import { DataTableFilterRow } from './components/DataTableFilterRow';
import { DataTableHeaderRow } from './components/DataTableHeaderRow';
import { DataTableLoading } from './components/DataTableLoading';
import { DataTablePagination } from './components/DataTablePagination';
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
  accessor,
  className,
  dataTestId = 'data-table',
  renderExpandedContent,
  shouldRowBeExpandable,
  initialExpandedRows,
  pagination,
  enableGlobalSearch = false,
  globalSearchPlaceholder,
  id,
  title,
  description,
  actionButtons,
}: DataTableProps<T>) => {
  const [showFilters, setShowFilters] = useState(false);

  const table = useDataTable({
    columns,
    rows,
    renderCell,
    accessor,
    pagination,
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
        actionButtons={actionButtons}
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
      {pagination && (
        <DataTablePagination
          table={table}
          pagination={pagination}
          dataTestId={dataTestId}
        />
      )}
    </TableContainer>
  );
};
