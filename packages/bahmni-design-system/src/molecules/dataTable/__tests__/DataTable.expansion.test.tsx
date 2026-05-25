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
  { id: '1', name: 'Paracetamol 650 mg', status: 'active', orderedBy: 'Super Man' },
  { id: '2', name: 'Acetylsalicylic acid', status: 'stopped', orderedBy: 'Dr Neha' },
  { id: '3', name: 'Oxygen', status: 'active', orderedBy: 'Dr John' },
];

const baseColumns: DataTableColumn<Medication>[] = [
  { key: 'name', header: 'Medication', enableSorting: true },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By' },
];

const renderCell = (row: Medication, cellId: string) =>
  row[cellId as keyof Medication];

const renderExpandedContent = (row: Medication) => (
  <tr data-testid={`expanded-${row.id}`}>
    <td colSpan={4}>Details for {row.name}</td>
  </tr>
);

describe('DataTable expansion', () => {
  it('renders an expand toggle in each row when renderExpandedContent is provided', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(
      screen.getAllByRole('button', {
        name: /expand current row|collapse current row/i,
      }),
    ).toHaveLength(3);
  });

  it('reveals expanded content when the toggle is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const firstExpand = screen.getAllByRole('button', {
      name: /expand current row|collapse current row/i,
    })[0];

    expect(screen.queryByTestId('expanded-1')).not.toBeInTheDocument();
    await user.click(firstExpand);
    expect(screen.getByTestId('expanded-1')).toHaveTextContent(
      'Details for Paracetamol 650 mg',
    );
  });

  it('respects shouldRowBeExpandable predicate', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        renderExpandedContent={renderExpandedContent}
        shouldRowBeExpandable={(row) => row.status === 'active'}
      />,
    );

    const toggles = screen.getAllByRole('button', {
      name: /expand current row|collapse current row/i,
    });
    expect(toggles).toHaveLength(2);
  });

  it('honors initialExpandedRows on mount', () => {
    render(
      <DataTable
        columns={baseColumns}
        rows={mockRows}
        renderCell={renderCell}
        ariaLabel="Medications"
        renderExpandedContent={renderExpandedContent}
        initialExpandedRows={['2']}
      />,
    );

    expect(screen.getByTestId('expanded-2')).toBeInTheDocument();
    expect(screen.queryByTestId('expanded-1')).not.toBeInTheDocument();
  });
});
