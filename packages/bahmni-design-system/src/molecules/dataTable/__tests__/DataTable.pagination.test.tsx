import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../types';
import '@testing-library/jest-dom';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

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

const renderCell = (row: Medication, cellId: string) =>
  row[cellId as keyof Medication];

const manyRows: Medication[] = Array.from({ length: 12 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Medication ${i + 1}`,
  status: i % 2 === 0 ? 'active' : 'stopped',
  orderedBy: 'Dr Test',
}));

describe('DataTable pagination', () => {
  it('slices rows to pageSize when pagination is enabled', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={manyRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        enablePagination
        pageSize={5}
      />,
    );

    const visibleRows = screen.getAllByTestId(/^table-row-/);
    expect(visibleRows).toHaveLength(5);
    expect(screen.getByText('Medication 1')).toBeInTheDocument();
    expect(screen.getByText('Medication 5')).toBeInTheDocument();
    expect(screen.queryByText('Medication 6')).not.toBeInTheDocument();
  });

  it('renders the pagination footer when pagination is enabled', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={manyRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        enablePagination
        pageSize={5}
      />,
    );

    expect(screen.getByTestId('data-table-pagination')).toBeInTheDocument();
  });

  it('does not render the pagination footer when pagination is disabled', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={manyRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    expect(
      screen.queryByTestId('data-table-pagination'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^table-row-/)).toHaveLength(12);
  });

  it('honors manualPagination by using totalItems instead of rows.length', () => {
    const serverPageRows = manyRows.slice(0, 5);
    render(
      <DataTable
        columns={baseColumns}
        rows={serverPageRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        enablePagination
        pageSize={5}
        totalItems={200}
        manualPagination
      />,
    );
    expect(screen.getByText(/of 200 items?/i)).toBeInTheDocument();
  });

  it('merges a custom pageSize into the page-size dropdown when it is not a default size', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={manyRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        enablePagination
        pageSize={7}
      />,
    );

    const select = screen.getByLabelText(/items per page/i) as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toContain('7');
    expect(optionValues.indexOf('7')).toBe(1);
  });

  it('advances to the next page when the next-page control is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={baseColumns}
        rows={manyRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        enablePagination
        pageSize={5}
      />,
    );

    expect(screen.getByText('Medication 1')).toBeInTheDocument();
    expect(screen.queryByText('Medication 6')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/next page/i));

    expect(screen.getByText('Medication 6')).toBeInTheDocument();
    expect(screen.queryByText('Medication 1')).not.toBeInTheDocument();
  });
});
