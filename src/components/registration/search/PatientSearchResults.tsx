import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PatientSearchResult } from '../../../types/registration';
import { PatientCard } from './PatientCard';
import { Pagination } from '../common/Pagination';
import styles from './PatientSearchResults.module.scss';

/**
 * Sort options for patient search results
 */
export type SortOption = 'name-asc' | 'name-desc' | 'age-asc' | 'age-desc';

/**
 * View mode for displaying results
 */
export type ViewMode = 'grid' | 'list';

/**
 * Filter criteria for search results
 */
export interface ResultFilter {
  gender?: 'M' | 'F' | 'O';
  minAge?: number;
  maxAge?: number;
}

/**
 * Props for the PatientSearchResults component
 */
export interface PatientSearchResultsProps {
  /** Array of patient search results */
  patients: PatientSearchResult[];
  /** Total number of results across all pages */
  totalResults: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when a patient is selected */
  onPatientSelect: (patient: PatientSearchResult) => void;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** UUID of currently selected patient */
  selectedPatientUuid?: string;
  /** Current sort option */
  sortBy?: SortOption;
  /** Callback when sort changes */
  onSort?: (sortBy: SortOption) => void;
  /** Current filter criteria */
  filters?: ResultFilter;
  /** Callback when filters change */
  onFilter?: (filters: ResultFilter) => void;
  /** Callback to retry failed operations */
  onRetry?: () => void;
  /** Callback to create new patient */
  onCreateNew?: () => void;
  /** Enable bulk selection functionality */
  enableBulkSelection?: boolean;
  /** Callback for bulk actions */
  onBulkAction?: (action: string, patientUuids: string[]) => void;
  /** Whether to enable virtualization for large datasets */
  enableVirtualization?: boolean;
  /** Whether in mobile view */
  isMobile?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PatientSearchResults component for displaying search results
 * Provides comprehensive results display with filtering, sorting, and selection
 *
 * @param props - PatientSearchResults component props
 * @returns JSX.Element
 */
export const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({
  patients,
  totalResults,
  currentPage,
  pageSize,
  totalPages,
  onPatientSelect,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  error = null,
  selectedPatientUuid,
  sortBy = 'name-asc',
  onSort,
  filters = {},
  onFilter,
  onRetry,
  onCreateNew,
  enableBulkSelection = false,
  onBulkAction,
  enableVirtualization = false,
  isMobile = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newSortBy = event.target.value as SortOption;
      onSort?.(newSortBy);
    },
    [onSort]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterKey: keyof ResultFilter, value: any) => {
      const newFilters = { ...filters, [filterKey]: value || undefined };
      // Remove undefined values
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof ResultFilter] === undefined) {
          delete newFilters[key as keyof ResultFilter];
        }
      });
      onFilter?.(newFilters);
    },
    [filters, onFilter]
  );

  // Handle individual patient selection for bulk operations
  const handlePatientToggle = useCallback((patientUuid: string) => {
    setSelectedPatients(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(patientUuid)) {
        newSelected.delete(patientUuid);
      } else {
        newSelected.add(patientUuid);
      }
      return newSelected;
    });
  }, []);

  // Handle select all/none
  const handleSelectAll = useCallback(() => {
    if (selectedPatients.size === patients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(patients.map(p => p.uuid)));
    }
  }, [patients, selectedPatients.size]);

  // Handle bulk action
  const handleBulkAction = useCallback(
    (action: string) => {
      onBulkAction?.(action, Array.from(selectedPatients));
      setSelectedPatients(new Set()); // Clear selection after action
    },
    [onBulkAction, selectedPatients]
  );

  // Memoized results count text
  const resultsCountText = useMemo(() => {
    if (isLoading) {
      return t('search.results.searching', 'Searching...');
    }
    if (totalResults === 0) {
      return t('search.results.none', 'No patients found');
    }
    return t('search.results.count', '{{count}} patients found', { count: totalResults });
  }, [isLoading, totalResults, t]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`${styles.searchResults} ${className}`} role="region" aria-label={t('search.results.label', 'Search Results')}>
        <div className={styles.resultsHeader}>
          <div className={styles.resultsCount} role="status">
            {resultsCountText}
          </div>
        </div>
        <div className={styles.loadingSkeleton} data-testid="loading-skeleton">
          {Array.from({ length: pageSize }, (_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.searchResults} ${className}`} role="region" aria-label={t('search.results.label', 'Search Results')}>
        <div className={styles.errorState}>
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={styles.retryButton}
              aria-label={t('search.results.retry', 'Retry search')}
            >
              {t('search.results.retry', 'Retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (patients.length === 0) {
    return (
      <div className={`${styles.searchResults} ${className}`} role="region" aria-label={t('search.results.label', 'Search Results')}>
        <div className={styles.emptyState}>
          <div className={styles.emptyMessage}>
            <h3>{t('search.results.empty.title', 'No patients found')}</h3>
            <p>{t('search.results.empty.suggestion', 'Try different search terms or check your spelling')}</p>
          </div>
          {onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className={styles.createNewButton}
              aria-label={t('search.results.createNew', 'Create new patient')}
            >
              {t('search.results.createNew', 'Create New Patient')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.searchResults} ${className}`} role="region" aria-label={t('search.results.label', 'Search Results')}>
      {/* Results Header */}
      <div className={styles.resultsHeader}>
        <div className={styles.resultsCount} role="status">
          {resultsCountText}
        </div>

        <div className={styles.resultsControls}>
          {/* Sort Dropdown */}
          {onSort && (
            <div className={styles.sortControl}>
              <label htmlFor="sort-select" className={styles.sortLabel}>
                {t('search.results.sortBy', 'Sort by')}
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className={styles.sortSelect}
                aria-label={t('search.results.sortBy', 'Sort by')}
              >
                <option value="name-asc">{t('search.results.sort.nameAsc', 'Name (A-Z)')}</option>
                <option value="name-desc">{t('search.results.sort.nameDesc', 'Name (Z-A)')}</option>
                <option value="age-asc">{t('search.results.sort.ageAsc', 'Age (Youngest)')}</option>
                <option value="age-desc">{t('search.results.sort.ageDesc', 'Age (Oldest)')}</option>
              </select>
            </div>
          )}

          {/* Filter Toggle */}
          {onFilter && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`${styles.filterToggle} ${showFilters ? styles.active : ''}`}
              aria-expanded={showFilters}
              aria-label={t('search.results.filters', 'Filters')}
            >
              {t('search.results.filters', 'Filters')}
            </button>
          )}

          {/* View Toggle (hidden on mobile) */}
          {!isMobile && (
            <div className={styles.viewToggle}>
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                aria-label={t('search.results.gridView', 'Grid view')}
                aria-pressed={viewMode === 'grid'}
              >
                {t('search.results.gridView', 'Grid View')}
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                aria-label={t('search.results.listView', 'List view')}
                aria-pressed={viewMode === 'list'}
              >
                {t('search.results.listView', 'List View')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && onFilter && (
        <div className={styles.filterPanel} data-testid="filter-panel">
          <div className={styles.filterGroup}>
            <label htmlFor="gender-filter" className={styles.filterLabel}>
              {t('search.results.filter.gender', 'Gender')}
            </label>
            <select
              id="gender-filter"
              value={filters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className={styles.filterSelect}
              aria-label={t('search.results.filter.gender', 'Gender')}
            >
              <option value="">{t('search.results.filter.all', 'All')}</option>
              <option value="M">{t('patient.gender.male', 'Male')}</option>
              <option value="F">{t('patient.gender.female', 'Female')}</option>
              <option value="O">{t('patient.gender.other', 'Other')}</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="min-age-filter" className={styles.filterLabel}>
              {t('search.results.filter.minAge', 'Min Age')}
            </label>
            <input
              id="min-age-filter"
              type="number"
              min="0"
              max="150"
              value={filters.minAge || ''}
              onChange={(e) => handleFilterChange('minAge', e.target.value ? Number(e.target.value) : undefined)}
              className={styles.filterInput}
              aria-label={t('search.results.filter.minAge', 'Min Age')}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="max-age-filter" className={styles.filterLabel}>
              {t('search.results.filter.maxAge', 'Max Age')}
            </label>
            <input
              id="max-age-filter"
              type="number"
              min="0"
              max="150"
              value={filters.maxAge || ''}
              onChange={(e) => handleFilterChange('maxAge', e.target.value ? Number(e.target.value) : undefined)}
              className={styles.filterInput}
              aria-label={t('search.results.filter.maxAge', 'Max Age')}
            />
          </div>
        </div>
      )}

      {/* Bulk Operations */}
      {enableBulkSelection && (
        <div className={styles.bulkOperations}>
          <div className={styles.bulkSelection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedPatients.size === patients.length && patients.length > 0}
                onChange={handleSelectAll}
                aria-label={t('search.results.selectAll', 'Select all patients')}
              />
              {t('search.results.selectAll', 'Select all')}
            </label>
          </div>

          {selectedPatients.size > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectedCount}>
                {t('search.results.selectedCount', '{{count}} patients selected', { count: selectedPatients.size })}
              </span>
              <button
                type="button"
                onClick={() => handleBulkAction('export')}
                className={styles.bulkActionButton}
                aria-label={t('search.results.exportSelected', 'Export selected patients')}
              >
                {t('search.results.exportSelected', 'Export Selected')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Container */}
      <div
        className={`${styles.resultsContainer} ${styles[`${viewMode}View`]} ${isMobile ? styles.mobileView : ''}`}
        data-testid="results-container"
      >
        {patients.map((patient) => (
          <div key={patient.uuid} className={styles.patientCardWrapper}>
            {enableBulkSelection && (
              <div className={styles.bulkCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedPatients.has(patient.uuid)}
                  onChange={() => handlePatientToggle(patient.uuid)}
                  aria-label={t('search.results.selectPatient', 'Select {{name}}', { name: patient.display })}
                />
              </div>
            )}
            <PatientCard
              patient={patient}
              onSelect={onPatientSelect}
              isSelected={selectedPatientUuid === patient.uuid}
              className={styles.patientCard}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalResults}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default PatientSearchResults;
