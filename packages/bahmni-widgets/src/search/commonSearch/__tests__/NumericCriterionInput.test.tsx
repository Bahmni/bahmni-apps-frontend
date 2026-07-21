import { render, screen, fireEvent } from '@testing-library/react';
import NumericCriterionInput from '../inputs/NumericCriterionInput';
import { RangeValue } from '../models';
import {
  mockFromValue,
  mockInvalidOrderRangeValue,
  mockNumericInput,
  mockRangeNumericInput,
  mockRangeValue,
} from './__mocks__/numericCriterionInputMocks';

const mockOnChange = jest.fn();

const renderInput = (
  input = mockNumericInput,
  value: RangeValue | null = null,
  validationError: string | null = null,
  rangeOrderError: string | null = null,
) =>
  render(
    <NumericCriterionInput
      input={input}
      value={value}
      onChange={mockOnChange}
      validationError={validationError}
      rangeOrderError={rangeOrderError}
    />,
  );

describe('NumericCriterionInput', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('single mode', () => {
    it('renders one number input with COMMON_SEARCH_CRITERION_LABEL label', () => {
      renderInput();
      expect(
        screen.getByTestId('numeric-criterion-input-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERION_LABEL'),
      ).toBeInTheDocument();
    });

    it.each([
      ['a value', '42', { from: { value: '42', comparator: null } }],
      ['empty string', '', null],
    ] as [string, string, RangeValue | null][])(
      'calls onChange with %s',
      (_, inputValue, expected) => {
        renderInput(mockNumericInput, mockFromValue);
        fireEvent.change(screen.getByRole('spinbutton'), {
          target: { value: inputValue },
        });
        expect(mockOnChange).toHaveBeenCalledWith(expected);
      },
    );

    it('shows validationError on the input', () => {
      renderInput(mockNumericInput, null, 'VALUE_REQUIRED');
      expect(screen.getByText('VALUE_REQUIRED')).toBeInTheDocument();
    });
  });

  describe('range mode', () => {
    it('renders FROM and TO number inputs', () => {
      renderInput(mockRangeNumericInput);
      expect(
        screen.getByTestId('numeric-criterion-input-from-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('numeric-criterion-input-to-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERIA_NUMERIC_INPUT_FIELD_FROM'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERIA_NUMERIC_INPUT_FIELD_TO'),
      ).toBeInTheDocument();
    });

    it.each([
      [
        'from changed, preserves existing to',
        0,
        '25',
        {
          from: { value: '25', comparator: null },
          to: { value: '30', comparator: null },
        },
      ],
      [
        'from cleared, preserves existing to',
        0,
        '',
        {
          from: { value: null, comparator: null },
          to: { value: '30', comparator: null },
        },
      ],
      [
        'to changed, preserves existing from',
        1,
        '50',
        {
          from: { value: '20', comparator: null },
          to: { value: '50', comparator: null },
        },
      ],
      [
        'to cleared, preserves existing from',
        1,
        '',
        {
          from: { value: '20', comparator: null },
          to: { value: null, comparator: null },
        },
      ],
    ] as [string, number, string, RangeValue][])(
      'calls onChange when %s',
      (_, inputIndex, newValue, expected) => {
        renderInput(mockRangeNumericInput, mockRangeValue);
        const inputs = screen.getAllByRole('spinbutton');
        fireEvent.change(inputs[inputIndex], { target: { value: newValue } });
        expect(mockOnChange).toHaveBeenCalledWith(expected);
      },
    );

    it.each([
      [
        'from null',
        {
          from: { value: null, comparator: null },
          to: { value: '30', comparator: null },
        },
        1,
      ],
      ['to null', mockFromValue, 1],
      ['both null', null, 2],
    ] as [string, RangeValue | null, number][])(
      'shows validation error on empty bound when %s',
      (_, value, expectedCount) => {
        renderInput(mockRangeNumericInput, value, 'VALUE_REQUIRED');
        expect(screen.getAllByText('VALUE_REQUIRED')).toHaveLength(
          expectedCount,
        );
      },
    );

    it('does not show validationError when both bounds are filled', () => {
      renderInput(mockRangeNumericInput, mockRangeValue, null);
      expect(screen.queryByText('VALUE_REQUIRED')).not.toBeInTheDocument();
    });

    it('shows rangeOrderError on to field only, not from', () => {
      renderInput(
        mockRangeNumericInput,
        mockInvalidOrderRangeValue,
        null,
        'RANGE_ORDER_ERR',
      );
      expect(screen.getAllByText('RANGE_ORDER_ERR')).toHaveLength(1);
      expect(
        screen.getByTestId('numeric-criterion-input-from-test-id'),
      ).not.toHaveTextContent('RANGE_ORDER_ERR');
    });
  });
});
