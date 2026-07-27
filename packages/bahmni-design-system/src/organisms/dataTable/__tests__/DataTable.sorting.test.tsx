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

const mockRows: Medication[] = [
  {
    id: '1',
    name: 'Paracetamol 650 mg',
    status: 'active',
    orderedBy: 'Super Man',
  },
  {
    id: '2',
    name: 'Acetylsalicylic acid',
    status: 'stopped',
    orderedBy: 'Dr Neha',
  },
  { id: '3', name: 'Oxygen', status: 'active', orderedBy: 'Dr John' },
];

const baseColumns: DataTableColumn<Medication>[] = [
  { key: 'name', header: 'Medication', enableSorting: true },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By' },
];

const renderCell = (row: Medication, cellId: string) =>
  row[cellId as keyof Medication];

describe('DataTable sorting', () => {
  it('toggles sort direction when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const header = screen.getByText('Medication');

    await user.click(header);
    const rowsAfterAsc = screen.getAllByTestId(/^table-row-/);
    expect(rowsAfterAsc[0]).toHaveTextContent('Acetylsalicylic acid');
    expect(rowsAfterAsc[2]).toHaveTextContent('Paracetamol 650 mg');

    await user.click(header);
    const rowsAfterDesc = screen.getAllByTestId(/^table-row-/);
    expect(rowsAfterDesc[0]).toHaveTextContent('Paracetamol 650 mg');
    expect(rowsAfterDesc[2]).toHaveTextContent('Acetylsalicylic acid');
  });

  it('does not sort when a non-sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const originalOrder = screen
      .getAllByTestId(/^table-row-/)
      .map((row) => row.getAttribute('data-testid'));

    await user.click(screen.getByText('Status'));

    const afterClick = screen
      .getAllByTestId(/^table-row-/)
      .map((row) => row.getAttribute('data-testid'));

    expect(afterClick).toEqual(originalOrder);
  });

  it('uses the table-level accessor to derive sort values when provided', async () => {
    const user = userEvent.setup();
    const columns: DataTableColumn<Medication>[] = [
      { key: 'name', header: 'Medication', enableSorting: true },
    ];

    render(
      <DataTable
        columns={columns}
        rows={mockRows}
        renderCell={renderCell}
        accessor={(row, key) =>
          key === 'name' ? (row.orderedBy.split(' ').pop() ?? '') : undefined
        }
        ariaLabel="Medications"
      />,
    );

    await user.click(screen.getByText('Medication'));

    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Oxygen');
    expect(rows[1]).toHaveTextContent('Paracetamol 650 mg');
    expect(rows[2]).toHaveTextContent('Acetylsalicylic acid');
  });

  it('honors defaultSortDirection on initial render', () => {
    const columns: DataTableColumn<Medication>[] = [
      {
        key: 'name',
        header: 'Medication',
        enableSorting: true,
        defaultSortDirection: 'desc',
      },
      { key: 'status', header: 'Status' },
      { key: 'orderedBy', header: 'Ordered By' },
    ];

    render(
      <DataTable
        columns={columns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const rows = screen.getAllByTestId(/^table-row-/);
    expect(rows[0]).toHaveTextContent('Paracetamol 650 mg');
    expect(rows[2]).toHaveTextContent('Acetylsalicylic acid');
  });

  it('honors multiple defaultSortDirection columns in declaration order', () => {
    const rows: Medication[] = [
      { id: 'a', name: 'B', status: 'stopped', orderedBy: 'Z' },
      { id: 'b', name: 'A', status: 'active', orderedBy: 'Z' },
      { id: 'c', name: 'B', status: 'active', orderedBy: 'Z' },
    ];

    const columns: DataTableColumn<Medication>[] = [
      {
        key: 'name',
        header: 'Medication',
        enableSorting: true,
        defaultSortDirection: 'asc',
      },
      {
        key: 'status',
        header: 'Status',
        enableSorting: true,
        defaultSortDirection: 'asc',
      },
      { key: 'orderedBy', header: 'Ordered By' },
    ];

    render(
      <DataTable
        columns={columns}
        rows={rows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const sorted = screen.getAllByTestId(/^table-row-/);
    expect(sorted[0]).toHaveTextContent('A');
    expect(sorted[1]).toHaveTextContent('B');
    expect(sorted[1]).toHaveTextContent('active');
    expect(sorted[2]).toHaveTextContent('B');
    expect(sorted[2]).toHaveTextContent('stopped');
  });

  it('applies default sort priority across multiple columns regardless of declaration order', () => {
    const rows: Medication[] = [
      { id: 'a', name: 'B', status: 'stopped', orderedBy: 'Z' },
      { id: 'b', name: 'A', status: 'active', orderedBy: 'Z' },
      { id: 'c', name: 'B', status: 'active', orderedBy: 'Z' },
    ];
    const columns: DataTableColumn<Medication>[] = [
      {
        key: 'status',
        header: 'Status',
        enableSorting: true,
        defaultSortDirection: 'asc',
        defaultSortPriority: 2,
      },
      {
        key: 'name',
        header: 'Medication',
        enableSorting: true,
        defaultSortDirection: 'asc',
        defaultSortPriority: 1,
      },
      { key: 'orderedBy', header: 'Ordered By' },
    ];

    render(
      <DataTable
        columns={columns}
        rows={rows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const sorted = screen.getAllByTestId(/^table-row-/);
    expect(sorted[0]).toHaveTextContent('A');
    expect(sorted[1]).toHaveTextContent('B');
    expect(sorted[1]).toHaveTextContent('active');
    expect(sorted[2]).toHaveTextContent('B');
    expect(sorted[2]).toHaveTextContent('stopped');
  });

  it('reverts to the configured default order once the active sort is cleared', async () => {
    const user = userEvent.setup();
    const columns: DataTableColumn<Medication>[] = [
      {
        key: 'name',
        header: 'Medication',
        enableSorting: true,
        defaultSortDirection: 'asc',
      },
      { key: 'status', header: 'Status' },
      { key: 'orderedBy', header: 'Ordered By' },
    ];

    render(
      <DataTable
        columns={columns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const header = screen.getByText('Medication');

    const ascRows = screen.getAllByTestId(/^table-row-/);
    expect(ascRows[0]).toHaveTextContent('Acetylsalicylic acid');
    expect(ascRows[2]).toHaveTextContent('Paracetamol 650 mg');

    await user.click(header); // asc -> desc
    const descRows = screen.getAllByTestId(/^table-row-/);
    expect(descRows[0]).toHaveTextContent('Paracetamol 650 mg');
    expect(descRows[2]).toHaveTextContent('Acetylsalicylic acid');

    await user.click(header); // desc -> removed -> falls back to configured default (asc)
    const revertedRows = screen.getAllByTestId(/^table-row-/);
    expect(revertedRows[0]).toHaveTextContent('Acetylsalicylic acid');
    expect(revertedRows[2]).toHaveTextContent('Paracetamol 650 mg');
  });
});
