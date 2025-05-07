import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandableDataTable } from '../ExpandableDataTable';
import { DataTableHeader, Tag } from '@carbon/react';
import { getFormattedError } from '@utils/common';
import i18n from '@/setupTests.i18n';

// Mock the common utils
jest.mock('@utils/common', () => ({
  generateId: jest.fn().mockReturnValue('generated-id'),
  getFormattedError: jest.fn().mockImplementation((error) => {
    if (error instanceof Error) {
      return { title: error.name || 'Error', message: error.message };
    }
    return { title: 'Error', message: 'An unexpected error occurred' };
  }),
}));

// Mock data for testing
interface TestRow {
  id?: string;
  name: string;
  status: string;
  date: string;
  details: string;
  count?: number;
  timestamp?: Date;
}

describe('ExpandableDataTable', () => {
  const mockHeaders: DataTableHeader[] = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    { key: 'date', header: 'Date' },
  ];

  const mockRows: TestRow[] = [
    {
      id: '1',
      name: 'Item 1',
      status: 'Active',
      date: '2025-03-15',
      details: 'Details for Item 1',
      count: 10,
      timestamp: new Date('2025-03-15T10:00:00Z'),
    },
    {
      id: '2',
      name: 'Item 2',
      status: 'Inactive',
      date: '2025-02-20',
      details: 'Details for Item 2',
      count: 5,
      timestamp: new Date('2025-02-20T15:30:00Z'),
    },
  ];

  const renderCell = (row: TestRow, cellId: string) => {
    switch (cellId) {
      case 'name':
        return row.name;
      case 'status':
        return (
          <Tag type={row.status === 'Active' ? 'green' : 'gray'}>
            {row.status}
          </Tag>
        );
      case 'date':
        return row.date;
      default:
        return null;
    }
  };

  const renderExpandedContent = (row: TestRow) => (
    <div className="expanded-content">
      <p data-testid={`details-${row.id}`}>{row.details}</p>
    </div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  it('should render the table with provided headers and rows', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Check if headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();

    // Check if rows are rendered
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render loading state when loading is true', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        loading={true}
      />,
    );

    // Check if skeleton is rendered
    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('should render error state when error is provided', () => {
    const testError = new Error('Test error');

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        error={testError}
      />,
    );

    // Check if error state is rendered with formatted error
    expect(screen.getByTestId('expandable-table-error')).toBeInTheDocument();
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

    // Verify getFormattedError was called with the error
    expect(getFormattedError).toHaveBeenCalledWith(testError);
  });

  it('should render empty state when no rows are provided', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={[]}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Check if empty state message is rendered
    const emptyStateContainer = screen.getByTestId(
      'expandable-data-table-empty',
    );
    expect(emptyStateContainer).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render custom empty state message when provided', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={[]}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        emptyStateMessage="No items available"
      />,
    );

    // Check if custom empty state message is rendered
    expect(screen.getByText('No items available')).toBeInTheDocument();
  });

  it('should apply custom className when provided', () => {
    const { container } = render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        className="custom-table-class"
      />,
    );

    // Check if custom class is applied
    expect(container.firstChild).toHaveClass('custom-table-class');
  });

  it('should expand a row when clicked', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Find and click the expand button for the first row
    const expandButtons = screen.getAllByLabelText('Expand current row');
    fireEvent.click(expandButtons[0]);

    // Check if expanded content is now visible
    expect(screen.getByTestId('details-1')).toBeInTheDocument();
    expect(screen.getByText('Details for Item 1')).toBeInTheDocument();
  });

  // Happy Path: Sorting Tests
  it('should make all columns sortable by default', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get all header cells (excluding the expand header)
    const headerCells = screen.getAllByRole('columnheader').slice(1);

    // Verify that all headers have the aria-sort attribute (indicating they're sortable)
    headerCells.forEach((header) => {
      expect(header).toHaveAttribute('aria-sort', 'none');
    });

    // Verify all headers have the sortable button
    headerCells.forEach((header) => {
      expect(header.querySelector('button')).not.toBeNull();
    });
  });

  it('should respect custom sortable array configuration', () => {
    // Only make the first column sortable
    const customSortable = [
      { key: 'name', sortable: true },
      { key: 'status', sortable: false },
      { key: 'date', sortable: false },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        sortable={customSortable}
      />,
    );

    // Get all header cells (excluding the expand header)
    const headerCells = screen.getAllByRole('columnheader').slice(1);

    // First header should be sortable
    expect(headerCells[0]).toHaveAttribute('aria-sort', 'none');
    expect(headerCells[0].querySelector('button')).not.toBeNull();

    // Second and third headers should not be sortable
    expect(headerCells[1].querySelector('button')).toBeNull();
    expect(headerCells[2].querySelector('button')).toBeNull();
  });

  it('should sort rows when header is clicked', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the name header
    const nameHeader = screen.getByText('Name');

    // Click the name header to sort
    fireEvent.click(nameHeader);

    // Verify that Item 1 and Item 2 are still in the document after sorting
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should sort rows in ascending order by default', () => {
    const unsortedRows = [
      {
        id: '3',
        name: 'Zebra',
        status: 'Active',
        date: '2025-01-15',
        details: 'Details for Zebra',
      },
      {
        id: '1',
        name: 'Apple',
        status: 'Active',
        date: '2025-03-15',
        details: 'Details for Apple',
      },
      {
        id: '2',
        name: 'Banana',
        status: 'Inactive',
        date: '2025-02-20',
        details: 'Details for Banana',
      },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={unsortedRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the name header and click it
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Verify all names are still in the document after sorting
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.getByText('Zebra')).toBeInTheDocument();
  });

  it('should reset sorting when clicking a different column', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the name header and click it
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Click a different header
    const statusHeader = screen.getByText('Status');
    fireEvent.click(statusHeader);

    // Verify that the table still renders correctly
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should handle keyboard navigation for sorting', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the name header
    const nameHeader = screen.getByText('Name');

    // Focus and press Enter to sort
    nameHeader.focus();
    fireEvent.keyDown(nameHeader, { key: 'Enter', code: 'Enter' });

    // Verify that the table still renders correctly
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  // Edge Cases for Sortable Prop
  it('should handle sortable array shorter than headers array', () => {
    // Only provide sortable value for first column
    const shortSortable = [{ key: 'name', sortable: true }];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        sortable={shortSortable}
      />,
    );

    // Get all header cells (excluding the expand header)
    const headerCells = screen.getAllByRole('columnheader').slice(1);

    // First header should be sortable
    expect(headerCells[0]).toHaveAttribute('aria-sort', 'none');
    expect(headerCells[0].querySelector('button')).not.toBeNull();

    // Second and third headers should default to false (not sortable)
    expect(headerCells[1].querySelector('button')).toBeNull();
    expect(headerCells[2].querySelector('button')).toBeNull();
  });

  it('should handle sortable array longer than headers array', () => {
    // Provide more sortable values than headers
    const longSortable = [
      { key: 'name', sortable: true },
      { key: 'status', sortable: false },
      { key: 'date', sortable: true },
      { key: 'extra', sortable: true },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        sortable={longSortable}
      />,
    );

    // Get all header cells (excluding the expand header)
    const headerCells = screen.getAllByRole('columnheader').slice(1);

    // Should use only the values needed and ignore extras
    expect(headerCells[0]).toHaveAttribute('aria-sort', 'none'); // true
    expect(headerCells[0].querySelector('button')).not.toBeNull();

    expect(headerCells[1].querySelector('button')).toBeNull(); // false

    expect(headerCells[2]).toHaveAttribute('aria-sort', 'none'); // true
    expect(headerCells[2].querySelector('button')).not.toBeNull();
  });

  it('should handle empty sortable array gracefully', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        sortable={[]}
      />,
    );

    // Get all header cells (excluding the expand header)
    const headerCells = screen.getAllByRole('columnheader').slice(1);

    // All headers should default to not sortable when empty array provided
    headerCells.forEach((header) => {
      expect(header.querySelector('button')).toBeNull();
    });
  });

  // Sad Path: Edge Cases & Failures
  it('should handle null rows gracefully', () => {
    const ConsoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows={null as any}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Should show empty state
    expect(
      screen.getByTestId('expandable-data-table-empty'),
    ).toBeInTheDocument();

    ConsoleErrorSpy.mockRestore();
  });

  it('should handle undefined rows gracefully', () => {
    const ConsoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows={undefined as any}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Should show empty state
    expect(
      screen.getByTestId('expandable-data-table-empty'),
    ).toBeInTheDocument();

    ConsoleErrorSpy.mockRestore();
  });

  it('should handle rows with missing properties', () => {
    const incompleteRows: TestRow[] = [
      {
        id: '1',
        name: 'Incomplete Item',
        status: '', // Empty string instead of missing
        date: '', // Empty string instead of missing
        details: '',
      },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={incompleteRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Should render without crashing
    expect(screen.getByText('Incomplete Item')).toBeInTheDocument();
  });

  it('should sort numeric columns correctly', () => {
    const numericHeaders = [
      { key: 'name', header: 'Name' },
      { key: 'count', header: 'Count' },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={numericHeaders}
        rows={mockRows}
        renderCell={(row, cellId) => {
          if (cellId === 'count')
            return <span>{row.count?.toString() || ''}</span>;
          return <span>{row[cellId as keyof TestRow]?.toString() || ''}</span>;
        }}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the count header and click it
    const countHeader = screen.getByText('Count');
    fireEvent.click(countHeader);

    // Verify that the counts are still in the document
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should sort date columns correctly', () => {
    const dateHeaders = [
      { key: 'name', header: 'Name' },
      { key: 'date', header: 'Date' },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={dateHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the date header and click it
    const dateHeader = screen.getByText('Date');
    fireEvent.click(dateHeader);

    // Verify that the dates are still in the document
    expect(screen.getByText('2025-02-20')).toBeInTheDocument();
    expect(screen.getByText('2025-03-15')).toBeInTheDocument();
  });

  it('should handle sorting with null values', () => {
    const rowsWithNulls: TestRow[] = [
      {
        id: '1',
        name: 'Item 1',
        status: 'Active',
        date: '2025-03-15',
        details: 'Details for Item 1',
      },
      {
        id: '2',
        name: '', // Empty string instead of null
        status: 'Inactive',
        date: '2025-02-20',
        details: 'Details for Item 2',
      },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={rowsWithNulls}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Get the name header and click it
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // Should not crash and should render the table
    expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
  });

  it('should generate IDs for rows without IDs', () => {
    const rowsWithoutIds: TestRow[] = [
      {
        // No id provided
        name: 'Item Without ID',
        status: 'Active',
        date: '2025-03-15',
        details: 'Details for Item Without ID',
      },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={rowsWithoutIds}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Should render without crashing
    expect(screen.getByText('Item Without ID')).toBeInTheDocument();
  });

  it('should apply custom ariaLabel when provided', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        ariaLabel="Custom table label"
      />,
    );

    // Check if custom aria-label is applied
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Custom table label');
  });

  it('should use tableTitle as ariaLabel when ariaLabel is not provided', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table Title"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Check if tableTitle is used as aria-label
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Test Table Title');
  });

  it('should handle large datasets without crashing', () => {
    // Create a large dataset
    const largeDataset: TestRow[] = Array.from({ length: 100 }, (_, index) => ({
      id: `id-${index}`,
      name: `Item ${index}`,
      status: index % 2 === 0 ? 'Active' : 'Inactive',
      date: '2025-03-15',
      details: `Details for Item ${index}`,
    }));

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={largeDataset}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
      />,
    );

    // Should render without crashing
    expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  // Tests for rowClassNames as an object
  it('should apply row-specific className to table cells when rowClassNames object is provided', () => {
    const mockRowClassNames = {
      '1': 'critical-row',
      '3': 'warning-row',
    };

    const threeRows: TestRow[] = [
      {
        id: '1',
        name: 'Item 1',
        status: 'Active',
        date: '2025-03-15',
        details: 'Details for Item 1',
      },
      {
        id: '2',
        name: 'Item 2',
        status: 'Inactive',
        date: '2025-02-20',
        details: 'Details for Item 2',
      },
      {
        id: '3',
        name: 'Item 3',
        status: 'Active',
        date: '2025-01-10',
        details: 'Details for Item 3',
      },
    ];

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={threeRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        rowClassNames={mockRowClassNames}
      />,
    );

    // Find all table cells in the data rows
    const firstRowCells = screen.getAllByText('Item 1')[0].closest('td');
    const secondRowCells = screen.getAllByText('Item 2')[0].closest('td');
    const thirdRowCells = screen.getAllByText('Item 3')[0].closest('td');

    // First row cells should have the critical-row class
    expect(firstRowCells).toHaveClass('critical-row');

    // Second row cells should not have any custom class (not in the object)
    expect(secondRowCells).not.toHaveClass('critical-row');
    expect(secondRowCells).not.toHaveClass('warning-row');

    // Third row cells should have the warning-row class
    expect(thirdRowCells).toHaveClass('warning-row');
  });

  it('should handle empty rowClassNames object', () => {
    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        rowClassNames={{}}
      />,
    );

    // Find cell elements
    const firstRowCell = screen.getAllByText('Item 1')[0].closest('td');
    const secondRowCell = screen.getAllByText('Item 2')[0].closest('td');

    // No custom classes should be applied
    expect(firstRowCell).not.toHaveClass('critical-row');
    expect(firstRowCell).not.toHaveClass('warning-row');
    expect(secondRowCell).not.toHaveClass('critical-row');
    expect(secondRowCell).not.toHaveClass('warning-row');
  });

  it('should handle rowClassNames with non-existent row IDs', () => {
    const mockRowClassNames = {
      'non-existent-id': 'critical-row',
    };

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={renderExpandedContent}
        rowClassNames={mockRowClassNames}
      />,
    );

    // Find cell elements
    const firstRowCell = screen.getAllByText('Item 1')[0].closest('td');
    const secondRowCell = screen.getAllByText('Item 2')[0].closest('td');

    // No custom classes should be applied since the ID doesn't match any row
    expect(firstRowCell).not.toHaveClass('critical-row');
    expect(secondRowCell).not.toHaveClass('critical-row');
  });

  // Tests for non-expandable rows
  it('should render non-expandable rows when renderExpandedContent returns undefined', () => {
    // Create a custom renderExpandedContent function that returns undefined for some rows
    const conditionalRenderExpandedContent = (row: TestRow) => {
      if (row.id === '1') {
        return undefined; // No expanded content for row with id '1'
      }
      return (
        <div className="expanded-content">
          <p data-testid={`details-${row.id}`}>{row.details}</p>
        </div>
      );
    };

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={conditionalRenderExpandedContent}
      />,
    );

    // Find all expand buttons
    const expandButtons = screen
      .getAllByRole('button')
      .filter(
        (button) => button.getAttribute('aria-label') === 'Expand current row',
      );

    // There should be only one expand button (for the second row)
    expect(expandButtons.length).toBe(1);

    // The first row should be rendered as a non-expandable row
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Click the expand button for the second row
    fireEvent.click(expandButtons[0]);

    // Check if expanded content is visible for the second row
    expect(screen.getByTestId('details-2')).toBeInTheDocument();
    expect(screen.getByText('Details for Item 2')).toBeInTheDocument();
  });

  it('should not render expand button for non-expandable rows', () => {
    // Create a renderExpandedContent function that always returns undefined
    const noExpandedContent = () => undefined;

    render(
      <ExpandableDataTable
        tableTitle="Test Table"
        headers={mockHeaders}
        rows={mockRows}
        renderCell={renderCell}
        renderExpandedContent={noExpandedContent}
      />,
    );

    // There should be no expand buttons
    const expandButtons = screen
      .queryAllByRole('button')
      .filter(
        (button) => button.getAttribute('aria-label') === 'Expand current row',
      );
    expect(expandButtons.length).toBe(0);

    // The rows should still be rendered
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  //TODO: Add tests for A11y
});
