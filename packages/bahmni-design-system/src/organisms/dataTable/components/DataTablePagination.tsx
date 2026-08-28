import { Pagination } from '@carbon/react';
import type { Table } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';
import type { DataTablePaginationConfig } from '../types';
import { DataTableSetPagination } from './DataTableSetPagination';

interface DataTablePaginationProps<T> {
  table: Table<T>;
  pagination: DataTablePaginationConfig<T>;
  dataTestId: string;
}

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50, 100];

export const DataTablePagination = <T,>({
  table,
  pagination,
  dataTestId,
}: DataTablePaginationProps<T>) => {
  if (pagination.mode === 'cursor') {
    return (
      <DataTableSetPagination
        table={table}
        pagination={pagination}
        dataTestId={dataTestId}
      />
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageSizes = pagination.pageSizes ?? DEFAULT_PAGE_SIZES;
  const effectivePageSizes = pageSizes.includes(pageSize)
    ? pageSizes
    : [pageSize, ...pageSizes].sort((a, b) => a - b);

  const totalItems =
    pagination.mode === 'manual'
      ? pagination.totalItems
      : table.getFilteredRowModel().rows.length;

  return (
    <div className={styles.pagination} data-testid={`${dataTestId}-pagination`}>
      <Pagination
        page={pageIndex + 1}
        pageSize={pageSize}
        pageSizes={effectivePageSizes}
        totalItems={totalItems}
        onChange={({ page: newPage, pageSize: newPageSize }) => {
          if (pagination.mode === 'manual') {
            pagination.onPageChange(newPage, newPageSize, table);
            return;
          }
          table.setPagination({
            pageIndex: newPage - 1,
            pageSize: newPageSize,
          });
        }}
      />
    </div>
  );
};

DataTablePagination.DEFAULT_PAGE_SIZES = DEFAULT_PAGE_SIZES;
export { DEFAULT_PAGE_SIZES };
