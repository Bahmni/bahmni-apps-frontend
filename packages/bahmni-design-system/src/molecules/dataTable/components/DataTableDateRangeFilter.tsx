import type { Column } from '@tanstack/react-table';
import { DatePicker, DatePickerInput } from '../../datePicker';
import type { DateRangeFilterValue } from '../utils';

interface DataTableDateRangeFilterProps<T> {
  column: Column<T>;
  header: string;
  dataTestId: string;
}

const toDateArray = (value: DateRangeFilterValue | undefined): Date[] => {
  if (!value) return [];
  const [start, end] = value;
  const dates: Date[] = [];
  if (start != null) dates.push(new Date(start));
  if (end != null) dates.push(new Date(end));
  return dates;
};

export const DataTableDateRangeFilter = <T,>({
  column,
  header,
  dataTestId,
}: DataTableDateRangeFilterProps<T>) => {
  const currentValue = column.getFilterValue() as
    | DateRangeFilterValue
    | undefined;

  return (
    <DatePicker
      datePickerType="range"
      testId={`${dataTestId}-filter-${column.id}`}
      value={toDateArray(currentValue)}
      onChange={(dates: Date[]) => {
        if (!dates || dates.length === 0) {
          column.setFilterValue(undefined);
          return;
        }
        const [start, end] = dates;
        column.setFilterValue([
          start ? start.getTime() : null,
          end ? end.getTime() : null,
        ] satisfies DateRangeFilterValue);
      }}
    >
      <DatePickerInput
        id={`${dataTestId}-filter-${column.id}-from`}
        labelText={`Filter ${header} from`}
        hideLabel
        placeholder="From"
        size="sm"
      />
      <DatePickerInput
        id={`${dataTestId}-filter-${column.id}-to`}
        labelText={`Filter ${header} to`}
        hideLabel
        placeholder="To"
        size="sm"
      />
    </DatePicker>
  );
};
