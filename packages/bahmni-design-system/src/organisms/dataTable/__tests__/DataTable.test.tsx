import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../types';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

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

describe('DataTable rendering', () => {
  it('renders rows and headers', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medication Orders"
      />,
    );

    expect(screen.getByText('Medication')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('Oxygen')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
  });

  it('uses row[key] as the default cell value when renderCell is omitted', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        ariaLabel="Medications"
      />,
    );

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('stopped')).toBeInTheDocument();
    expect(screen.getAllByText('active')).toHaveLength(2);
  });

  it('renders data-testid namespaces for header, row, and cell', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        dataTestId="meds"
      />,
    );

    expect(screen.getByTestId('meds')).toBeInTheDocument();
    expect(screen.getByTestId('table-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('table-cell-1-name')).toHaveTextContent(
      'Paracetamol 650 mg',
    );
  });
});

describe('DataTable display states', () => {
  it('renders error state and skips the table when errorStateMessage is provided', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        ariaLabel="Medications"
        errorStateMessage="Something failed"
      />,
    );

    const error = screen.getByTestId('data-table-error');
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent('Something failed');
    expect(screen.queryByText('Medication')).not.toBeInTheDocument();
  });

  it('renders a loading skeleton when loading is true', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        ariaLabel="Medications"
        loading
      />,
    );

    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Paracetamol 650 mg')).not.toBeInTheDocument();
  });

  it('renders the empty state when rows is empty', () => {
    render(
      <DataTable columns={baseColumns} rows={[]} ariaLabel="Medications" />,
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('honors a custom emptyStateMessage', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={[]}
        ariaLabel="Medications"
        emptyStateMessage="Nothing to show"
      />,
    );

    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });
});

describe('DataTable toolbar', () => {
  it('renders title and description from Carbon TableContainer', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        title="Recent Orders"
        description="Last 30 days"
      />,
    );

    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('renders action buttons when provided and fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        id="orders"
        title="Orders"
        actionButtons={[{ label: 'Add order', onClick }]}
      />,
    );

    const button = screen.getByRole('button', { name: 'Add order' });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders multiple action buttons', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        id="orders"
        actionButtons={[
          { label: 'Export', onClick: jest.fn() },
          { label: 'Add', onClick: jest.fn() },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('disables an action button when disabled is true', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        id="orders"
        actionButtons={[{ label: 'Add', disabled: true, onClick: jest.fn() }]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });
});

describe('DataTable accessibility', () => {
  it('has no axe violations on a basic table', async () => {
    const { container } = render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medication Orders"
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations on a fully-featured table', async () => {
    const { container } = render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medication Orders"
        id="orders"
        title="Recent Orders"
        description="Last 30 days"
        actionButtons={[{ label: 'Add', onClick: jest.fn() }]}
        pagination={{ mode: 'default', pageSize: 5 }}
        renderExpandedContent={(row) => (
          <tr>
            <td colSpan={4}>{row.name}</td>
          </tr>
        )}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
