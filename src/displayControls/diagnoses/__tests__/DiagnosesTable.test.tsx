import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import i18n from '@/setupTests.i18n';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { useDiagnoses } from '@hooks/useDiagnoses';
import { Diagnosis } from '@types/diagnosis';
import DiagnosesTable from '../DiagnosesTable';

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock('@hooks/useDiagnoses');

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
  mockDiagnosisWithoutRecorder,
  mockConfirmedDiagnosis,
  mockProvisionalDiagnosis,
];

describe('DiagnosesTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  describe('Component Rendering', () => {
    it('should render Tile container diagnoses title', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      const tile = screen.getByTestId('diagnoses-title');
      expect(tile).toHaveTextContent('Diagnoses');
      expect(tile).toHaveClass('diagnosesTableTitle');
    });

    it('should show DataTableSkeleton when loading', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
      expect(
        screen.queryByTestId('sortable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      const mockError = new Error('Test error message');
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(
        screen.queryByTestId('sortable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should render without crashing when no diagnoses', () => {
      mockUseDiagnoses.mockReturnValue({
        diagnoses: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<DiagnosesTable />);

      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No diagnoses recorded')).toBeInTheDocument();
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

    it('should render SortableDataTable with correct headers', () => {
      render(<DiagnosesTable />);

      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Diagnosis')).toBeInTheDocument();
      expect(screen.getByText('Recorded Date')).toBeInTheDocument();
      expect(screen.getByText('Recorded By')).toBeInTheDocument();
    });

    it('should render SortableDataTable with correct data with formatted dates', () => {
      render(<DiagnosesTable />);

      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();

      // Verify all diagnosis data is rendered in the table
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Type 2')).toBeInTheDocument();
      expect(screen.getByText('Asthma')).toBeInTheDocument();

      // Verify certainty tags are rendered
      expect(screen.getByText('Provisional')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')).toHaveLength(2); // Hypertension and Diabetes

      // Verify recorders are displayed
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument(); // For empty recorder

      // Verify recorded dates are formatted and displayed
      expect(screen.getAllByText('15/01/2024')).toHaveLength(2); // Hypertension and Diabetes
      expect(screen.getByText('10/01/2024')).toBeInTheDocument(); // Asthma
    });

    it('should render correct data sorted by date', () => {
      render(<DiagnosesTable />);

      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();

      // Verify recorded dates are formatted and displayed
      expect(screen.getAllByText('15/01/2024')).toHaveLength(2); // Hypertension and Diabetes
      expect(screen.getByText('10/01/2024')).toBeInTheDocument(); // Asthma

      // Verify data is sorted by date (most recent first)
      // The component uses sortByDate which should sort by recordedDate in descending order
      const diagnosisNames = screen.getAllByText(
        /Asthma|Hypertension|Diabetes Type 2/,
      );

      // Based on the dates: Diabetes (11:00) should come before Hypertension (10:30) on same day,
      // and both should come before Asthma (older date)
      expect(diagnosisNames[0]).toHaveTextContent('Diabetes Type 2'); // 2024-01-15T11:00:00Z
      expect(diagnosisNames[1]).toHaveTextContent('Hypertension'); // 2024-01-15T10:30:00Z
      expect(diagnosisNames[2]).toHaveTextContent('Asthma'); // 2024-01-10T14:20:00Z
    });

    it('should render correct styles for certainity tags', () => {
      render(<DiagnosesTable />);

      expect(screen.getByTestId('diagnoses-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();

      // Verify certainty tags are rendered
      expect(screen.getByText('Provisional')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')).toHaveLength(2); // Hypertension and Diabetes

      const tags = screen.getAllByTestId('certainity-tag');
      expect(tags[0]).toHaveClass(/provisionalCell/);
      expect(tags[1]).toHaveClass(/confirmedCell/);
      expect(tags[2]).toHaveClass(/confirmedCell/);
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

  describe('Accessibility', () => {
    it('should have no accessibility violations when data is loaded', async () => {
      // Arrange
      mockUseDiagnoses.mockReturnValue({
        diagnoses: mockDiagnosesData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<DiagnosesTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should set correct aria labels', () => {
      render(<DiagnosesTable />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Diagnoses');
    });
  });
});
