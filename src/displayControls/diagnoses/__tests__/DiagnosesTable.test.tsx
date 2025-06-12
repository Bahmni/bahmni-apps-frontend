import React from 'react';
import { render, screen } from '@testing-library/react';
import DiagnosesTable from '../DiagnosesTable';
import { useDiagnoses } from '@hooks/useDiagnoses';
import { Diagnosis } from '@types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { FULL_MONTH_DATE_FORMAT, ISO_DATE_FORMAT } from '@constants/date';
import { formatDate } from '@utils/date';
import { groupByDate } from '@utils/common';
import { sortDiagnosesByCertainty } from '@utils/diagnosis';
import i18n from '@/setupTests.i18n';

// Mock the hooks
jest.mock('@hooks/useDiagnoses');

// Mock utilities
jest.mock('@utils/date');
jest.mock('@utils/common');
jest.mock('@utils/diagnosis');

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
    isOpen,
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
      <div data-testid="table-is-open">{isOpen?.toString()}</div>
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

// Mock CSS modules
jest.mock('../styles/DiagnosesTable.module.scss', () => ({
  diagnosesTable: 'diagnosesTable',
  diagnosesTableTitle: 'diagnosesTableTitle',
  diagnosesTableBody: 'diagnosesTableBody',
  diagnosesTableBodyError: 'diagnosesTableBodyError',
  confirmedCell: 'confirmedCell',
  provisionalCell: 'provisionalCell',
}));

const mockUseDiagnoses = useDiagnoses as jest.MockedFunction<
  typeof useDiagnoses
>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockGroupByDate = groupByDate as jest.MockedFunction<typeof groupByDate>;
const mockSortDiagnosesByCertainty =
  sortDiagnosesByCertainty as jest.MockedFunction<
    typeof sortDiagnosesByCertainty
  >;

// Test data
const mockConfirmedDiagnosis: Diagnosis = {
  id: 'diagnosis-1',
  display: 'Hypertension',
  certainty: CERTAINITY_CONCEPTS[0], // confirmed
  recordedDate: '2024-01-15T10:30:00Z',
  recorder: 'Dr. Smith',
};

const mockProvisionalDiagnosis: Diagnosis = {
  id: 'diagnosis-2',
  display: 'Diabetes Type 2',
  certainty: CERTAINITY_CONCEPTS[1], // provisional
  recordedDate: '2024-01-15T11:00:00Z',
  recorder: 'Dr. Johnson',
};

const mockDiagnosisWithoutRecorder: Diagnosis = {
  id: 'diagnosis-3',
  display: 'Asthma',
  certainty: CERTAINITY_CONCEPTS[0],
  recordedDate: '2024-01-10T14:20:00Z',
  recorder: '',
};

// Array of diagnoses (new interface)
const mockDiagnosesData: Diagnosis[] = [
  mockConfirmedDiagnosis,
  mockProvisionalDiagnosis,
  mockDiagnosisWithoutRecorder,
];

describe('DiagnosesTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');

    // Setup default mocks
    mockFormatDate.mockImplementation(
      (date: string | number | Date, format?: string) => {
        if (format === ISO_DATE_FORMAT) {
          return {
            formattedResult: date.toString().substring(0, 10),
            error: undefined,
          };
        }
        return { formattedResult: `formatted-${date}`, error: undefined };
      },
    );

    mockGroupByDate.mockImplementation((items, keyFn) => {
      const groups = new Map();
      items.forEach((item) => {
        const key = keyFn(item);
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(item);
      });
      return Array.from(groups.entries()).map(([date, items]) => ({
        date,
        items,
      }));
    });

    mockSortDiagnosesByCertainty.mockImplementation((diagnoses) => {
      return [...diagnoses].sort((a, b) => {
        if (
          a.certainty.code === 'confirmed' &&
          b.certainty.code !== 'confirmed'
        )
          return -1;
        if (
          a.certainty.code !== 'confirmed' &&
          b.certainty.code === 'confirmed'
        )
          return 1;
        return 0;
      });
    });
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
      expect(dataTables).toHaveLength(2); // Two date groups
    });

    it('should format dates and use as table titles', () => {
      render(<DiagnosesTable />);

      // Should call formatDate for display formatting
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
      mockFormatDate.mockImplementation((date, format) => {
        if (format === FULL_MONTH_DATE_FORMAT) {
          return {
            formattedResult: '',
            error: { title: 'Error', message: 'Invalid date' },
          };
        }
        return {
          formattedResult: date.toString().substring(0, 10),
          error: undefined,
        };
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
          { key: 'recorder', header: 'Recorded By' },
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

      // Verify groupByDate was called
      expect(mockGroupByDate).toHaveBeenCalledWith(
        mockDiagnosesData,
        expect.any(Function),
      );

      // Verify sortDiagnosesByCertainty was called
      expect(mockSortDiagnosesByCertainty).toHaveBeenCalled();

      const rowElements = screen.getAllByTestId('table-rows');
      expect(rowElements).toHaveLength(2); // Two date groups
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
          'No diagnoses recorded',
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
      expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
    });

    it('should handle single diagnosis', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [mockConfirmedDiagnosis],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const dataTables = screen.getAllByTestId('expandable-data-table');
      expect(dataTables).toHaveLength(1);
    });

    it('should handle date group with empty diagnoses array', () => {
      mockGroupByDate.mockReturnValue([]);

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

      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
    });
  });
});
