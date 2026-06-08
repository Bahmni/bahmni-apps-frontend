import { TextInput } from '@carbon/react';
import type { Column } from '@tanstack/react-table';

interface DataTableTextFilterProps<T> {
  column: Column<T>;
  header: string;
  dataTestId: string;
}

export const DataTableTextFilter = <T,>({
  column,
  header,
  dataTestId,
}: DataTableTextFilterProps<T>) => {
  const value = (column.getFilterValue() as string) ?? '';
  return (
    <TextInput
      id={`${dataTestId}-filter-${column.id}`}
      data-testid={`${dataTestId}-filter-${column.id}`}
      labelText={`Filter ${header}`}
      hideLabel
      placeholder={`Filter ${header}`}
      value={value}
      onChange={(event: unknown) => {
        const next =
          (event as { target?: { value?: string } })?.target?.value ?? '';
        column.setFilterValue(next || undefined);
      }}
      size="sm"
    />
  );
};
