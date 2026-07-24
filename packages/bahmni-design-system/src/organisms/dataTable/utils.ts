import type {
  BuiltInFilterFn,
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

// Helper function to normalize a timestamp to start of day (date only)
// This strips the time component for date-only comparison
const normalizeToDateOnly = (timestamp: number): number => {
  const date = new Date(timestamp);
  // Create a new date at start of day (00:00:00.000) in local timezone
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
};

// FilterFn<any> (not FilterFn<unknown>) — TanStack's Column<TData> is
// invariant on TData, so FilterFn<unknown> won't structurally satisfy
// FilterFn<T> for an arbitrary T. Using `any` here is a deliberate
// bidirectional-compat choice for a generic filter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const inDateRangeFilterFn: FilterFn<any> = (
  row: Row<unknown>,
  columnId: string,
  filterValue: DateRangeFilterValue,
) => {
  if (!filterValue) return true;
  const [start, end] = filterValue;
  if (start == null && end == null) return true;
  const cellValue = toTimestamp(row.getValue(columnId));
  if (cellValue == null) return false;

  // Normalize all dates to start of day for date-only comparison
  // This makes the filter inclusive of the entire end date
  const cellDate = normalizeToDateOnly(cellValue);

  if (start != null) {
    const startDate = normalizeToDateOnly(start);
    if (cellDate < startDate) return false;
  }

  if (end != null) {
    const endDate = normalizeToDateOnly(end);
    if (cellDate > endDate) return false;
  }

  return true;
};

export const defaultRenderCell = <T>(row: T, columnKey: string): ReactNode => {
  const value = (row as Record<string, unknown>)[columnKey];
  return value == null ? '' : (value as ReactNode);
};

const builtInFilterFnByType: Record<
  Exclude<FilterType, 'dateRange'>,
  BuiltInFilterFn
> = {
  text: 'includesString',
  select: 'arrIncludesSome',
  numeric: 'weakEquals',
};

const resolveFilterFn = (filterType: FilterType | undefined) => {
  if (filterType === 'dateRange') return inDateRangeFilterFn;
  return builtInFilterFnByType[filterType ?? 'text'] ?? 'includesString';
};

export const buildTanStackColumns = <T extends { id: string }>(
  columns: DataTableColumn<T>[],
  renderCell: (row: T, columnKey: string) => ReactNode,
  accessor?: (row: T, columnKey: string) => unknown,
): ColumnDef<T>[] =>
  columns.map((col) => ({
    id: col.key,
    accessorFn: (row: T) => {
      const fromAccessor = accessor?.(row, col.key);
      const value =
        fromAccessor === undefined
          ? (row as Record<string, unknown>)[col.key]
          : fromAccessor;
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
