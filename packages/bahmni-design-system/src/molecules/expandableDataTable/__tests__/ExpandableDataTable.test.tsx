import { DataTableHeader } from '@carbon/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ExpandableDataTable } from '../ExpandableDataTable';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const mockHeaders: DataTableHeader[] = [
  { key: 'name', header: 'Medication' },
  { key: 'dosage', header: 'Dosage' },
  { key: 'instruction', header: 'Instruction' },
  { key: 'startDate', header: 'Start Date' },
  { key: 'orderDate', header: 'Order Date' },
  { key: 'orderedBy', header: 'Ordered By' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'status', header: 'Status' },
];

const mockMedicationRows = [
  {
    id: '2c6a89df-64a5-4a99-a078-4c3fda0b2f15',
    name: 'Acetylsalicylic acid 150 mg',
    dosage: '1 Tablet | Twice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Oral',
    startDate: '03/04/2025',
    orderDate: '03/04/2025',
    orderedBy: 'Super Man',
    quantity: '4 Tablet',
    status: 'stopped',
  },
  {
    id: 'fb4bc0c6-849c-4ec3-ad63-0e18b0ee3604',
    name: 'Paroxetine 12.5 mg',
    dosage: '1 Tablet | Once a day | 5 days',
    dosageUnit: 'Tablet',
    instruction: 'Nasal',
    startDate: '04/04/2025',
    orderDate: '04/04/2025',
    orderedBy: 'Dr Neha Anand',
    quantity: '5 Tablet',
    status: 'stopped',
  },
  {
    id: '1124a9bb-1891-44bb-9842-103239aa2ca3',
    name: 'Chlorpheniramine maleate 4 mg',
    dosage: '2 Tablet | Twice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Injection',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Franklin Richards',
    quantity: '8 Tablet',
    status: 'scheduled',
  },
  {
    id: '1d2d372e-0ec3-4544-accd-aa5743d1bf70',
    name: 'Paracetamol 650 mg',
    dosage: '2 Tablet | Immediately | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Eye Drops',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Sebastian Adams',
    quantity: '4 Tablet',
    status: 'stopped',
  },
  {
    id: 'cb23207e-102d-480f-b4e7-6b7ee2084ae7',
    name: 'Hydrochlorothiazide 25 mg',
    dosage: '2 Tablet | Thrice a day | 2 days',
    dosageUnit: 'Tablet',
    instruction: 'Oral | Patient needs sufficient dose of clean water',
    startDate: '08/04/2025',
    orderDate: '08/04/2025',
    orderedBy: 'Dr Monica Smith',
    quantity: '12 Tablet',
    status: 'stopped',
  },
  {
    id: 'c5396e12-dbfe-4259-9e42-92a52a2761a8',
    name: 'Oxygen',
    dosage: '2 Unit | Twice a day | 2 days',
    dosageUnit: 'Unit',
    instruction: 'Nasogastric | Patient needs sufficient dose of clean oxygen',
    startDate: '24/06/2025',
    orderDate: '24/06/2025',
    orderedBy: 'Dr John Doe',
    quantity: '8 Unit',
    status: 'active',
  },
];

describe('ExpandableDataTable', () => {
  const renderCell = (
    row: (typeof mockMedicationRows)[number],
    cellId: string,
  ) => row[cellId as keyof typeof row];

  const renderExpandedContent = (row: (typeof mockMedicationRows)[number]) => (
    <div data-testid={`expanded-content-${row.id}`}>
      <p>Additional details for {row.name}</p>
      <p>Dosage Unit: {row.dosageUnit}</p>
    </div>
  );

  it('renders expandable datatable with all rows', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
      />,
    );

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('Oxygen')).toBeInTheDocument();
    expect(screen.getByText('Super Man')).toBeInTheDocument();
    expect(screen.getByText('Oral')).toBeInTheDocument();
    expect(screen.getByText('8 Unit')).toBeInTheDocument();
  });

  it('renders expandable rows when renderExpandedContent returns truthy content, and simple rows when it returns null', () => {
    const conditionalRenderExpandedContent = (
      row: (typeof mockMedicationRows)[number],
    ) => {
      if (row.status === 'active') {
        return (
          <div data-testid={`expanded-content-${row.id}`}>
            <p>Additional details for {row.name}</p>
            <p>Dosage Unit: {row.dosageUnit}</p>
          </div>
        );
      }
      return null;
    };

    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
        renderExpandedContent={conditionalRenderExpandedContent}
      />,
    );

    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    const activeMedications = mockMedicationRows.filter(
      (row) => row.status === 'active',
    );
    expect(expandButtons).toHaveLength(activeMedications.length);

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('Oxygen')).toBeInTheDocument();
  });

  it('expands and collapses row on button click', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const firstRowId = mockMedicationRows[0].id;

    expect(
      screen.queryByTestId(`expanded-content-${firstRowId}`),
    ).not.toBeInTheDocument();

    const expandButtons = screen.getAllByRole('button', { name: /expand/i });
    fireEvent.click(expandButtons[0]);

    expect(
      screen.getByTestId(`expanded-content-${firstRowId}`),
    ).toBeInTheDocument();

    fireEvent.click(expandButtons[0]);

    expect(
      screen.queryByTestId(`expanded-content-${firstRowId}`),
    ).not.toBeInTheDocument();
  });

  it('renders with initially expanded rows', () => {
    const initialExpandedRows = [
      mockMedicationRows[0].id,
      mockMedicationRows[2].id,
    ];

    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        initialExpandedRows={initialExpandedRows}
      />,
    );

    expect(
      screen.getByTestId(`expanded-content-${mockMedicationRows[0].id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`expanded-content-${mockMedicationRows[2].id}`),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(`expanded-content-${mockMedicationRows[1].id}`),
    ).not.toBeInTheDocument();
  });

  it('renders error state when errorStateMessage is provided', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        errorStateMessage="Something failed"
        ariaLabel="Error Table"
      />,
    );

    const errorElement = screen.getByTestId('expandable-data-table-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe('Something failed');
  });

  it('renders skeleton when loading is true', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        loading
        ariaLabel="Loading Table"
      />,
    );

    const skeleton = screen.getByTestId('expandable-data-table-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state when rows are empty', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={[]}
        ariaLabel="Empty Table"
      />,
    );

    const empty = screen.getByTestId('expandable-data-table-empty');
    expect(empty).toBeInTheDocument();
    expect(empty.textContent).toBe('No data available');
  });

  it('renders empty state with custom emptyStateMessage', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={[]}
        emptyStateMessage="Nothing to show"
        ariaLabel="Custom Empty Table"
      />,
    );

    const empty = screen.getByTestId('expandable-data-table-empty');
    expect(empty.textContent).toBe('Nothing to show');
  });

  it('renders the table with default renderCell', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Default RenderCell"
      />,
    );

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it.each([undefined, null])('handles %s rows gracefully', (rows) => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={rows as any}
        ariaLabel="Empty Rows"
      />,
    );

    expect(
      screen.getByTestId('expandable-data-table-empty'),
    ).toBeInTheDocument();
  });

  it('applies custom className and CSS module class', () => {
    const { container } = render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        className="my-custom-table"
        ariaLabel="Styled Table"
      />,
    );

    expect(container.firstChild).toHaveClass('my-custom-table');
  });

  it('applies custom dataTestId', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        dataTestId="custom-table"
        ariaLabel="Custom Test ID Table"
      />,
    );

    expect(screen.getByTestId('custom-table')).toBeInTheDocument();
  });

  it('respects sortable configuration', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        sortable={[
          { key: 'name', sortable: true },
          { key: 'dosage', sortable: false },
        ]}
        ariaLabel="Partial Sortable"
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const allHeaders = screen.getAllByRole('columnheader');
    const nameHeader = allHeaders.find(
      (header) => header.textContent === 'Medication',
    );
    const dosageHeader = allHeaders.find(
      (header) => header.textContent === 'Dosage',
    );

    expect(nameHeader?.querySelector('button')).not.toBeNull();
    expect(dosageHeader?.querySelector('button')).toBeNull();
  });

  it('renders non-expandable rows when renderExpandedContent is not provided', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Non-Expandable Table"
        renderCell={renderCell}
      />,
    );

    const expandButtons = screen.queryAllByRole('button', { name: /expand/i });
    expect(expandButtons).toHaveLength(0);

    expect(screen.getByText('Paracetamol 650 mg')).toBeInTheDocument();
  });

  it('renders expand header column when renderExpandedContent is provided', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Expandable Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(mockHeaders.length + 1);
  });

  it('toggles multiple rows independently', () => {
    render(
      <ExpandableDataTable
        headers={mockHeaders}
        rows={mockMedicationRows}
        ariaLabel="Medication Orders"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const expandButtons = screen.getAllByRole('button', { name: /expand/i });

    fireEvent.click(expandButtons[0]);
    fireEvent.click(expandButtons[2]);

    expect(
      screen.getByTestId(`expanded-content-${mockMedicationRows[0].id}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`expanded-content-${mockMedicationRows[2].id}`),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(`expanded-content-${mockMedicationRows[1].id}`),
    ).not.toBeInTheDocument();
  });

  describe('Snapshots', () => {
    it('matches snapshot with full data and expandable rows', () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          ariaLabel="Snapshot Test Full"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with non-expandable rows', () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          ariaLabel="Snapshot Test Non-Expandable"
          renderCell={renderCell}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when loading', () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          loading
          ariaLabel="Snapshot Loading"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when empty', () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={[]}
          emptyStateMessage="No medication history"
          ariaLabel="Snapshot Empty"
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with error state', () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          errorStateMessage="Failed to load medications"
          ariaLabel="Snapshot Error"
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations without expandable rows', async () => {
      const { container } = render(
        <ExpandableDataTable
          headers={mockHeaders}
          rows={mockMedicationRows}
          ariaLabel="Accessibility Test Non-Expandable"
          renderCell={renderCell}
        />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
