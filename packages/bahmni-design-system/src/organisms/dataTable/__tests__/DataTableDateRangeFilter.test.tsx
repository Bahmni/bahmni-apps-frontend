import type { Column } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTableDateRangeFilter } from '../components/DataTableDateRangeFilter';
import type { DateRangeFilterValue } from '../utils';
import '@testing-library/jest-dom';

jest.mock('../../../molecules/datePicker', () => ({
  DatePicker: ({
    value,
    onChange,
    children,
    testId,
  }: {
    value: Date[];
    onChange: (dates: Date[]) => void;
    children: React.ReactNode;
    testId: string;
  }) => (
    <div data-testid={testId}>
      <span data-testid={`${testId}-value-count`}>{value.length}</span>
      {value.map((d, i) => (
        <span key={d.getTime()} data-testid={`${testId}-value-${i}`}>
          {d.getTime()}
        </span>
      ))}
      <button
        type="button"
        data-testid={`${testId}-fire-empty`}
        onClick={() => onChange([])}
      >
        empty
      </button>
      <button
        type="button"
        data-testid={`${testId}-fire-range`}
        onClick={() =>
          onChange([
            new Date(Date.UTC(2026, 0, 15)),
            new Date(Date.UTC(2026, 2, 1)),
          ])
        }
      >
        range
      </button>
      <button
        type="button"
        data-testid={`${testId}-fire-start-only`}
        onClick={() => onChange([new Date(Date.UTC(2026, 0, 15))])}
      >
        start only
      </button>
      <button
        type="button"
        data-testid={`${testId}-fire-undefined`}
        onClick={() => onChange(undefined as unknown as Date[])}
      >
        undefined
      </button>
      {children}
    </div>
  ),
  DatePickerInput: (props: { id: string; placeholder: string }) => (
    <input data-testid={`input-${props.id}`} placeholder={props.placeholder} />
  ),
}));

const createColumn = (filterValue?: DateRangeFilterValue) => {
  const setFilterValue = jest.fn();
  const column = {
    id: 'orderedAt',
    getFilterValue: () => filterValue,
    setFilterValue,
  } as unknown as Column<unknown>;
  return { column, setFilterValue };
};

describe('DataTableDateRangeFilter', () => {
  it('renders the DatePicker with an empty value when no filter is set', () => {
    const { column } = createColumn(undefined);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    expect(
      screen.getByTestId('t-filter-orderedAt-value-count'),
    ).toHaveTextContent('0');
  });

  it('renders one Date when only the start of the range is set', () => {
    const start = Date.UTC(2026, 0, 15);
    const { column } = createColumn([start, null]);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    expect(
      screen.getByTestId('t-filter-orderedAt-value-count'),
    ).toHaveTextContent('1');
    expect(screen.getByTestId('t-filter-orderedAt-value-0')).toHaveTextContent(
      String(start),
    );
  });

  it('renders one Date when only the end of the range is set', () => {
    const end = Date.UTC(2026, 2, 1);
    const { column } = createColumn([null, end]);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    expect(
      screen.getByTestId('t-filter-orderedAt-value-count'),
    ).toHaveTextContent('1');
    expect(screen.getByTestId('t-filter-orderedAt-value-0')).toHaveTextContent(
      String(end),
    );
  });

  it('renders both Dates when start and end of the range are set', () => {
    const start = Date.UTC(2026, 0, 15);
    const end = Date.UTC(2026, 2, 1);
    const { column } = createColumn([start, end]);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    expect(
      screen.getByTestId('t-filter-orderedAt-value-count'),
    ).toHaveTextContent('2');
  });

  it('clears the filter when the DatePicker fires an empty range', async () => {
    const user = userEvent.setup();
    const { column, setFilterValue } = createColumn([1, 2]);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    await user.click(screen.getByTestId('t-filter-orderedAt-fire-empty'));
    expect(setFilterValue).toHaveBeenCalledWith(undefined);
  });

  it('clears the filter when the DatePicker fires an undefined range', async () => {
    const user = userEvent.setup();
    const { column, setFilterValue } = createColumn([1, 2]);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    await user.click(screen.getByTestId('t-filter-orderedAt-fire-undefined'));
    expect(setFilterValue).toHaveBeenCalledWith(undefined);
  });

  it('sets both timestamps when the DatePicker fires a complete range', async () => {
    const user = userEvent.setup();
    const { column, setFilterValue } = createColumn(undefined);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    await user.click(screen.getByTestId('t-filter-orderedAt-fire-range'));
    expect(setFilterValue).toHaveBeenCalledWith([
      Date.UTC(2026, 0, 15),
      Date.UTC(2026, 2, 1),
    ]);
  });

  it('sets a [start, null] range when the DatePicker fires only a start date', async () => {
    const user = userEvent.setup();
    const { column, setFilterValue } = createColumn(undefined);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    await user.click(screen.getByTestId('t-filter-orderedAt-fire-start-only'));
    expect(setFilterValue).toHaveBeenCalledWith([Date.UTC(2026, 0, 15), null]);
  });

  it('renders from/to inputs with header-based aria labels', () => {
    const { column } = createColumn(undefined);
    render(
      <DataTableDateRangeFilter
        column={column}
        header="Ordered At"
        dataTestId="t"
      />,
    );
    expect(screen.getByTestId('input-t-filter-orderedAt-from')).toHaveAttribute(
      'placeholder',
      'From',
    );
    expect(screen.getByTestId('input-t-filter-orderedAt-to')).toHaveAttribute(
      'placeholder',
      'To',
    );
  });
});
