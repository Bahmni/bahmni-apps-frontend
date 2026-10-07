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
import type { DataTableColumn, DataTablePaginationConfig } from '../types';
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
  pagination?: DataTablePaginationConfig<T>;
  initialExpandedRows?: string[];
}

export const DEFAULT_PAGE_SIZE = 10;

export const useDataTable = <T extends { id: string }>({
  columns,
  rows,
  renderCell = defaultRenderCell,
  accessor,
  pagination: paginationConfig,
  initialExpandedRows,
}: UseDataTableArgs<T>): Table<T> => {
  const initialSorting = useMemo(() => initialSortingState(columns), [columns]);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    initialExpandedState(initialExpandedRows),
  );
  const configuredPageSize = paginationConfig?.pageSize;
  const isManual = paginationConfig?.mode === 'manual';

  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: 0,
    pageSize: configuredPageSize ?? DEFAULT_PAGE_SIZE,
  }));

  const [previousPageSize, setPreviousPageSize] = useState(configuredPageSize);
  if (
    configuredPageSize !== undefined &&
    configuredPageSize !== previousPageSize
  ) {
    setPreviousPageSize(configuredPageSize);
    setPagination((prev) => ({
      ...prev,
      pageSize: configuredPageSize,
      pageIndex: 0,
    }));
  }

  const [previousRows, setPreviousRows] = useState(rows);
  if (rows !== previousRows) {
    setPreviousRows(rows);
    if (paginationConfig && !isManual) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }

  const paginationState: PaginationState | undefined = !paginationConfig
    ? undefined
    : paginationConfig.mode === 'manual'
      ? {
          pageIndex: paginationConfig.page - 1,
          pageSize: paginationConfig.pageSize,
        }
      : pagination;

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
      ...(paginationState ? { pagination: paginationState } : {}),
    },
    onSortingChange: (updater) => {
      setSorting((old) => {
        const next = typeof updater === 'function' ? updater(old) : updater;
        return next.length === 0 ? initialSorting : next;
      });
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onPaginationChange: paginationConfig
      ? (updater) => {
          if (isManual) return;
          setPagination((prev) =>
            typeof updater === 'function' ? updater(prev) : updater,
          );
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(paginationConfig && !isManual
      ? { getPaginationRowModel: getPaginationRowModel() }
      : {}),
    globalFilterFn: 'includesString',
    manualPagination: isManual,
    rowCount: isManual ? paginationConfig.totalItems : undefined,
    getRowId: (row) => row.id,
    autoResetExpanded: false,
  });
};
