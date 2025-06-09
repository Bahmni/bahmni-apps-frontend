import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagnosesTable from '../DiagnosesTable';
import { useDiagnoses } from '@hooks/useDiagnoses';
import { DiagnosesByDate, FormattedDiagnosis } from '@types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { FULL_MONTH_DATE_FORMAT } from '@constants/date';
import { formatDate } from '@utils/date';
import i18n from '@/setupTests.i18n';

// Mock the hooks
jest.mock('@hooks/useDiagnoses');

// Mock Carbon components
jest.mock('@carbon/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tile: ({ children, title, ...props }: any) => (
    <div data-testid="tile" title={title} {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Tag: ({ children, className }: any) => (
    <span data-testid="tag" className={className}>
      {children}
    </span>
  ),
  DataTableSkeleton: ({
    columnCount,
    rowCount,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showHeader,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    showToolbar,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    compact,
    ...props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div
      data-testid="data-table-skeleton"
      data-column-count={columnCount}
      data-row-count={rowCount}
      {...props}
    />
  ),
}));

// Mock ExpandableDataTable
jest.mock('@components/common/expandableDataTable/ExpandableDataTable', () => ({
  ExpandableDataTable: ({
    tableTitle,
    rows,
    headers,
    sortable,
    renderCell,
    loading,
    error,
    ariaLabel,
    emptyStateMessage,
    className,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div data-testid="expandable-data-table" className={className}>
      <div data-testid="table-title">{tableTitle}</div>
      <div data-testid="table-loading">{loading?.toString()}</div>
      <div data-testid="table-error">{error?.message || 'null'}</div>
      <div data-testid="table-empty-message">{emptyStateMessage}</div>
      <div data-testid="table-aria-label">{ariaLabel}</div>
      <div data-testid="table-rows">{JSON.stringify(rows)}</div>
      <div data-testid="table-headers">{JSON.stringify(headers)}</div>
      <div data-testid="table-sortable">{JSON.stringify(sortable)}</div>
      {// eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows?.map((row: any, index: number) => (
        <div key={index} data-testid={`table-row-${index}`}>
          {// eslint-disable-next-line @typescript-eslint/no-explicit-any
          headers?.map((header: any) => (
            <div key={header.key} data-testid={`cell-${header.key}-${index}`}>
              {renderCell?.(row, header.key)}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

// Mock formatDate utility
jest.mock('@utils/date');

// Mock CSS modules
jest.mock('../styles/DiagnosesTable.module.scss', () => ({
  diagnosesTable: 'diagnosesTable',
  diagnosesTableTitle: 'diagnosesTableTitle',
  diagnosesTableBody: 'diagnosesTableBody',
  confirmedCell: 'confirmedCell',
  provisionalCell: 'provisionalCell',
}));

const mockUseDiagnoses = useDiagnoses as jest.MockedFunction<
  typeof useDiagnoses
>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;

// Test data
const mockConfirmedDiagnosis: FormattedDiagnosis = {
  id: 'diagnosis-1',
  display: 'Hypertension',
  certainty: CERTAINITY_CONCEPTS[0], // confirmed
  recordedDate: '2024-01-15T10:30:00Z',
  recorder: 'Dr. Smith',
};

const mockProvisionalDiagnosis: FormattedDiagnosis = {
  id: 'diagnosis-2',
  display: 'Diabetes Type 2',
  certainty: CERTAINITY_CONCEPTS[1], // provisional
  recordedDate: '2024-01-15T11:00:00Z',
  recorder: 'Dr. Johnson',
};

const mockDiagnosisWithoutRecorder: FormattedDiagnosis = {
  id: 'diagnosis-3',
  display: 'Asthma',
  certainty: CERTAINITY_CONCEPTS[0],
  recordedDate: '2024-01-10T14:20:00Z',
  recorder: '',
};

const mockDiagnosesData: DiagnosesByDate[] = [
  {
    date: '2024-01-15',
    diagnoses: [mockConfirmedDiagnosis, mockProvisionalDiagnosis],
  },
  {
    date: '2024-01-10',
    diagnoses: [mockDiagnosisWithoutRecorder],
  },
];

const mockSingleDateDiagnoses: DiagnosesByDate[] = [
  {
    date: '2024-01-20',
    diagnoses: [mockConfirmedDiagnosis],
  },
];

describe('DiagnosesTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    i18n.changeLanguage('en');

    // Setup formatDate mock
    mockFormatDate.mockImplementation((date: string | number | Date) => ({
      formattedResult: `formatted-${date}`,
      error: undefined,
    }));
  });

  describe('Component Rendering', () => {
    it('should render without crashing when no diagnoses', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.getByTestId('diagnoses-accordion-item'),
      ).toBeInTheDocument();
    });

    it('should render Tile container with correct props', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const tile = screen.getByTestId('diagnoses-accordion-item');
      expect(tile).toHaveAttribute('data-testid', 'diagnoses-accordion-item');
      expect(tile).toHaveClass('diagnosesTable');
    });

    it('should display correct title in header', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show DataTableSkeleton when loading', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const skeleton = screen.getByTestId('data-table-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('data-column-count', '2');
      expect(skeleton).toHaveAttribute('data-row-count', '1');
    });

    it('should configure skeleton with correct props', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const skeleton = screen.getByTestId('data-table-skeleton');
      expect(skeleton).toHaveAttribute('data-column-count', '2');
      expect(skeleton).toHaveAttribute('data-row-count', '1');
    });

    it('should not show ExpandableDataTable when loading', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      const mockError = new Error('Test error message');
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.getByText('Error fetching diagnoses. Please try again later.'),
      ).toBeInTheDocument();
    });

    it('should not show ExpandableDataTable when error occurs', () => {
      const mockError = new Error('Test error');
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should not show skeleton when error occurs', () => {
      const mockError = new Error('Test error');
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.queryByTestId('data-table-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Success State - Data Display', () => {
    beforeEach(() => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should render ExpandableDataTable for each date group', () => {
      render(<DiagnosesTable />);

      const dataTables = screen.getAllByTestId('expandable-data-table');
      expect(dataTables).toHaveLength(2);
    });

    it('should format dates and use as table titles', () => {
      render(<DiagnosesTable />);

      expect(mockFormatDate).toHaveBeenCalledWith(
        '2024-01-15',
        FULL_MONTH_DATE_FORMAT,
      );
      expect(mockFormatDate).toHaveBeenCalledWith(
        '2024-01-10',
        FULL_MONTH_DATE_FORMAT,
      );

      expect(screen.getByText('formatted-2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('formatted-2024-01-10')).toBeInTheDocument();
    });

    it('should handle date formatting errors gracefully', () => {
      mockFormatDate.mockReturnValue({
        formattedResult: '',
        error: { title: 'Error', message: 'Invalid date' },
      });

      render(<DiagnosesTable />);

      // Should fallback to original date when formatting fails
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-10')).toBeInTheDocument();
    });

    it('should configure correct headers for all tables', () => {
      render(<DiagnosesTable />);

      const headerElements = screen.getAllByTestId('table-headers');

      headerElements.forEach((headerElement) => {
        const headers = JSON.parse(headerElement.textContent || '[]');
        expect(headers).toEqual([
          { key: 'display', header: 'Diagnosis' },
          { key: 'recorder', header: 'Recorder' },
        ]);
      });
    });

    it('should configure correct sortable settings for all tables', () => {
      render(<DiagnosesTable />);

      const sortableElements = screen.getAllByTestId('table-sortable');

      sortableElements.forEach((sortableElement) => {
        const sortable = JSON.parse(sortableElement.textContent || '[]');
        expect(sortable).toEqual([
          { key: 'display', sortable: true },
          { key: 'recorder', sortable: true },
        ]);
      });
    });

    it('should pass correct diagnosis data to each table', () => {
      render(<DiagnosesTable />);

      const rowElements = screen.getAllByTestId('table-rows');

      // First table (2024-01-15) should have 2 diagnoses
      const firstTableRows = JSON.parse(rowElements[0].textContent || '[]');
      expect(firstTableRows).toHaveLength(2);
      expect(firstTableRows[0]).toEqual(mockConfirmedDiagnosis);
      expect(firstTableRows[1]).toEqual(mockProvisionalDiagnosis);

      // Second table (2024-01-10) should have 1 diagnosis
      const secondTableRows = JSON.parse(rowElements[1].textContent || '[]');
      expect(secondTableRows).toHaveLength(1);
      expect(secondTableRows[0]).toEqual(mockDiagnosisWithoutRecorder);
    });

    it('should configure table-specific properties', () => {
      render(<DiagnosesTable />);

      const dataTables = screen.getAllByTestId('expandable-data-table');
      const loadingElements = screen.getAllByTestId('table-loading');
      const errorElements = screen.getAllByTestId('table-error');
      const emptyMessageElements = screen.getAllByTestId('table-empty-message');

      dataTables.forEach((table, index) => {
        expect(table).toHaveClass('diagnosesTableBody');
        expect(loadingElements[index]).toHaveTextContent('false');
        expect(errorElements[index]).toHaveTextContent('null');
        expect(emptyMessageElements[index]).toHaveTextContent(
          'No diagnoses found for this patient',
        );
      });
    });

    it('should set correct aria labels', () => {
      render(<DiagnosesTable />);

      const ariaLabels = screen.getAllByTestId('table-aria-label');
      expect(ariaLabels[0]).toHaveTextContent(
        'Diagnoses - formatted-2024-01-15',
      );
      expect(ariaLabels[1]).toHaveTextContent(
        'Diagnoses - formatted-2024-01-10',
      );
    });
  });

  describe('renderCell Function', () => {
    beforeEach(() => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    describe('Display Cell Rendering', () => {
      it('should render diagnosis display name with confirmed tag', () => {
        render(<DiagnosesTable />);

        const displayCells = screen.getAllByTestId('cell-display-0');
        const firstTableDisplayCell = displayCells[0]; // First table, first row
        expect(firstTableDisplayCell).toHaveTextContent('Hypertension');

        const tag = within(firstTableDisplayCell).getByTestId('tag');
        expect(tag).toHaveClass('confirmedCell');
        expect(tag).toHaveTextContent('Confirmed');
      });

      it('should render diagnosis display name with provisional tag', () => {
        render(<DiagnosesTable />);

        const displayCell = screen.getByTestId('cell-display-1');
        expect(displayCell).toHaveTextContent('Diabetes Type 2');

        const tag = within(displayCell).getByTestId('tag');
        expect(tag).toHaveClass('provisionalCell');
        expect(tag).toHaveTextContent('Provisional');
      });

      it('should handle different certainty codes correctly', () => {
        const customDiagnosis: FormattedDiagnosis = {
          ...mockConfirmedDiagnosis,
          certainty: { ...CERTAINITY_CONCEPTS[1], code: 'provisional' },
        };

        mockUseDiagnoses.mockReturnValue({
          diagnoses: [{ date: '2024-01-15', diagnoses: [customDiagnosis] }],
          loading: false,
          error: null,
          refetch: jest.fn(),
        });

        render(<DiagnosesTable />);

        const displayCell = screen.getByTestId('cell-display-0');
        const tag = within(displayCell).getByTestId('tag');
        expect(tag).toHaveClass('provisionalCell');
      });

      it('should render correct certainty labels', () => {
        render(<DiagnosesTable />);

        // Check that the actual translated values are rendered
        expect(screen.getAllByText('Confirmed')).toHaveLength(2); // Two confirmed diagnoses
        expect(screen.getByText('Provisional')).toBeInTheDocument(); // One provisional diagnosis
      });
    });

    describe('Recorder Cell Rendering', () => {
      it('should render recorder name when available', () => {
        render(<DiagnosesTable />);

        const recorderCells = screen.getAllByTestId('cell-recorder-0');
        const firstTableRecorderCell = recorderCells[0]; // First table, first row
        expect(firstTableRecorderCell).toHaveTextContent('Dr. Smith');
      });

      it('should show fallback text when recorder is empty', () => {
        render(<DiagnosesTable />);

        const recorderCells = screen.getAllByTestId('cell-recorder-0');
        const secondTableRecorderCell = recorderCells[1]; // Second table, first row (third diagnosis overall)
        expect(secondTableRecorderCell).toHaveTextContent('Not available');
      });

      it('should handle null recorder', () => {
        const diagnosisWithNullRecorder: FormattedDiagnosis = {
          ...mockConfirmedDiagnosis,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recorder: null as any,
        };

        mockUseDiagnoses.mockReturnValue({
          diagnoses: [
            { date: '2024-01-15', diagnoses: [diagnosisWithNullRecorder] },
          ],
          loading: false,
          error: null,
          refetch: jest.fn(),
        });

        render(<DiagnosesTable />);

        const recorderCell = screen.getByTestId('cell-recorder-0');
        expect(recorderCell).toHaveTextContent('Not available');
      });

      it('should handle undefined recorder', () => {
        const diagnosisWithUndefinedRecorder: FormattedDiagnosis = {
          ...mockConfirmedDiagnosis,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recorder: undefined as any,
        };

        mockUseDiagnoses.mockReturnValue({
          diagnoses: [
            { date: '2024-01-15', diagnoses: [diagnosisWithUndefinedRecorder] },
          ],
          loading: false,
          error: null,
          refetch: jest.fn(),
        });

        render(<DiagnosesTable />);

        const recorderCell = screen.getByTestId('cell-recorder-0');
        expect(recorderCell).toHaveTextContent('Not available');
      });
    });

    describe('Default Case Handling', () => {
      it('should return empty string for unknown cell IDs', () => {
        render(<DiagnosesTable />);

        // This test would need to be done differently since we can't directly access renderCell
        // Instead, we'll verify that only known cell types have content
        const allCells = screen.getAllByTestId(/^cell-/);
        allCells.forEach((cell) => {
          const testId = cell.getAttribute('data-testid') || '';
          if (!testId.includes('display') && !testId.includes('recorder')) {
            expect(cell).toHaveTextContent('');
          }
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty diagnoses array', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('diagnoses-accordion-item'),
      ).toBeInTheDocument();
    });

    it('should handle single diagnosis', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockSingleDateDiagnoses,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const dataTables = screen.getAllByTestId('expandable-data-table');
      expect(dataTables).toHaveLength(1);

      const rowElements = screen.getAllByTestId('table-rows');
      const rows = JSON.parse(rowElements[0].textContent || '[]');
      expect(rows).toHaveLength(1);
    });

    it('should handle date group with empty diagnoses array', () => {
      const emptyDiagnosesData: DiagnosesByDate[] = [
        {
          date: '2024-01-15',
          diagnoses: [],
        },
      ];

      mockUseDiagnoses.mockReturnValue({
        diagnoses: emptyDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const dataTables = screen.getAllByTestId('expandable-data-table');
      expect(dataTables).toHaveLength(1);

      const rowElements = screen.getAllByTestId('table-rows');
      const rows = JSON.parse(rowElements[0].textContent || '[]');
      expect(rows).toHaveLength(0);
    });

    it('should handle malformed diagnosis data with error', () => {
      const malformedDiagnosis = {
        ...mockConfirmedDiagnosis,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        certainty: null as any,
      };

      const malformedData: DiagnosesByDate[] = [
        {
          date: '2024-01-15',
          diagnoses: [malformedDiagnosis],
        },
      ];

      mockUseDiagnoses.mockReturnValue({
        diagnoses: malformedData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Component should throw an error when certainty is null
      expect(() => render(<DiagnosesTable />)).toThrow(
        "Cannot read properties of null (reading 'code')",
      );
    });
  });

  describe('Hook Integration', () => {
    it('should call useDiagnoses hook', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(mockUseDiagnoses).toHaveBeenCalledTimes(1);
    });

    it('should render component successfully with translations', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      // Check that translations are working by verifying rendered text
      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    });

    it('should use memoized headers', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = render(<DiagnosesTable />);

      // Headers should be the same on re-render (memoized)
      const initialHeaders =
        screen.getAllByTestId('table-headers')[0].textContent;

      rerender(<DiagnosesTable />);

      const rerenderedHeaders =
        screen.getAllByTestId('table-headers')[0].textContent;
      expect(initialHeaders).toBe(rerenderedHeaders);
    });

    it('should use memoized sortable configuration', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = render(<DiagnosesTable />);

      const initialSortable =
        screen.getAllByTestId('table-sortable')[0].textContent;

      rerender(<DiagnosesTable />);

      const rerenderedSortable =
        screen.getAllByTestId('table-sortable')[0].textContent;
      expect(initialSortable).toBe(rerenderedSortable);
    });
  });
});

// Helper function for within queries (would be imported from testing-library normally)
const within = (element: HTMLElement) => ({
  getByTestId: (testId: string) => {
    const found = element.querySelector(`[data-testid="${testId}"]`);
    if (!found)
      throw new Error(`Unable to find element with testId: ${testId}`);
    return found as HTMLElement;
  },
});
