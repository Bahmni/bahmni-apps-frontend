import type { Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { ButtonProps } from '../../atoms/button';

export type DataTableInstance<T> = Table<T>;

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

export type DataTablePaginationConfig<T> =
  | DefaultPaginationConfig
  | ManualPaginationConfig<T>
  | CursorPaginationConfig<T>;

export interface DefaultPaginationConfig {
  mode: 'default';
  pageSize?: number;
  pageSizes?: number[];
}

export interface ManualPaginationConfig<T> {
  mode: 'manual';
  page: number;
  pageSize: number;
  pageSizes?: number[];
  totalItems: number;
  onPageChange: (
    page: number,
    pageSize: number,
    table: DataTableInstance<T>,
  ) => void;
}

export type DataTableSetDirection = 'next' | 'previous';

export interface CursorPaginationConfig<T> {
  mode: 'cursor';
  pageSize: number;
  startPage?: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onSetChange: (
    direction: DataTableSetDirection,
    table: DataTableInstance<T>,
  ) => void;
  previousLabel?: string;
  nextLabel?: string;
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
  pagination?: DataTablePaginationConfig<T>;
  id?: string;
  title?: string;
  description?: string;
  actionButtons?: DataTableActionButton[];
}
