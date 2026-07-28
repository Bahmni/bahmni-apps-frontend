import type { ReactNode } from 'react';
import type { ButtonProps } from '../../atoms/button';

export type FilterType = 'text' | 'select' | 'dateRange' | 'numeric';

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  enableSorting?: boolean;
  defaultSortDirection?: 'asc' | 'desc';
  enableFiltering?: boolean;
  filterType?: FilterType;
  filterOptions?: DataTableFilterOption[];
  enableGrouping?: boolean;
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
  columns: DataTableColumn<T>[];
  rows: T[];
  ariaLabel: string;
  loading?: boolean;
  emptyStateMessage?: ReactNode;
  errorStateMessage?: ReactNode | null;
  renderCell?: (row: T, columnKey: string) => ReactNode;
  accessor?: (row: T, columnKey: string) => unknown;
  className?: string;
  dataTestId?: string;
  enableGlobalSearch?: boolean;
  globalSearchPlaceholder?: string;
  renderExpandedContent?: (row: T) => ReactNode;
  shouldRowBeExpandable?: (row: T) => boolean;
  initialExpandedRows?: string[];
  enablePagination?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  page?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  totalItems?: number;
  manualPagination?: boolean;
  id?: string;
  title?: string;
  description?: string;
  actionButtons?: DataTableActionButton[];
}
