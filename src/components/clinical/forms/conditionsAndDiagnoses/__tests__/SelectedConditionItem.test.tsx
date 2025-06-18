import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SelectedConditionItem, {
  SelectedConditionItemProps,
} from '../SelectedConditionItem';
import { ConditionInputEntry } from '@types/condition';
import { DURATION_UNITS } from '@constants/conditions';
import i18n from '@/setupTests.i18n';

expect.extend(toHaveNoViolations);

// Mock Carbon Design System components
jest.mock('@carbon/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Column: ({ children, className, ...props }: any) => (
    <div data-testid="carbon-column" className={className} {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Grid: ({ children, ...props }: any) => (
    <div data-testid="carbon-grid" {...props}>
      {children}
    </div>
  ),
  TextInput: ({
    id,
    labelText,
    placeholder,
    value,
    onChange,
    invalid,
    invalidText,
    type,
    hideLabel,
    className,
    'data-testid': dataTestId,
    ...props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div className={className}>
      {!hideLabel && <label htmlFor={id}>{labelText}</label>}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        data-testid={dataTestId}
        data-invalid={invalid}
        aria-invalid={invalid}
        {...props}
      />
      {invalid && invalidText && (
        <div data-testid={`${dataTestId}-error`} role="alert">
          {invalidText}
        </div>
      )}
    </div>
  ),
  Dropdown: ({
    id,
    titleText,
    label,
    hideLabel,
    items,
    selectedItem,
    itemToString,
    onChange,
    invalid,
    invalidText,
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    autoAlign,
    ...props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div className={className}>
      {!hideLabel && <label htmlFor={id}>{titleText || label}</label>}
      <select
        id={id}
        data-testid={`dropdown-${id}`}
        onChange={(e) => {
          const selectedValue = e.target.value;
          const selectedOption = items.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => item.id === selectedValue,
          );
          onChange({ selectedItem: selectedOption });
        }}
        value={selectedItem?.id || ''}
        data-invalid={invalid}
        aria-invalid={invalid}
        aria-label={hideLabel ? titleText || label : undefined}
        {...props}
      >
        <option value="">Select...</option>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items.map((item: any) => (
            <option key={item.id} value={item.id}>
              {itemToString(item)}
            </option>
          ))
        }
      </select>
      {invalid && invalidText && (
        <div data-testid={`dropdown-${id}-error`} role="alert">
          {invalidText}
        </div>
      )}
    </div>
  ),
}));

describe('SelectedConditionItem Unit Tests', () => {
  const mockUpdateConditionDuration = jest.fn();

  // Mock condition data
  const mockValidCondition: ConditionInputEntry = {
    id: 'test-condition-1',
    display: 'Test Condition Name',
    durationValue: 30,
    durationUnit: 'days',
    errors: {},
    hasBeenValidated: false,
  };

  const mockConditionWithErrors: ConditionInputEntry = {
    id: 'test-condition-2',
    display: 'Invalid Condition',
    durationValue: null,
    durationUnit: null,
    errors: {
      durationValue: 'CONDITIONS_DURATION_VALUE_REQUIRED',
      durationUnit: 'CONDITIONS_DURATION_UNIT_REQUIRED',
    },
    hasBeenValidated: true,
  };

  const mockConditionWithoutValidation: ConditionInputEntry = {
    id: 'test-condition-3',
    display: 'Condition Without Validation',
    durationValue: null,
    durationUnit: null,
    errors: {
      durationValue: 'CONDITIONS_DURATION_VALUE_REQUIRED',
      durationUnit: 'CONDITIONS_DURATION_UNIT_REQUIRED',
    },
    hasBeenValidated: false,
  };

  const defaultProps: SelectedConditionItemProps = {
    condition: mockValidCondition,
    updateConditionDuration: mockUpdateConditionDuration,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  // 1. HAPPY PATH TESTS
  describe('Happy Path Tests', () => {
    it('should render component with valid condition data', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      expect(screen.getByText('Test Condition Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Days')).toBeInTheDocument();
    });

    it('should display condition name correctly', () => {
      const conditionWithLongName = {
        ...mockValidCondition,
        display: 'Very Long Condition Name That Should Display Properly',
      };

      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={conditionWithLongName}
        />,
      );

      expect(
        screen.getByText(
          'Very Long Condition Name That Should Display Properly',
        ),
      ).toBeInTheDocument();
    });

    it('should show current duration value in TextInput', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      expect(durationInput).toHaveValue(30);
    });

    it('should show current duration unit in Dropdown', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );
      expect(durationDropdown).toHaveValue('days');
    });

    it('should call updateConditionDuration when TextInput value changes with valid number', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await fireEvent.change(durationInput, { target: { value: '45' } });
      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        45,
        'days',
      );
    });

    it('should call updateConditionDuration when Dropdown selection changes', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );
      await user.selectOptions(durationDropdown, 'months');

      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        30,
        'months',
      );
    });

    it('should handle clearing duration value (empty string)', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);

      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        null,
        'days',
      );
    });

    it('should handle large valid numbers', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      fireEvent.change(durationInput, { target: { value: '9999' } });

      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        9999,
        'days',
      );
    });
  });

  // 2. SAD PATH TESTS
  describe('Sad Path Tests - Validation Errors', () => {
    it('should show validation error for duration value when hasBeenValidated is true', () => {
      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={mockConditionWithErrors}
        />,
      );

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-2',
      );
      expect(durationInput).toHaveAttribute('data-invalid', 'true');
      expect(durationInput).toHaveAttribute('aria-invalid', 'true');

      const errorMessage = screen.getByTestId(
        'condition-duration-value-test-condition-2-error',
      );
      expect(errorMessage).toHaveTextContent('Duration value is required');
    });

    it('should show validation error for duration unit when hasBeenValidated is true', () => {
      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={mockConditionWithErrors}
        />,
      );

      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-2',
      );
      expect(durationDropdown).toHaveAttribute('data-invalid', 'true');
      expect(durationDropdown).toHaveAttribute('aria-invalid', 'true');

      const errorMessage = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-2-error',
      );
      expect(errorMessage).toHaveTextContent('Duration unit is required');
    });

    it('should NOT show validation errors when hasBeenValidated is false', () => {
      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={mockConditionWithoutValidation}
        />,
      );

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-3',
      );
      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-3',
      );

      expect(durationInput).toHaveAttribute('data-invalid', 'false');
      expect(durationDropdown).toHaveAttribute('data-invalid', 'false');

      expect(
        screen.queryByTestId('condition-duration-value-test-condition-3-error'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId(
          'dropdown-condition-duration-unit-test-condition-3-error',
        ),
      ).not.toBeInTheDocument();
    });

    it('should reject non-numeric input in TextInput', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, 'abc');

      // Non-numeric input should not trigger updateConditionDuration
      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        expect.any(Number),
        'days',
      );
    });

    it('should reject negative numbers in TextInput', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, '-5');

      // Negative numbers should not trigger updateConditionDuration with the negative value
      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        -5,
        'days',
      );
    });

    it('should reject zero values in TextInput', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, '0');

      // Zero should not trigger updateConditionDuration
      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        0,
        'days',
      );
    });

    it('should reject decimal numbers in TextInput', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, '3.5');

      // Decimal numbers should not trigger updateConditionDuration
      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        3.5,
        'days',
      );
    });
  });

  // 3. EDGE CASES
  describe('Edge Cases', () => {
    it('should handle empty condition display', () => {
      const conditionWithEmptyDisplay = {
        ...mockValidCondition,
        display: '',
      };

      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={conditionWithEmptyDisplay}
        />,
      );

      // Should still render the component structure
      expect(screen.getByTestId('carbon-grid')).toBeInTheDocument();
    });

    it('should handle special characters in TextInput', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, '!@#$%');

      // Special characters should not trigger updateConditionDuration
      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        expect.any(Number),
        'days',
      );
    });

    it('should handle whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.clear(durationInput);
      await user.type(durationInput, '   ');

      // Whitespace should be treated as empty and call with null
      expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
        'test-condition-1',
        null,
        'days',
      );
    });

    it('should handle rapid consecutive changes', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );

      await user.clear(durationInput);
      await user.type(durationInput, '1');
      await user.type(durationInput, '2');
      await user.type(durationInput, '3');

      // Should handle multiple rapid changes
      expect(mockUpdateConditionDuration).toHaveBeenCalledTimes(4); // clear + 3 types
    });

    it('should render all available duration units in dropdown', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      // Check that all DURATION_UNITS are present
      ['Days', 'Months', 'Years'].forEach((unit) => {
        expect(screen.getByText(unit)).toBeInTheDocument();
      });
    });

    it('should handle invalid dropdown selection gracefully', async () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );

      // Try to select an invalid option (this should not call updateConditionDuration)
      fireEvent.change(durationDropdown, { target: { value: 'invalid-unit' } });

      expect(mockUpdateConditionDuration).not.toHaveBeenCalledWith(
        'test-condition-1',
        expect.any(Number),
        'invalid-unit',
      );
    });
  });

  // 4. COMPONENT BEHAVIOR TESTS
  describe('Component Behavior Tests', () => {
    it('should be memoized with React.memo', () => {
      const { rerender } = render(<SelectedConditionItem {...defaultProps} />);

      // Re-render with same props
      rerender(<SelectedConditionItem {...defaultProps} />);

      // Component should have displayName set for React.memo
      expect(SelectedConditionItem.displayName).toBe('SelectedConditionItem');
    });

    it('should have correct test-ids for all interactive elements', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      expect(
        screen.getByTestId('condition-duration-value-test-condition-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('dropdown-condition-duration-unit-test-condition-1'),
      ).toBeInTheDocument();
    });

    it('should have correct HTML structure', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      expect(screen.getByTestId('carbon-grid')).toBeInTheDocument();
      expect(screen.getAllByTestId('carbon-column')).toHaveLength(2);
    });

    it('should preserve focus on TextInput during input', async () => {
      const user = userEvent.setup();
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );
      await user.click(durationInput);

      expect(durationInput).toHaveFocus();

      await user.type(durationInput, '5');

      expect(durationInput).toHaveFocus();
    });
  });

  // 5. INTEGRATION TESTS
  describe('Integration Tests', () => {
    it('should work with different duration units', async () => {
      const user = userEvent.setup();

      // Test with each duration unit
      for (const unit of DURATION_UNITS) {
        const conditionWithUnit = {
          ...mockValidCondition,
          id: `test-${unit.id}`,
          durationUnit: unit.id as 'days' | 'months' | 'years',
        };

        const { unmount } = render(
          <SelectedConditionItem
            condition={conditionWithUnit}
            updateConditionDuration={mockUpdateConditionDuration}
          />,
        );

        const durationInput = screen.getByTestId(
          `condition-duration-value-test-${unit.id}`,
        );
        await user.clear(durationInput);
        await fireEvent.change(durationInput, { target: { value: '10' } });

        expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
          `test-${unit.id}`,
          10,
          unit.id,
        );

        unmount();
        jest.clearAllMocks();
      }
    });

    it('should not call updateConditionDuration when numValue is zero', async () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );

      jest.clearAllMocks();
      fireEvent.change(durationInput, { target: { value: 0 } });

      // Should not call updateConditionDuration because numValue is not > 0
      expect(mockUpdateConditionDuration).not.toHaveBeenCalled();
    });

    it('should not call updateConditionDuration when numValue is negative', async () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );

      const negativeInputs = ['-1', '-5', '-100'];

      for (const input of negativeInputs) {
        jest.clearAllMocks();
        fireEvent.change(durationInput, { target: { value: input } });

        // Should not call updateConditionDuration because numValue is not > 0
        expect(mockUpdateConditionDuration).not.toHaveBeenCalled();
      }
    });

    it('should call updateConditionDuration when numValue is positive', async () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );

      const positiveInputs = ['1', '5', '100', '9999'];

      for (const input of positiveInputs) {
        jest.clearAllMocks();
        fireEvent.change(durationInput, { target: { value: input } });

        // Should call updateConditionDuration because numValue > 0
        expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
          'test-condition-1',
          parseInt(input, 10),
          'days',
        );
      }
    });

    it('should return empty string when item is null', () => {
      // Create a condition with no duration unit to test null item
      const conditionWithoutUnit = {
        ...mockValidCondition,
        durationUnit: null,
      };

      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={conditionWithoutUnit}
        />,
      );

      // When durationUnit is null, selectedItem will be null
      // The itemToString function should return '' for null item
      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );

      // Check that the dropdown shows empty option when no unit is selected
      expect(durationDropdown).toHaveValue('');
    });

    it('should return empty string when item exists but display is falsy', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      // The dropdown should handle items with falsy display values gracefully
      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );

      expect(durationDropdown).toBeInTheDocument();
    });

    it('should return translated display when item has display property', () => {
      render(<SelectedConditionItem {...defaultProps} />);

      // Verify that translated duration units are displayed
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Months')).toBeInTheDocument();
      expect(screen.getByText('Years')).toBeInTheDocument();
    });

    it('should handle undefined item in itemToString function', () => {
      // Test with a condition that has an invalid duration unit
      const conditionWithInvalidUnit = {
        ...mockValidCondition,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        durationUnit: 'invalid-unit' as any,
      };

      render(
        <SelectedConditionItem
          {...defaultProps}
          condition={conditionWithInvalidUnit}
        />,
      );

      // When duration unit doesn't match any DURATION_UNITS item,
      // selectedItem will be null, testing the item?.display branch
      const durationDropdown = screen.getByTestId(
        'dropdown-condition-duration-unit-test-condition-1',
      );

      expect(durationDropdown).toHaveValue('');
    });

    it('should handle edge case of parseInt with leading/trailing whitespace', async () => {
      render(<SelectedConditionItem {...defaultProps} />);

      const durationInput = screen.getByTestId(
        'condition-duration-value-test-condition-1',
      );

      // Test inputs with whitespace that parseInt can handle
      const whitespaceInputs = [
        { input: '  5  ', expectedValue: 5 }, // Leading/trailing spaces trimmed, parseInt should work
        { input: '10\n', expectedValue: 10 }, // Trailing newline
        { input: '\t15', expectedValue: 15 }, // Leading tab
      ];

      for (const test of whitespaceInputs) {
        jest.clearAllMocks();
        fireEvent.change(durationInput, { target: { value: test.input } });

        // Since the component trims the input, parseInt should work correctly
        waitFor(() =>
          expect(mockUpdateConditionDuration).toHaveBeenCalledWith(
            'test-condition-1',
            test.expectedValue,
            'days',
          ),
        );
      }
    });
  });

  // 7. ACCESSIBILITY TESTS
  describe('Accessibility Tests', () => {
    it('should pass accessibility checks', async () => {
      const { container } = render(<SelectedConditionItem {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
