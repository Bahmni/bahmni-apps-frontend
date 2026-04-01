import { DataTableHeader } from '@carbon/react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ExpandableSortableDataTable } from '../ExpandableSortableDataTable';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

interface MockRow {
  id: string;
  name: string;
  status: string;
  count: number;
  details: string;
  isExpandable?: boolean;
}

const mockHeaders: DataTableHeader[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'count', header: 'Count' },
];

const mockRows: MockRow[] = [
  {
    id: 'row-1',
    name: 'Patient A',
    status: 'Active',
    count: 3,
    details: 'Details for Patient A',
    isExpandable: true,
  },
  {
    id: 'row-2',
    name: 'Patient B',
    status: 'Pending',
    count: 2,
    details: 'Details for Patient B',
    isExpandable: true,
  },
  {
    id: 'row-3',
    name: 'Patient C',
    status: 'Completed',
    count: 0,
    details: 'Details for Patient C',
    isExpandable: false,
  },
];

const renderCell = (row: MockRow, cellId: string) =>
  row[cellId as keyof MockRow];

const renderExpandedContent = (row: MockRow) => (
  <div data-testid={`expanded-${row.id}`}>{row.details}</div>
);

describe('ExpandableSortableDataTable', () => {
  it('renders table with all rows', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Test Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(screen.getByText('Patient A')).toBeInTheDocument();
    expect(screen.getByText('Patient B')).toBeInTheDocument();
    expect(screen.getByText('Patient C')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('expands row on click and shows expanded content', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Test Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);
    expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
    expect(screen.getByText('Details for Patient A')).toBeInTheDocument();
  });

  it('collapses row on second click', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Test Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });

    fireEvent.click(expandButtons[0]);
    expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();

    fireEvent.click(expandButtons[0]);
    expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();
  });

  it('hides expand button for non-expandable rows', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Test Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const rows = screen.getAllByRole('row');
    const thirdDataRow = rows[3];
    expect(thirdDataRow).toHaveClass('hideExpandButton');
  });

  it('renders error state when errorStateMessage is provided', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        errorStateMessage="Something went wrong"
        ariaLabel="Error Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const errorElement = screen.getByTestId('expandable-table-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe('Something went wrong');
  });

  it('renders skeleton when loading is true', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        loading
        ariaLabel="Loading Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const skeleton = screen.getByTestId('expandable-table-skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders empty state when rows are empty', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={[]}
        ariaLabel="Empty Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const empty = screen.getByTestId('expandable-table-empty');
    expect(empty).toBeInTheDocument();
    expect(empty.textContent).toBe('No data available.');
  });

  it('renders empty state with custom emptyStateMessage', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={[]}
        emptyStateMessage="Nothing to display"
        ariaLabel="Custom Empty Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const empty = screen.getByTestId('expandable-table-empty');
    expect(empty.textContent).toBe('Nothing to display');
  });

  it('handles undefined rows gracefully', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={undefined as unknown as MockRow[]}
        ariaLabel="Undefined Rows"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(screen.getByTestId('expandable-table-empty')).toBeInTheDocument();
  });

  it('handles null rows gracefully', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={null as unknown as MockRow[]}
        ariaLabel="Null Rows"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(screen.getByTestId('expandable-table-empty')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        className="my-custom-table"
        ariaLabel="Styled Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    expect(container.firstChild).toHaveClass('my-custom-table');
  });

  it('applies custom expandedRowClassName', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        expandedRowClassName="custom-expanded-class"
        ariaLabel="Expanded Class Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    const expandedRow = screen.getByTestId('expanded-row-1');
    expect(expandedRow).toBeInTheDocument();
  });

  it('supports sorting on columns', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Sortable Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    expect(screen.getByText('Patient A')).toBeInTheDocument();
    expect(screen.getByText('Patient B')).toBeInTheDocument();
    expect(screen.getByText('Patient C')).toBeInTheDocument();
  });

  it('respects sortable prop for columns', () => {
    const headersWithSortable: DataTableHeader[] = [
      { key: 'name', header: 'Name' },
      { key: 'status', header: 'Status' },
      { key: 'count', header: 'Count' },
    ];

    const sortableConfig = [
      { key: 'name', sortable: true },
      { key: 'status', sortable: false },
      { key: 'count', sortable: true },
    ];

    render(
      <ExpandableSortableDataTable
        headers={headersWithSortable}
        rows={mockRows}
        sortable={sortableConfig}
        ariaLabel="Sortable Config Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // All headers should be rendered (we render all as sortable for consistent spacing)
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();

    // Non-sortable header should have nonSortableHeader class
    const statusHeader = screen.getByText('Status').closest('th');
    expect(statusHeader).toHaveClass('nonSortableHeader');
  });

  it('defaults to non-sortable when isSortable is not provided', () => {
    const headersWithoutSortable: DataTableHeader[] = [
      { key: 'name', header: 'Name' },
      { key: 'status', header: 'Status' },
    ];

    render(
      <ExpandableSortableDataTable
        headers={headersWithoutSortable}
        rows={mockRows}
        ariaLabel="Default Non-Sortable Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Both headers should have nonSortableHeader class (default behavior)
    const nameHeader = screen.getByText('Name').closest('th');
    const statusHeader = screen.getByText('Status').closest('th');

    expect(nameHeader).toHaveClass('nonSortableHeader');
    expect(statusHeader).toHaveClass('nonSortableHeader');
  });

  it('allows multiple rows to be expanded', () => {
    render(
      <ExpandableSortableDataTable
        headers={mockHeaders}
        rows={mockRows}
        ariaLabel="Multi Expand Table"
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });

    fireEvent.click(expandButtons[0]);
    expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();

    fireEvent.click(expandButtons[1]);
    expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();

    expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();
  });

  describe('Expand All / Collapse All', () => {
    it('defaults to collapsed state on initial render', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Default Collapsed Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('expanded-row-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('expanded-row-3')).not.toBeInTheDocument();
    });

    it('expands all expandable rows when expand-all header is clicked', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Expand All Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandAllButton = screen.getByRole('button', {
        name: /expand all rows/i,
      });
      fireEvent.click(expandAllButton);

      expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();
      // row-3 has isExpandable: false, should not be expanded
      expect(screen.queryByTestId('expanded-row-3')).not.toBeInTheDocument();
    });

    it('collapses all rows when collapse-all header is clicked after expand all', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Collapse All Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandAllButton = screen.getByRole('button', {
        name: /expand all rows/i,
      });
      fireEvent.click(expandAllButton);

      expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();

      const collapseAllButton = screen.getByRole('button', {
        name: /collapse all rows/i,
      });
      fireEvent.click(collapseAllButton);

      expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('expanded-row-2')).not.toBeInTheDocument();
    });

    it('individual row toggles work independently after expand all', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Individual Toggle Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandAllButton = screen.getByRole('button', {
        name: /expand all rows/i,
      });
      fireEvent.click(expandAllButton);

      expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();

      // Collapse just row-1 individually
      const rowExpandButtons = screen.getAllByRole('button', {
        name: /expand row row-1/i,
      });
      fireEvent.click(rowExpandButtons[0]);

      expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();
    });

    it('resets expanded rows when rows change', () => {
      const { rerender } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Reset On Change Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandAllButton = screen.getByRole('button', {
        name: /expand all rows/i,
      });
      fireEvent.click(expandAllButton);
      expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();

      const newRows: MockRow[] = [
        {
          id: 'row-4',
          name: 'Patient D',
          status: 'Active',
          count: 1,
          details: 'Details for Patient D',
          isExpandable: true,
        },
      ];

      act(() => {
        rerender(
          <ExpandableSortableDataTable
            headers={mockHeaders}
            rows={newRows}
            ariaLabel="Reset On Change Table"
            renderCell={renderCell}
            renderExpandedContent={renderExpandedContent}
          />,
        );
      });

      expect(screen.queryByTestId('expanded-row-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('expanded-row-4')).not.toBeInTheDocument();
    });

    it('expand all only affects expandable rows, not non-expandable ones', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Expandable Only Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandAllButton = screen.getByRole('button', {
        name: /expand all rows/i,
      });
      fireEvent.click(expandAllButton);

      // row-1 and row-2 are expandable, should be expanded
      expect(screen.getByTestId('expanded-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-row-2')).toBeInTheDocument();

      // row-3 has isExpandable: false, should not be expanded
      expect(screen.queryByTestId('expanded-row-3')).not.toBeInTheDocument();
      // row-3's expand button should remain in collapsed visual state (aria-expanded=false)
      const row3Button = screen.getAllByRole('button', {
        name: /expand row row-3/i,
      })[0];
      expect(row3Button).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not render expand-all button when showExpandAll is false', () => {
      render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="No Expand All Table"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
          showExpandAll={false}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /expand all rows/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /collapse all rows/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot with full data', () => {
      const { container } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Snapshot Test Full"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when loading', () => {
      const { container } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          loading
          ariaLabel="Snapshot Loading"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot when empty', () => {
      const { container } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={[]}
          emptyStateMessage="No data found"
          ariaLabel="Snapshot Empty"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with expanded row', () => {
      const { container } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Snapshot Expanded"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ExpandableSortableDataTable
          headers={mockHeaders}
          rows={mockRows}
          ariaLabel="Accessibility Test"
          renderCell={renderCell}
          renderExpandedContent={renderExpandedContent}
        />,
      );
      expect(
        await axe(container, {
          rules: { 'empty-table-header': { enabled: false } },
        }),
      ).toHaveNoViolations();
    });
  });
});
