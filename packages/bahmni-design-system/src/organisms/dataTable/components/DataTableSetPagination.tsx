import { CaretLeft, CaretRight } from '@carbon/icons-react';
import type { Table } from '@tanstack/react-table';
import classnames from 'classnames';
import { Button } from '../../../atoms/button';
import styles from '../styles/DataTable.module.scss';
import type { CursorPaginationConfig } from '../types';

interface DataTableSetPaginationProps<T> {
  table: Table<T>;
  cursorPagination: CursorPaginationConfig;
  dataTestId: string;
}

export const DataTableSetPagination = <T,>({
  table,
  cursorPagination,
  dataTestId,
}: DataTableSetPaginationProps<T>) => {
  const {
    batchSize,
    pageSize,
    currentSet,
    hasNextSet,
    hasPreviousSet,
    onNextSet,
    onPreviousSet,
    previousSetLabel = 'Previous set',
    nextSetLabel = 'Next set',
  } = cursorPagination;

  const pageCount = table.getPageCount();

  if (pageCount <= 1 && !hasPreviousSet && !hasNextSet) return null;

  const pagesPerSet = Math.max(Math.ceil(batchSize / pageSize), 1);
  const setStartPage = currentSet * pagesPerSet + 1;
  const currentPage = setStartPage + table.getState().pagination.pageIndex;

  return (
    <nav
      className={styles.setPagination}
      data-testid={`${dataTestId}-set-pagination`}
      aria-label="pagination"
    >
      {hasPreviousSet && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={onPreviousSet}
          testId={`${dataTestId}-previous-set`}
        >
          <CaretLeft />
          {previousSetLabel}
        </Button>
      )}

      <ul className={styles.setPaginationPages}>
        {Array.from({ length: pageCount }, (_, index) => {
          const page = setStartPage + index;
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

      {hasNextSet && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={onNextSet}
          testId={`${dataTestId}-next-set`}
        >
          {nextSetLabel}
          <CaretRight />
        </Button>
      )}
    </nav>
  );
};
