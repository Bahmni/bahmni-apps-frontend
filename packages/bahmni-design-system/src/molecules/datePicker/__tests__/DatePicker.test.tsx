import { render, screen } from '@testing-library/react';
import * as dateFormatUtils from '../dateFormatUtils';
import { DatePicker, DatePickerInput } from '../DatePicker';
import '@testing-library/jest-dom';

jest.mock('../dateFormatUtils');

describe('DatePicker', () => {
  const mockGetDateFormats =
    dateFormatUtils.getDateFormats as jest.MockedFunction<
      typeof dateFormatUtils.getDateFormats
    >;

  beforeEach(() => {
    mockGetDateFormats.mockReturnValue({
      dateFnsFormat: 'dd/MM/yyyy',
      flatpickrFormat: 'd/m/Y',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DatePicker', () => {
    it('renders DatePicker component', () => {
      render(
        <DatePicker testId="date-picker">
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('uses default date format from getDateFormats when dateFormat is not provided', () => {
      render(
        <DatePicker>
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      expect(mockGetDateFormats).toHaveBeenCalled();
    });

    it('uses provided dateFormat prop over default format', () => {
      const customFormat = 'm/d/Y';
      render(
        <DatePicker dateFormat={customFormat} testId="custom-format-picker">
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      expect(screen.getByTestId('custom-format-picker')).toBeInTheDocument();
    });

    it.each([
      ['testId', 'custom-test-id'],
      ['data-testid', 'another-test-id'],
    ])('applies %s prop correctly', (propName, testIdValue) => {
      const props = { [propName]: testIdValue };
      render(
        <DatePicker {...props}>
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      expect(screen.getByTestId(testIdValue)).toBeInTheDocument();
    });

    it('passes through Carbon DatePicker props', () => {
      render(
        <DatePicker datePickerType="range">
          <DatePickerInput id="start-date" labelText="Start Date" />
          <DatePickerInput id="end-date" labelText="End Date" />
        </DatePicker>,
      );

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(
        <DatePicker>
          <DatePickerInput
            id="date-picker-input"
            labelText="Custom Date Label"
          />
        </DatePicker>,
      );

      expect(screen.getByLabelText('Custom Date Label')).toBeInTheDocument();
    });
  });

  describe('DatePickerInput', () => {
    it('renders DatePickerInput component', () => {
      render(
        <DatePicker>
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      const input = screen.getByLabelText('Date');
      expect(input).toBeInTheDocument();
    });

    it('uses default placeholder from getDateFormats when placeholder is not provided', () => {
      render(
        <DatePicker>
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      const input = screen.getByLabelText('Date') as HTMLInputElement;
      expect(input.placeholder).toBe('dd/MM/yyyy');
    });

    it('uses provided placeholder prop over default', () => {
      const customPlaceholder = 'Select a date';
      render(
        <DatePicker>
          <DatePickerInput
            id="date-picker-input"
            labelText="Date"
            placeholder={customPlaceholder}
          />
        </DatePicker>,
      );

      const input = screen.getByLabelText('Date') as HTMLInputElement;
      expect(input.placeholder).toBe(customPlaceholder);
    });

    it.each([
      ['testId', 'input-test-id'],
      ['data-testid', 'another-input-test-id'],
    ])('applies %s prop correctly', (propName, testIdValue) => {
      const props = { [propName]: testIdValue };
      render(
        <DatePicker>
          <DatePickerInput id="date-picker-input" labelText="Date" {...props} />
        </DatePicker>,
      );

      expect(screen.getByTestId(testIdValue)).toBeInTheDocument();
    });

    it('passes through Carbon DatePickerInput props', () => {
      render(
        <DatePicker>
          <DatePickerInput
            id="date-picker-input"
            labelText="Date"
            disabled
            invalid
            invalidText="Invalid date"
          />
        </DatePicker>,
      );

      const input = screen.getByLabelText('Date') as HTMLInputElement;
      expect(input).toBeDisabled();
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('renders with helperText', () => {
      render(
        <DatePicker>
          <DatePickerInput
            id="date-picker-input"
            labelText="Date"
            helperText="Select your preferred date"
          />
        </DatePicker>,
      );

      expect(
        screen.getByText('Select your preferred date'),
      ).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('works with single date picker', () => {
      render(
        <DatePicker datePickerType="single" testId="single-date-picker">
          <DatePickerInput
            id="single-date"
            labelText="Select Date"
            testId="single-date-input"
          />
        </DatePicker>,
      );

      expect(screen.getByTestId('single-date-picker')).toBeInTheDocument();
      expect(screen.getByTestId('single-date-input')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
    });

    it('works with range date picker', () => {
      render(
        <DatePicker datePickerType="range" testId="range-date-picker">
          <DatePickerInput
            id="start-date"
            labelText="Start Date"
            testId="start-date-input"
          />
          <DatePickerInput
            id="end-date"
            labelText="End Date"
            testId="end-date-input"
          />
        </DatePicker>,
      );

      expect(screen.getByTestId('range-date-picker')).toBeInTheDocument();
      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('uses consistent format across DatePicker and DatePickerInput', () => {
      mockGetDateFormats.mockReturnValue({
        dateFnsFormat: 'MM/dd/yyyy',
        flatpickrFormat: 'm/d/Y',
      });

      render(
        <DatePicker>
          <DatePickerInput id="date-picker-input" labelText="Date" />
        </DatePicker>,
      );

      const input = screen.getByLabelText('Date') as HTMLInputElement;
      expect(input.placeholder).toBe('MM/dd/yyyy');
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for single date picker', () => {
      const { container } = render(
        <DatePicker testId="snapshot-single">
          <DatePickerInput id="date-input" labelText="Date" />
        </DatePicker>,
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for range date picker', () => {
      const { container } = render(
        <DatePicker datePickerType="range" testId="snapshot-range">
          <DatePickerInput id="start-date" labelText="Start Date" />
          <DatePickerInput id="end-date" labelText="End Date" />
        </DatePicker>,
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with custom format', () => {
      const { container } = render(
        <DatePicker dateFormat="Y-m-d">
          <DatePickerInput
            id="date-input"
            labelText="Date"
            placeholder="yyyy-MM-dd"
          />
        </DatePicker>,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
