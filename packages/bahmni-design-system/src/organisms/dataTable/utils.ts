import type {
  ColumnDef,
  ExpandedState,
  FilterFn,
  Row,
  SortingState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type {
  DataTableColumn,
  DataTableFilterOption,
  FilterType,
} from './types';

export type DateRangeFilterValue = [number | null, number | null];

const toTimestamp = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const inDateRangeFilterFn: FilterFn<unknown> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: DateRangeFilterValue,
) => {
  if (!filterValue) return true;
  const [start, end] = filterValue;
  if (start == null && end == null) return true;
  const cellValue = toTimestamp(row.getValue(columnId));
  if (cellValue == null) return false;
  if (start != null && cellValue < start) return false;
  if (end != null && cellValue > end) return false;
  return true;
};

export const defaultRenderCell = <T>(row: T, columnKey: string): ReactNode => {
  const value = (row as Record<string, unknown>)[columnKey];
  return value == null ? '' : (value as ReactNode);
};

const builtInFilterFnByType: Record<FilterType, string> = {
  text: 'includesString',
  select: 'arrIncludesSome',
  dateRange: 'inDateRange',
};

const resolveFilterFn = (filterType: FilterType | undefined) => {
  if (filterType === 'dateRange') return inDateRangeFilterFn;
  return (builtInFilterFnByType[filterType ?? 'text'] ??
    'includesString') as 'includesString';
};

export const buildTanStackColumns = <T extends { id: string }>(
  columns: DataTableColumn<T>[],
  renderCell: (row: T, columnKey: string) => ReactNode,
): ColumnDef<T>[] =>
  columns.map((col) => ({
    id: col.key,
    accessorFn: (row: T) => {
      const value = col.accessor
        ? col.accessor(row)
        : (row as Record<string, unknown>)[col.key];
      return value ?? '';
    },
    header: col.header,
    enableSorting: col.enableSorting ?? false,
    enableColumnFilter: col.enableFiltering ?? false,
    enableGrouping: col.enableGrouping ?? false,
    sortingFn: 'alphanumeric',
    filterFn: resolveFilterFn(col.filterType),
    cell: ({ row }) => renderCell(row.original, col.key),
    aggregatedCell: ({ row }) => renderCell(row.original, col.key),
  }));

export const initialSortingState = <T extends { id: string }>(
  columns: DataTableColumn<T>[],
): SortingState =>
  columns
    .filter((col) => col.defaultSortDirection)
    .map((col) => ({
      id: col.key,
      desc: col.defaultSortDirection === 'desc',
    }));

export const initialExpandedState = (
  initialExpandedRows: string[] | undefined,
): ExpandedState => {
  if (!initialExpandedRows || initialExpandedRows.length === 0) return {};
  return Object.fromEntries(initialExpandedRows.map((id) => [id, true]));
};

export const deriveFacetedOptions = (
  facetedValues: Map<unknown, number> | undefined,
): DataTableFilterOption[] => {
  if (!facetedValues) return [];
  return Array.from(facetedValues.entries())
    .filter(([v]) => v != null && v !== '')
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([value, count]) => ({
      value: String(value),
      label: `${String(value)} (${count})`,
    }));
};
