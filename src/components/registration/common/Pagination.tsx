import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Pagination.module.scss';

/**
 * Props for the Pagination component
 */
export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pagination component for navigating through paged data
 * Provides page navigation, page size selection, and jump-to-page functionality
 *
 * @param props - Pagination component props
 * @returns JSX.Element
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [jumpToPage, setJumpToPage] = useState<string>(currentPage.toString());

  // Available page sizes
  const pageSizeOptions = [10, 25, 50, 100];

  // Handle previous page
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  // Handle next page
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = parseInt(event.target.value, 10);
      onPageSizeChange(newPageSize);
    },
    [onPageSizeChange],
  );

  // Handle jump to page
  const handleJumpToPage = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        const pageNumber = parseInt(jumpToPage, 10);
        if (
          !isNaN(pageNumber) &&
          pageNumber >= 1 &&
          pageNumber <= totalPages
        ) {
          onPageChange(pageNumber);
        }
      }
    },
    [jumpToPage, totalPages, onPageChange],
  );

  // Update jump to page input when current page changes
  React.useEffect(() => {
    setJumpToPage(currentPage.toString());
  }, [currentPage]);

  return (
    <nav
      className={`${styles.pagination} ${className}`}
      aria-label={t('pagination.navigation', 'Pagination navigation')}
    >
      <div className={styles.paginationInfo}>
        <span className={styles.pageInfo}>
          {t('pagination.pageInfo', 'Page {{currentPage}} of {{totalPages}}', {
            currentPage,
            totalPages,
          })}
        </span>
        <span className={styles.itemsInfo}>
          {t('pagination.itemsInfo', '{{totalItems}} items total', {
            totalItems,
          })}
        </span>
      </div>

      <div className={styles.paginationControls}>
        {/* Previous button */}
        <button
          type="button"
          className={styles.navigationButton}
          onClick={handlePrevious}
          disabled={currentPage <= 1 || isLoading}
          aria-label={t('pagination.previous', 'Previous page')}
        >
          {t('pagination.previous', 'Previous')}
        </button>

        {/* Page size selector */}
        <div className={styles.pageSizeSelector}>
          <label htmlFor="page-size-select">
            {t('pagination.itemsPerPage', 'Items per page')}
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
            aria-label={t('pagination.itemsPerPage', 'Items per page')}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Jump to page input */}
        <div className={styles.jumpToPage}>
          <label htmlFor="jump-to-page">
            {t('pagination.goToPage', 'Go to page')}
          </label>
          <input
            id="jump-to-page"
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyDown={handleJumpToPage}
            disabled={isLoading}
            aria-label={t('pagination.goToPage', 'Go to page')}
          />
        </div>

        {/* Next button */}
        <button
          type="button"
          className={styles.navigationButton}
          onClick={handleNext}
          disabled={currentPage >= totalPages || isLoading}
          aria-label={t('pagination.next', 'Next page')}
        >
          {t('pagination.next', 'Next')}
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
