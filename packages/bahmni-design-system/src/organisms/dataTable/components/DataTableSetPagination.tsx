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
    disabled = false,
    onSetChange,
    previousLabel = 'Previous set',
    nextLabel = 'Next set',
    iconOnly = false,
    hidePageNumbers = false,
  } = pagination;

  const pageCount = table.getPageCount();

  if (pageCount <= 1 && !hasPrevious && !hasNext) return null;

  const currentPage = startPage + table.getState().pagination.pageIndex;

  const labelText = (label: string) =>
    iconOnly ? <span className={styles.visuallyHidden}>{label}</span> : label;

  return (
    <nav
      className={classnames(styles.setPagination, {
        [styles.setPaginationCentered]: hidePageNumbers,
      })}
      data-testid={`${dataTestId}-set-pagination`}
      aria-label="pagination"
    >
      {hasPrevious && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={() => onSetChange('prev', table)}
          disabled={disabled}
          testId={`${dataTestId}-previous-set`}
        >
          <CaretLeft />
          {labelText(previousLabel)}
        </Button>
      )}

      {!hidePageNumbers && (
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
      )}

      {hasNext && (
        <Button
          kind="ghost"
          size="sm"
          className={styles.setNavButton}
          onClick={() => onSetChange('next', table)}
          disabled={disabled}
          testId={`${dataTestId}-next-set`}
        >
          {labelText(nextLabel)}
          <CaretRight />
        </Button>
      )}
    </nav>
  );
};
