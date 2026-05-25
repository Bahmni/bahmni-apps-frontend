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

const renderCell = (row: Medication, cellId: string) =>
  row[cellId as keyof Medication];

describe('DataTable grouping', () => {
  const groupingColumns: DataTableColumn<Medication>[] = [
    { key: 'name', header: 'Medication' },
    { key: 'status', header: 'Status', enableGrouping: true },
    { key: 'orderedBy', header: 'Ordered By' },
  ];

  it('shows the group-by control when any column is groupable', () => {
    render(
      <DataTable
        columns={groupingColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    expect(screen.getByTestId('data-table-group-by')).toBeInTheDocument();
  });

  it('renders group rows with values and counts when grouping is selected', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={groupingColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
      />,
    );

    const trigger = screen.getByRole('combobox', { name: /group by/i });
    await user.click(trigger);
    const option = await screen.findByRole('option', { name: 'Status' });
    await user.click(option);

    expect(screen.getByText(/Status: active/)).toBeInTheDocument();
    expect(screen.getByText(/Status: stopped/)).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });
});
