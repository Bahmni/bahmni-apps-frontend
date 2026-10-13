import { fireEvent, render, screen } from '@testing-library/react';
import { TimePickerInput } from '../TimePickerInput';

describe('TimePickerInput', () => {
  const defaultProps = {
    id: 'test-time',
    testId: 'time-picker-test',
    value: '',
    meridiem: 'AM' as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the time input and meridiem select', () => {
    render(<TimePickerInput {...defaultProps} />);
    expect(screen.getByTestId('time-picker-test')).toBeInTheDocument();
    expect(screen.getByTestId('time-picker-test-meridiem')).toBeInTheDocument();
  });

  it.each([
    ['12', '12'],
    ['123', '12:3'],
    ['1200', '12:00'],
    ['0930', '09:30'],
    ['1300', '12:00'],
    ['1500', '12:00'],
    ['1260', '12:59'],
    ['0961', '09:59'],
    ['1399', '12:59'],
  ])('formats "%s" to "%s" on change', (input, expected) => {
    render(<TimePickerInput {...defaultProps} />);
    fireEvent.change(screen.getByTestId('time-picker-test'), {
      target: { value: input },
    });
    expect(defaultProps.onChange).toHaveBeenCalledWith(expected, 'AM');
  });

  it('calls onChange with updated meridiem when AM/PM changes', () => {
    render(<TimePickerInput {...defaultProps} value="09:00" />);
    fireEvent.change(screen.getByTestId('time-picker-test-meridiem'), {
      target: { value: 'PM' },
    });
    expect(defaultProps.onChange).toHaveBeenCalledWith('09:00', 'PM');
  });

  it('uses id-based testId for meridiem select when testId is not provided', () => {
    render(
      <TimePickerInput
        id="test-time"
        value=""
        meridiem="AM"
        onChange={jest.fn()}
      />,
    );
    expect(
      screen.getByTestId('test-time-meridiem-test-id'),
    ).toBeInTheDocument();
  });

  it('renders invalid state with error text', () => {
    render(
      <TimePickerInput {...defaultProps} invalid invalidText="Invalid time" />,
    );
    expect(screen.getByText('Invalid time')).toBeInTheDocument();
  });
});
