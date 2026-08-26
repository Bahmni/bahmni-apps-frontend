import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import type {
  CursorPaginationConfig,
  DataTableColumn,
  DataTableInstance,
} from '../types';
import '@testing-library/jest-dom';

interface Medication {
  id: string;
  name: string;
  status: string;
  orderedBy: string;
}

const baseColumns: DataTableColumn<Medication>[] = [
  { key: 'name', header: 'Medication', enableSorting: true },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By' },
];

const filterableColumns: DataTableColumn<Medication>[] = [
  {
    key: 'name',
    header: 'Medication',
    enableSorting: true,
    enableFiltering: true,
    filterType: 'text',
  },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By' },
];

const renderCell = (row: Medication, cellId: string) =>
  row[cellId as keyof Medication];

const setRows = (count = 6): Medication[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `Medication ${i + 1}`,
    status: i % 2 === 0 ? 'active' : 'stopped',
    orderedBy: 'Dr Test',
  }));

const cursorPaginationConfig = (
  overrides: Partial<CursorPaginationConfig<Medication>> = {},
): CursorPaginationConfig<Medication> => ({
  mode: 'cursor',
  pageSize: 2,
  startPage: 1,
  hasNext: false,
  hasPrevious: false,
  onSetChange: jest.fn(),
  ...overrides,
});

const renderTable = (
  pagination: CursorPaginationConfig<Medication>,
  rows: Medication[] = setRows(),
  columns: DataTableColumn<Medication>[] = baseColumns,
) =>
  render(
    <DataTable
      columns={columns}
      rows={rows}
      renderCell={renderCell}
      ariaLabel="Medications"
      pagination={pagination}
    />,
  );

const pageButtonLabels = () =>
  screen
    .getAllByTestId(/^data-table-page-\d+$/)
    .map((button) => button.textContent);

describe('DataTable cursor-set pagination', () => {
  it('should render the set footer instead of the default footer and slice rows to pageSize', () => {
    renderTable(cursorPaginationConfig());

    expect(screen.getByTestId('data-table-set-pagination')).toBeInTheDocument();
    expect(
      screen.queryByTestId('data-table-pagination'),
    ).not.toBeInTheDocument();

    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(2);
    expect(screen.getByText('Medication 1')).toBeInTheDocument();
    expect(screen.queryByText('Medication 3')).not.toBeInTheDocument();
  });

  it('should number pages continuously across sets', () => {
    const { unmount } = renderTable(cursorPaginationConfig());
    expect(pageButtonLabels()).toEqual(['1', '2', '3']);
    unmount();

    renderTable(cursorPaginationConfig({ startPage: 4 }));
    expect(pageButtonLabels()).toEqual(['4', '5', '6']);
  });

  it('should mark the current page and paginate within the set without invoking set navigation callbacks', async () => {
    const user = userEvent.setup();
    const config = cursorPaginationConfig({ hasNext: true });
    renderTable(config);

    expect(screen.getByTestId('data-table-page-1')).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByTestId('data-table-page-3'));

    expect(screen.getByText('Medication 5')).toBeInTheDocument();
    expect(screen.queryByText('Medication 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('data-table-page-3')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(config.onSetChange).not.toHaveBeenCalled();
  });

  it('should render set navigation buttons only when the corresponding set exists and invoke the appropriate callback on click', async () => {
    const user = userEvent.setup();
    const config = cursorPaginationConfig({
      startPage: 4,
      hasPrevious: true,
      hasNext: true,
    });
    renderTable(config);

    await user.click(screen.getByTestId('data-table-next-set'));
    expect(config.onSetChange).toHaveBeenCalledWith('next', expect.anything());

    await user.click(screen.getByTestId('data-table-previous-set'));
    expect(config.onSetChange).toHaveBeenCalledWith(
      'previous',
      expect.anything(),
    );
  });

  it('should hide the previous-set button on the first set and the next-set button on the last set', () => {
    renderTable(cursorPaginationConfig({ hasNext: true }));

    expect(
      screen.queryByTestId('data-table-previous-set'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('data-table-next-set')).toBeInTheDocument();
  });

  it('should render only the pages available in a short final set while preserving the set offset', () => {
    renderTable(
      cursorPaginationConfig({ startPage: 4, hasPrevious: true }),
      setRows(3),
    );

    expect(pageButtonLabels()).toEqual(['4', '5']);
  });

  it('should render no pagination when there is only one page and no adjacent sets', () => {
    renderTable(cursorPaginationConfig(), setRows(2));

    expect(
      screen.queryByTestId('data-table-set-pagination'),
    ).not.toBeInTheDocument();
  });

  it('should return to the first page of the new set when a new batch of rows arrives', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTable(cursorPaginationConfig({ hasNext: true }));

    await user.click(screen.getByTestId('data-table-page-3'));
    expect(screen.getByTestId('data-table-page-3')).toHaveAttribute(
      'aria-current',
      'page',
    );

    rerender(
      <DataTable
        columns={baseColumns}
        rows={setRows()}
        renderCell={renderCell}
        ariaLabel="Medications"
        pagination={cursorPaginationConfig({
          startPage: 4,
          hasPrevious: true,
        })}
      />,
    );

    expect(screen.getByTestId('data-table-page-4')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(pageButtonLabels()).toEqual(['4', '5', '6']);
  });

  it('should preserve sorting across set navigation', async () => {
    const user = userEvent.setup();
    const { rerender } = renderTable(cursorPaginationConfig({ hasNext: true }));

    await user.click(screen.getByText('Medication'));
    await user.click(screen.getByText('Medication'));
    expect(screen.getAllByTestId(/^table-row-/)[0]).toHaveTextContent(
      'Medication 6',
    );

    rerender(
      <DataTable
        columns={baseColumns}
        rows={setRows()}
        renderCell={renderCell}
        ariaLabel="Medications"
        pagination={cursorPaginationConfig({
          startPage: 4,
          hasPrevious: true,
        })}
      />,
    );

    expect(screen.getAllByTestId(/^table-row-/)[0]).toHaveTextContent(
      'Medication 6',
    );
  });

  it('should clear column filters when navigating to another set', async () => {
    const user = userEvent.setup();
    const config = cursorPaginationConfig({
      hasNext: true,
      hasPrevious: true,
      startPage: 4,
      onSetChange: jest.fn((_direction, table: DataTableInstance<Medication>) =>
        table.resetColumnFilters(),
      ),
    });
    renderTable(config, setRows(), filterableColumns);

    await user.click(screen.getByTestId('data-table-filter-toggle'));
    await user.type(screen.getByPlaceholderText('Filter Medication'), '1');
    expect(screen.getByPlaceholderText('Filter Medication')).toHaveValue('1');

    await user.click(screen.getByTestId('data-table-next-set'));

    expect(config.onSetChange).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Filter Medication')).toHaveValue('');
  });

  it('should apply a changed pageSize without remounting', () => {
    const rows = setRows();
    const { rerender } = renderTable(cursorPaginationConfig(), rows);

    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(2);

    rerender(
      <DataTable
        columns={baseColumns}
        rows={rows}
        renderCell={renderCell}
        ariaLabel="Medications"
        pagination={cursorPaginationConfig({ pageSize: 3 })}
      />,
    );

    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(3);
    expect(pageButtonLabels()).toEqual(['1', '2']);
  });
});
