import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type ExpandedState,
  type GroupingState,
  type PaginationState,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import { useMemo, useState, type ReactNode } from 'react';
import type { DataTableColumn } from '../types';
import {
  buildTanStackColumns,
  defaultRenderCell,
  initialExpandedState,
  initialSortingState,
} from '../utils';

interface UseDataTableArgs<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  renderCell?: (row: T, columnKey: string) => ReactNode;
  accessor?: (row: T, columnKey: string) => unknown;
  enablePagination?: boolean;
  pageSize?: number;
  page?: number;
  totalItems?: number;
  manualPagination?: boolean;
  onPaginationChange?: (page: number, pageSize: number) => void;
  initialExpandedRows?: string[];
}

const DEFAULT_PAGE_SIZE = 10;

export const useDataTable = <T extends { id: string }>({
  columns,
  rows,
  renderCell = defaultRenderCell,
  accessor,
  enablePagination = false,
  pageSize,
  page,
  totalItems,
  manualPagination = false,
  onPaginationChange,
  initialExpandedRows,
}: UseDataTableArgs<T>): Table<T> => {
  const [sorting, setSorting] = useState<SortingState>(() =>
    initialSortingState(columns),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    initialExpandedState(initialExpandedRows),
  );
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: (page ?? 1) - 1,
    pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
  }));

  const tableColumns = useMemo(
    () => buildTanStackColumns(columns, renderCell, accessor),
    [columns, renderCell, accessor],
  );

  return useReactTable({
    data: rows,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      grouping,
      expanded,
      ...(enablePagination ? { pagination } : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onPaginationChange: enablePagination
      ? (updater) => {
          const next =
            typeof updater === 'function' ? updater(pagination) : updater;
          setPagination(next);
          onPaginationChange?.(next.pageIndex + 1, next.pageSize);
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(enablePagination
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    globalFilterFn: 'includesString',
    manualPagination,
    rowCount: manualPagination ? totalItems : undefined,
    getRowId: (row) => row.id,
    autoResetExpanded: false,
  });
};
