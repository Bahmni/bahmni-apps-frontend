import {
  TableExpandHeader,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { flexRender, type Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { DataTableColumn } from '../types';

interface DataTableHeaderRowProps<T extends { id: string }> {
  table: Table<T>;
  columns: DataTableColumn<T>[];
  expandable?: boolean;
  children?: ReactNode;
}

const tanstackToCarbonSortDirection = (
  direction: false | 'asc' | 'desc',
): 'ASC' | 'DESC' | 'NONE' => {
  if (direction === 'asc') return 'ASC';
  if (direction === 'desc') return 'DESC';
  return 'NONE';
};

export const DataTableHeaderRow = <T extends { id: string }>({
  table,
  columns,
  expandable = false,
  children,
}: DataTableHeaderRowProps<T>) => {
  const widthByKey = new Map(
    columns
      .filter((col) => col.width)
      .map((col) => [col.key, col.width as string]),
  );

  return (
    <TableHead>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {expandable && (
            <TableExpandHeader>
            </TableExpandHeader>
          )}
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sortDirection = header.column.getIsSorted();
            const width = widthByKey.get(header.column.id);
            return (
              <TableHeader
                key={header.id}
                data-testid={`table-header-${header.column.id}`}
                isSortable={canSort}
                isSortHeader={!!sortDirection}
                sortDirection={tanstackToCarbonSortDirection(sortDirection)}
                onClick={
                  canSort ? header.column.getToggleSortingHandler() : undefined
                }
                style={width ? { width } : undefined}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHeader>
            );
          })}
        </TableRow>
      ))}
      {children}
    </TableHead>
  );
};
