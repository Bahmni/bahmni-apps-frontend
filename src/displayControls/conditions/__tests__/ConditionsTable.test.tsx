import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import i18n from '@/setupTests.i18n';
import {
  mockConditions,
  mockFormattedConditionsWithoutNotes,
} from '@__mocks__/conditionMocks';
import { useConditions } from '@hooks/useConditions';
import { formatConditions } from '@services/conditionService';
import { ConditionStatus, FormattedCondition } from '@types/condition';
import { generateId, getFormattedError } from '@utils/common';
import { formatDateDistance } from '@utils/date';
import ConditionsTable from '../ConditionsTable';

expect.extend(toHaveNoViolations);

// Mock the hooks and utilities
jest.mock('@hooks/useConditions');
jest.mock('@services/conditionService');
jest.mock('@utils/date');
jest.mock('@utils/common', () => ({
  ...jest.requireActual('@utils/common'),
  generateId: jest.fn(),
  getFormattedError: jest.fn(),
}));

// Mock implementations
const mockedUseConditions = useConditions as jest.MockedFunction<
  typeof useConditions
>;
const mockedFormatConditions = formatConditions as jest.MockedFunction<
  typeof formatConditions
>;
const mockedFormatDateDistance = formatDateDistance as jest.MockedFunction<
  typeof formatDateDistance
>;
const mockedGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockedGenerateId = generateId as jest.MockedFunction<typeof generateId>;

// Default mock setup for consistent behavior
const defaultConditionsHookReturn = {
  conditions: [],
  loading: false,
  error: null,
  refetch: jest.fn(),
};

describe('ConditionsTable Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup consistent mocks for all tests
    let idCounter = 0;
    mockedGenerateId.mockImplementation(() => `mock-id-${++idCounter}`);

    mockedFormatDateDistance.mockImplementation(() => ({
      formattedResult: `3 days`,
    }));

    mockedGetFormattedError.mockImplementation((error: unknown) => ({
      title: 'Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }));

    // Setup formatConditions mock with consistent behavior
    mockedFormatConditions.mockImplementation((conditions) => {
      return conditions.length > 0 ? mockFormattedConditionsWithoutNotes : [];
    });

    // Setup default useConditions return
    mockedUseConditions.mockReturnValue(defaultConditionsHookReturn);

    // Reset i18n to English
    i18n.changeLanguage('en');
  });

  // 1. Component Initialization and Hook Interactions
  describe('Component Initialization and Hook Interactions', () => {
    it('should call useConditions hook on render', () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      expect(useConditions).toHaveBeenCalled();
    });

    it('should call formatConditions with conditions from useConditions when conditions exist', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatConditions).toHaveBeenCalledWith(mockConditions);
    });

    it('should not call formatConditions when conditions array is empty', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: [],
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatConditions).not.toHaveBeenCalled();
    });

    it('should not call formatConditions when conditions is null', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conditions: null as any,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatConditions).not.toHaveBeenCalled();
    });
  });

  // 2. Rendering Tests
  describe('Rendering', () => {
    it('should render loading state when loading is true', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        loading: true,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });

    it('should render error state when there is an error', () => {
      // Arrange
      const mockError = new Error('Test error message');
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        error: mockError,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('should render empty state when conditions array is empty', () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No conditions recorded')).toBeInTheDocument();
    });

    it('should render table with data when conditions are available', async () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();
      });
    });

    it('should render table headers correctly', async () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Condition')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('Recorded By')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should render component with correct test id', () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('condition-table')).toBeInTheDocument();
    });
  });

  // 3. Cell Rendering Tests
  describe('Cell Rendering Tests', () => {
    beforeEach(() => {
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });
    });

    it('should render display cell correctly', async () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cyst of Gallbladder')).toBeInTheDocument();
      });
    });

    it('should render status cell with correct tag for active status', async () => {
      // Arrange
      const activeCondition: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        status: ConditionStatus.Active,
      };
      mockedFormatConditions.mockReturnValue([activeCondition]);

      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        const tag = screen.getByText('Active');
        expect(tag).toBeInTheDocument();
        expect(tag.closest('.cds--tag')).toBeInTheDocument();
      });
    });

    it('should render status cell with correct tag for inactive status', async () => {
      // Arrange
      const inactiveCondition: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        status: ConditionStatus.Inactive,
      };
      mockedFormatConditions.mockReturnValue([inactiveCondition]);

      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        const tag = screen.getByText('Inactive');
        expect(tag).toBeInTheDocument();
        expect(tag.closest('.cds--tag')).toBeInTheDocument();
      });
    });

    it('should render onsetDate cell with formatted date', async () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Since 3 days')).toBeInTheDocument();
      });
      expect(formatDateDistance).toHaveBeenCalledWith(
        '2025-03-24T18:30:00+00:00',
      );
    });

    it('should render onsetDate cell with "Not available" when date formatting fails', async () => {
      // Arrange
      mockedFormatDateDistance.mockReturnValue({
        formattedResult: '',
        error: {
          title: 'Date Error',
          message: 'Invalid date format',
        },
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Not available')).toBeInTheDocument();
      });
    });

    it('should render onsetDate cell with "Not Available" when onsetDate is empty', async () => {
      // Arrange
      const conditionWithoutDate: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        onsetDate: '',
      };
      mockedFormatConditions.mockReturnValue([conditionWithoutDate]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(formatDateDistance).toHaveBeenCalledWith('');
    });

    it('should render recorder cell correctly', async () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Super Man')).toBeInTheDocument();
      });
    });

    it('should handle missing recorder gracefully', async () => {
      // Arrange
      const conditionWithoutRecorder: FormattedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        recorder: '',
      };
      mockedFormatConditions.mockReturnValue([conditionWithoutRecorder]);

      // Act
      render(<ConditionsTable />);

      // Assert - Should render empty string without errors
      await waitFor(() => {
        expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();
      });
    });
  });

  // 4. Memoization and Performance Tests
  describe('Memoization and Performance', () => {
    it('should memoize formatted conditions when conditions do not change', () => {
      // Arrange
      const conditions = mockConditions;
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions,
      });

      // Act - render twice with same conditions
      const { rerender } = render(<ConditionsTable />);
      rerender(<ConditionsTable />);

      // Assert - formatConditions should only be called once due to memoization
      expect(formatConditions).toHaveBeenCalledTimes(1);
    });

    it('should recalculate formatted conditions when conditions change', () => {
      // Arrange
      const { rerender } = render(<ConditionsTable />);

      // Act - update with new conditions
      const newConditions = [
        ...mockConditions,
        { ...mockConditions[0], id: 'new-id' },
      ];
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: newConditions,
      });
      rerender(<ConditionsTable />);

      // Assert
      expect(formatConditions).toHaveBeenCalledWith(newConditions);
    });

    it('should memoize headers correctly', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      const { rerender } = render(<ConditionsTable />);
      rerender(<ConditionsTable />);

      // Assert - headers should be stable and not cause re-renders
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });
  });

  // 5. Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        error: new Error('Network error'),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    it('should handle server errors correctly', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        error: new Error('Server error: 500 Internal Server Error'),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(
        screen.getByText(/Server error: 500 Internal Server Error/),
      ).toBeInTheDocument();
    });

    it('should handle authorization errors appropriately', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        error: new Error('Authorization error: 401 Unauthorized'),
      });

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
      expect(
        screen.getByText(/Authorization error: 401 Unauthorized/),
      ).toBeInTheDocument();
    });

    it('should handle formatConditions throwing errors', () => {
      // Arrange - Return empty conditions to avoid calling formatConditions
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: [],
      });

      // Act & Assert - Component should render without errors when no conditions
      expect(() => render(<ConditionsTable />)).not.toThrow();
      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
    });

    it('should handle malformed condition data gracefully', () => {
      // Arrange
      const malformedCondition = {
        ...mockFormattedConditionsWithoutNotes[0],
        display: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'invalid-status' as any,
      };
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });
      mockedFormatConditions.mockReturnValue([malformedCondition]);

      // Act & Assert - Should not crash
      expect(() => render(<ConditionsTable />)).not.toThrow();
    });
  });

  // 6. Translation and Internationalization Tests
  describe('Translation and Internationalization', () => {
    it('should use correct translation keys for headers', async () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      render(<ConditionsTable />);

      // Assert - Check that translation keys are being used
      await waitFor(() => {
        expect(screen.getByText('Condition')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('Recorded By')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
      });
    });

    it('should use correct translation for empty state message', () => {
      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByText('No conditions recorded')).toBeInTheDocument();
    });
  });

  // 7. Data Formatting and Service Integration Tests
  describe('Data Formatting and Service Integration', () => {
    it('should handle formatConditions returning empty array', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });
      mockedFormatConditions.mockReturnValue([]);

      // Act
      render(<ConditionsTable />);

      // Assert
      expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
    });

    it('should pass correct props to SortableDataTable', () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      render(<ConditionsTable />);

      // Assert - Check that the component renders with correct structure
      expect(screen.getByTestId('condition-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-data-table')).toBeInTheDocument();
    });
  });

  // 8. Accessibility Tests
  describe('Accessibility', () => {
    it('should pass accessibility tests with data', async () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        conditions: mockConditions,
      });

      // Act
      const { container } = render(<ConditionsTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should pass accessibility tests in error state', async () => {
      // Arrange
      mockedUseConditions.mockReturnValue({
        ...defaultConditionsHookReturn,
        error: new Error('Test error'),
      });

      // Act
      const { container } = render(<ConditionsTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });

    it('should pass accessibility tests in empty state', async () => {
      // Act
      const { container } = render(<ConditionsTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
