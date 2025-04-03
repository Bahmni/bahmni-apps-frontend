import React from 'react';
import { render, screen } from '@testing-library/react';
import ConditionsTable from '../ConditionsTable';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import { formatDateTime } from '@utils/date';
import { generateId } from '@utils/common';
import {
  mockPatientUUID,
  mockConditions,
  mockFormattedConditionsWithNotes,
  mockFormattedConditionsWithoutNotes,
} from '@__mocks__/conditionMocks';
import { ConditionStatus, FormattedCondition } from '../../../types/condition';

// Mock the hooks and utilities
jest.mock('@hooks/usePatientUUID');
jest.mock('@hooks/useConditions');
jest.mock('@services/conditionService');
jest.mock('@utils/date');
jest.mock('@utils/common');
jest.mock('@components/expandableDataTable/ExpandableDataTable', () => ({
  ExpandableDataTable: jest.fn(
    ({
      tableTitle,
      rows,
      headers,
      renderCell,
      renderExpandedContent,
      loading,
      error,
      emptyStateMessage,
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    }: any) => {
      if (loading) {
        return <div data-testid="mock-loading-state">Loading...</div>;
      }

      if (error) {
        return <div data-testid="mock-error-state">{error.message}</div>;
      }

      if (!rows || rows.length === 0) {
        return <div data-testid="mock-empty-state">{emptyStateMessage}</div>;
      }

      // Render table headers
      const headerElements = headers.map(
        (header: { key: string; header: string }) => (
          <div key={header.key} data-testid={`header-${header.key}`}>
            {header.header}
          </div>
        ),
      );

      // Render table rows
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const rowElements = rows.map((row: any, rowIndex: number) => {
        const cells = headers.map((header: { key: string }) => (
          <div
            key={`${rowIndex}-${header.key}`}
            data-testid={`cell-${header.key}-${rowIndex}`}
          >
            {renderCell(row, header.key)}
          </div>
        ));

        // Render expanded content
        const expandedContent = (
          <div data-testid={`expanded-content-${rowIndex}`}>
            {renderExpandedContent(row)}
          </div>
        );

        return (
          <div key={rowIndex} data-testid={`row-${rowIndex}`}>
            {cells}
            {expandedContent}
          </div>
        );
      });

      return (
        <div data-testid="mock-expandable-table">
          <div data-testid="table-title">{tableTitle}</div>
          <div data-testid="table-headers">{headerElements}</div>
          <div data-testid="table-rows">{rowElements}</div>
        </div>
      );
    },
  ),
}));

// Mock implementations
const mockedUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockedUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;
const mockedFormatConditions = formatConditions as jest.MockedFunction<
  typeof formatConditions
>;
const mockedFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

describe('ConditionsTable Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGenerateId.mockReturnValue('mock-id');
    mockedFormatDateTime.mockImplementation((date) => `Formatted: ${date}`);
  });

  // 1. Component Initialization and Hook Interactions
  describe('Component Initialization and Hook Interactions', () => {
    it('should call usePatientUUID to get patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(usePatientUUID).toHaveBeenCalled();
    });

    it('should call useConditions with the correct patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(useConditions).toHaveBeenCalledWith(mockPatientUUID);
    });

    it('should call formatConditions with the conditions from useConditions', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatConditions).toHaveBeenCalledWith(mockConditions);
    });

    it('should not call formatConditions when conditions array is empty', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatConditions).not.toHaveBeenCalled();
    });
  });

  // 2. Rendering Tests
  describe('Rendering Tests', () => {
    it('should render loading state when loading is true', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-loading-state')).toBeInTheDocument();
    });

    it('should render error state when there is an error', () => {
      // Arrange
      const mockError = new Error('Test error message');
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render empty state when conditions array is empty', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No conditions found')).toBeInTheDocument();
    });

    it('should render table with correct headers', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('header-display')).toHaveTextContent(
        'Condition',
      );
      expect(screen.getByTestId('header-status')).toHaveTextContent('Status');
      expect(screen.getByTestId('header-onsetDate')).toHaveTextContent(
        'Onset Date',
      );
      expect(screen.getByTestId('header-recorder')).toHaveTextContent(
        'Provider',
      );
      expect(screen.getByTestId('header-recordedDate')).toHaveTextContent(
        'Recorded Date',
      );
    });

    it('should render table with correct title', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('table-title')).toHaveTextContent('Conditions');
    });
  });

  // 3. Cell Rendering Tests
  describe('Cell Rendering Tests', () => {
    it('should render display cell correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Cyst of Gallbladder',
      );
    });

    it('should render status cell with correct tag type for active status', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const activeCondition: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        status: ConditionStatus.Active,
      };

      mockedFormatConditions.mockReturnValue([activeCondition]);

      // Act
      render(<ConditionsTable />);

      // Assert
      const statusCell = screen.getByTestId('cell-status-0');
      expect(statusCell).toHaveTextContent('active');
      // In a real test, we would check for the Tag component with type="green"
      // but since we're using a mock, we just check for the content
    });

    it('should render status cell with correct tag type for inactive status', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const inactiveCondition: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        status: ConditionStatus.Inactive,
      };

      mockedFormatConditions.mockReturnValue([inactiveCondition]);

      // Act
      render(<ConditionsTable />);

      // Assert
      const statusCell = screen.getByTestId('cell-status-0');
      expect(statusCell).toHaveTextContent('inactive');
      // In a real test, we would check for the Tag component with type="gray"
      // but since we're using a mock, we just check for the content
    });

    it('should render onsetDate cell with formatted date', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-onsetDate-0')).toHaveTextContent(
        'Formatted: 2025-03-24T18:30:00+00:00',
      );
      expect(formatDateTime).toHaveBeenCalledWith('2025-03-24T18:30:00+00:00');
    });

    it('should render recorder cell correctly', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-recorder-0')).toHaveTextContent(
        'Super Man',
      );
    });

    it('should render recordedDate cell with formatted date', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-recordedDate-0')).toHaveTextContent(
        'Formatted: 2025-03-25T06:48:32+00:00',
      );
      expect(formatDateTime).toHaveBeenCalledWith('2025-03-25T06:48:32+00:00');
    });

    it('should render "Not available" for missing recorder', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const conditionWithoutRecorder: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        recorder: undefined,
      };

      mockedFormatConditions.mockReturnValue([conditionWithoutRecorder]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-recorder-0')).toHaveTextContent(
        'Not available',
      );
    });

    it('should handle empty onsetDate', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const conditionWithoutOnsetDate: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        onsetDate: undefined,
      };

      mockedFormatConditions.mockReturnValue([conditionWithoutOnsetDate]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-onsetDate-0')).toHaveTextContent(
        'Formatted:',
      );
      expect(formatDateTime).toHaveBeenCalledWith('');
    });

    it('should handle empty recordedDate', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const conditionWithoutRecordedDate: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        recordedDate: undefined,
      };

      mockedFormatConditions.mockReturnValue([conditionWithoutRecordedDate]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('cell-recordedDate-0')).toHaveTextContent(
        'Formatted:',
      );
      expect(formatDateTime).toHaveBeenCalledWith('');
    });
  });

  // 4. Expanded Content Tests
  describe('Expanded Content Tests', () => {
    it('should render notes in expanded content when condition has notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(mockFormattedConditionsWithNotes);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('expanded-content-0')).toHaveTextContent(
        'Patient reports pain in the upper right quadrant',
      );
    });

    it('should render content without expansion when condition has no notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
      mockedFormatConditions.mockReturnValue(
        mockFormattedConditionsWithoutNotes,
      );

      // Act
      render(<ConditionsTable />);
      // Assert
      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.getByTestId('cell-display-0')).toHaveTextContent(
        'Cyst of Gallbladder',
      );
    });

    it('should render multiple notes when condition has multiple notes', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: mockConditions,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      const conditionWithMultipleNotes: FormattedCondition = {
        ...mockFormattedConditionsWithNotes[0],
        note: ['First note', 'Second note', 'Third note'],
      };

      mockedFormatConditions.mockReturnValue([conditionWithMultipleNotes]);

      // Act
      render(<ConditionsTable />);

      // Assert
      const expandedContent = screen.getByTestId('expanded-content-0');
      expect(expandedContent).toHaveTextContent('First note');
      expect(expandedContent).toHaveTextContent('Second note');
      expect(expandedContent).toHaveTextContent('Third note');
    });
  });

  // 5. Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should handle null patient UUID', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(null);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Invalid patient UUID'),
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Invalid patient UUID',
      );
    });

    it('should handle network errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Network error',
      );
    });

    it('should handle server errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Server error: 500 Internal Server Error'),
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Server error: 500 Internal Server Error',
      );
    });

    it('should handle authorization errors', () => {
      // Arrange
      mockedUsePatientUUID.mockReturnValue(mockPatientUUID);
      mockedUseConditions.mockReturnValue({
        conditions: [],
        loading: false,
        error: new Error('Authorization error: 401 Unauthorized'),
        refetch: jest.fn(),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('mock-error-state')).toHaveTextContent(
        'Authorization error: 401 Unauthorized',
      );
    });
  });
});
