import { act, render, screen } from '@testing-library/react';
import DateCriterionInput from '../inputs/DateCriterionInput';
import { RangeValue } from '../models';
import {
  mockDateInput,
  mockFromValue,
  mockInvalidOrderRangeValue,
  mockRangeDateInput,
  mockRangeValue,
} from './__mocks__/dateCriterionInputMocks';

const mockOnChange = jest.fn();

const renderInput = (
  input = mockDateInput,
  value: RangeValue | null = null,
  validationError: string | null = null,
  rangeOrderError: string | null = null,
) =>
  render(
    <DateCriterionInput
      input={input}
      value={value}
      onChange={mockOnChange}
      validationError={validationError}
      rangeOrderError={rangeOrderError}
    />,
  );

const setFlatpickrDate = (labelText: string, date: Date | null) => {
  const input = screen.getByLabelText(labelText) as HTMLInputElement & {
    _flatpickr?: {
      setDate: (date: Date | null, triggerChange: boolean) => void;
    };
  };
  act(() => {
    input._flatpickr?.setDate(date as Date, true);
  });
};

describe('DateCriterionInput', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('single mode', () => {
    it('renders one date input with COMMON_SEARCH_CRITERION_LABEL label', () => {
      renderInput();
      expect(
        screen.getByTestId('date-criterion-input-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERION_LABEL'),
      ).toBeInTheDocument();
    });

    it('shows validationError on the input', () => {
      renderInput(mockDateInput, null, 'VALUE_REQUIRED');
      expect(screen.getByText('VALUE_REQUIRED')).toBeInTheDocument();
    });

    it.each([
      [
        'a date is selected',
        new Date(Date.UTC(2024, 5, 15)),
        { from: { value: '2024-06-15T00:00:00.000Z', comparator: null } },
      ],
      ['date is cleared', null, null],
    ] as [string, Date | null, RangeValue | null][])(
      'calls onChange when %s',
      (_, date, expected) => {
        renderInput();
        setFlatpickrDate('COMMON_SEARCH_CRITERION_LABEL', date);
        expect(mockOnChange).toHaveBeenCalledWith(expected);
      },
    );
  });

  describe('range mode', () => {
    it('renders FROM and TO date inputs', () => {
      renderInput(mockRangeDateInput);
      expect(
        screen.getByTestId('date-criterion-input-from-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('date-criterion-input-to-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_FROM'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_TO'),
      ).toBeInTheDocument();
    });

    it.each([
      [
        'from changed, preserves existing to',
        'COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_FROM',
        new Date(Date.UTC(2024, 2, 1)),
        {
          from: { value: '2024-03-01T00:00:00.000Z', comparator: null },
          to: { value: '2024-12-31T00:00:00.000Z', comparator: null },
        },
      ],
      [
        'to changed, preserves existing from',
        'COMMON_SEARCH_CRITERIA_DATE_INPUT_FIELD_TO',
        new Date(Date.UTC(2024, 5, 30)),
        {
          from: { value: '2024-01-01T00:00:00.000Z', comparator: null },
          to: { value: '2024-06-30T00:00:00.000Z', comparator: null },
        },
      ],
    ] as [string, string, Date, RangeValue][])(
      'calls onChange when %s',
      (_, labelText, date, expected) => {
        renderInput(mockRangeDateInput, mockRangeValue);
        setFlatpickrDate(labelText, date);
        expect(mockOnChange).toHaveBeenCalledWith(expected);
      },
    );

    it.each([
      [
        'from null',
        {
          from: { value: null, comparator: null },
          to: { value: '2024-12-31', comparator: null },
        },
        1,
      ],
      ['to null', mockFromValue, 1],
      ['both null', null, 2],
    ] as [string, RangeValue | null, number][])(
      'shows validation error on empty bound when %s',
      (_, value, expectedCount) => {
        renderInput(mockRangeDateInput, value, 'VALUE_REQUIRED');
        expect(screen.getAllByText('VALUE_REQUIRED')).toHaveLength(
          expectedCount,
        );
      },
    );

    it('does not show validationError when both bounds are filled', () => {
      renderInput(mockRangeDateInput, mockRangeValue, null);
      expect(screen.queryByText('VALUE_REQUIRED')).not.toBeInTheDocument();
    });

    it('shows rangeOrderError on to field only, not from', () => {
      renderInput(
        mockRangeDateInput,
        mockInvalidOrderRangeValue,
        null,
        'RANGE_ORDER_ERR',
      );
      expect(screen.getAllByText('RANGE_ORDER_ERR')).toHaveLength(1);
      expect(
        screen.getByTestId('date-criterion-input-from-test-id'),
      ).not.toHaveTextContent('RANGE_ORDER_ERR');
    });
  });
});
