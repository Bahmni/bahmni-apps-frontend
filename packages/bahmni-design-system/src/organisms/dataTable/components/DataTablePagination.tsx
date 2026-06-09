import { Pagination } from '@carbon/react';
import type { Table } from '@tanstack/react-table';
import styles from '../styles/DataTable.module.scss';

interface DataTablePaginationProps<T> {
  table: Table<T>;
  pageSizes: number[];
  totalItems: number;
  dataTestId: string;
}

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50, 100];

export const DataTablePagination = <T,>({
  table,
  pageSizes,
  totalItems,
  dataTestId,
}: DataTablePaginationProps<T>) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const effectivePageSizes = pageSizes.includes(pageSize)
    ? pageSizes
    : [pageSize, ...pageSizes].sort((a, b) => a - b);

  return (
    <div className={styles.pagination} data-testid={`${dataTestId}-pagination`}>
      <Pagination
        page={pageIndex + 1}
        pageSize={pageSize}
        pageSizes={effectivePageSizes}
        totalItems={totalItems}
        onChange={({ page: newPage, pageSize: newPageSize }) => {
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
