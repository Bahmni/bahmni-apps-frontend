import { CaretLeft, CaretRight } from '@carbon/icons-react';
import type { Table } from '@tanstack/react-table';
import classnames from 'classnames';
import { Button } from '../../../atoms/button';
import styles from '../styles/DataTable.module.scss';
import type { CursorPaginationConfig } from '../types';

interface DataTableSetPaginationProps<T> {
  table: Table<T>;
  pagination: CursorPaginationConfig<T>;
  dataTestId: string;
}

export const DataTableSetPagination = <T,>({
  table,
  pagination,
  dataTestId,
}: DataTableSetPaginationProps<T>) => {
  const {
    startPage = 1,
    hasNext,
    hasPrevious,
    onSetChange,
    previousLabel = 'Previous set',
    nextLabel = 'Next set',
  } = pagination;

  const pageCount = table.getPageCount();

  if (pageCount <= 1 && !hasPrevious && !hasNext) return null;

  const currentPage = startPage + table.getState().pagination.pageIndex;

  return (
    <nav
      className={styles.setPagination}
      data-testid={`${dataTestId}-set-pagination`}
      aria-label="pagination"
    >
      {hasPrevious && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={() => onSetChange('prev', table)}
          testId={`${dataTestId}-previous-set`}
        >
          <CaretLeft />
          {previousLabel}
        </Button>
      )}

      <ul className={styles.setPaginationPages}>
        {Array.from({ length: pageCount }, (_, index) => {
          const page = startPage + index;
          const isActive = page === currentPage;
          return (
            <li key={page}>
              <button
                type="button"
                className={classnames(styles.setPaginationPage, {
                  [styles.setPaginationPageActive]: isActive,
                })}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => table.setPageIndex(index)}
                data-testid={`${dataTestId}-page-${page}`}
              >
                {page}
              </button>
            </li>
          );
        })}
      </ul>

      {hasNext && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={() => onSetChange('next', table)}
          testId={`${dataTestId}-next-set`}
        >
          {nextLabel}
          <CaretRight />
        </Button>
      )}
    </nav>
  );
};
