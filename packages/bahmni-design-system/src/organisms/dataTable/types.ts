import type { ReactNode } from 'react';
import type { ButtonProps } from '../../atoms/button';

export type FilterType = 'text' | 'select' | 'dateRange';

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;

  // Sort
  enableSorting?: boolean;
  defaultSortDirection?: 'asc' | 'desc';

  // Filter (column-level)
  enableFiltering?: boolean;
  filterType?: FilterType;
  filterOptions?: DataTableFilterOption[];

  // Group
  enableGrouping?: boolean;

  // Display
  width?: string;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableActionButton {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  props?: Partial<ButtonProps>;
}

export interface DataTableProps<T extends { id: string }> {
  // Required core
  columns: DataTableColumn<T>[];
  rows: T[];
  ariaLabel: string;

  // Display
  loading?: boolean;
  emptyStateMessage?: ReactNode;
  errorStateMessage?: ReactNode | null;
  renderCell?: (row: T, columnKey: string) => ReactNode;
  accessor?: (row: T, columnKey: string) => unknown;
  className?: string;
  dataTestId?: string;

  // Table-only features (not column-derivable)
  enableGlobalSearch?: boolean;
  globalSearchPlaceholder?: string;

  // Row-level features (not column-derivable)
  renderExpandedContent?: (row: T) => ReactNode;
  shouldRowBeExpandable?: (row: T) => boolean;
  initialExpandedRows?: string[];

  // Pagination
  enablePagination?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  page?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  totalItems?: number;
  manualPagination?: boolean;

  // Toolbar (Carbon TableContainer header + optional action button)
  id?: string;
  title?: string;
  description?: string;
  actionButton?: DataTableActionButton;
}
