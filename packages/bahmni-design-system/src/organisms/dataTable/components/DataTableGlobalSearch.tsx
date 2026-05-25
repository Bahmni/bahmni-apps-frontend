import { TableToolbarSearch } from '@carbon/react';
import type { Table } from '@tanstack/react-table';

interface DataTableGlobalSearchProps<T> {
  table: Table<T>;
  placeholder?: string;
  dataTestId: string;
}

export const DataTableGlobalSearch = <T,>({
  table,
  placeholder,
  dataTestId,
}: DataTableGlobalSearchProps<T>) => (
  <TableToolbarSearch
    placeholder={placeholder ?? 'Search'}
    value={(table.getState().globalFilter as string) ?? ''}
    onChange={(event: unknown) => {
      const next =
        typeof event === 'string'
          ? event
          : ((event as { target?: { value?: string } })?.target?.value ?? '');
      table.setGlobalFilter(next);
    }}
    data-testid={`${dataTestId}-global-search`}
  />
);
