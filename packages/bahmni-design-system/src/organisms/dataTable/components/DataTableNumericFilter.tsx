import type { Column } from '@tanstack/react-table';
import { NumberInput } from '../../../atoms/numberInput';

interface DataTableNumericFilterProps<T> {
  column: Column<T>;
  header: string;
  dataTestId: string;
}

export const DataTableNumericFilter = <T,>({
  column,
  header,
  dataTestId,
}: DataTableNumericFilterProps<T>) => {
  const filterValue = column.getFilterValue();
  return (
    <NumberInput
      id={`${dataTestId}-filter-${column.id}`}
      data-testid={`${dataTestId}-filter-${column.id}`}
      label={`Filter ${header}`}
      allowEmpty
      hideLabel
      value={Number.isFinite(Number(filterValue)) ? Number(filterValue) : ''}
      onChange={(_e, state) => {
        const v = state?.value;
        column.setFilterValue(
          v != null && typeof v === 'number' ? Number(v) : undefined,
        );
      }}
    />
  );
};
