import { render, screen, fireEvent } from '@testing-library/react';
import TextCriterionInput from '../../components/TextCriterionInput';
import { ScalarValue } from '../../models';
import {
  mockTextInput,
  mockTextScalarValue,
} from '../__mocks__/textCriterionInputMocks';

const mockOnChange = jest.fn();

const renderInput = (
  value: ScalarValue | null = null,
  validationError: string | null = null,
) =>
  render(
    <TextCriterionInput
      input={mockTextInput}
      value={value}
      onChange={mockOnChange}
      validationError={validationError}
    />,
  );

describe('TextCriterionInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders with correct label and placeholder', () => {
    renderInput();
    expect(
      screen.getByTestId('text-criterion-input-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('COMMON_SEARCH_CRITERION_LABEL'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('TEXT_PLACEHOLDER')).toBeInTheDocument();
  });

  it('reflects current value', () => {
    renderInput(mockTextScalarValue);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('shows validationError on the input', () => {
    renderInput(null, 'VALUE_REQUIRED');
    expect(screen.getByText('VALUE_REQUIRED')).toBeInTheDocument();
  });

  it.each([
    ['text entered', 'world', { value: 'world' }],
    ['input cleared', '', null],
  ] as [string, string, ScalarValue | null][])(
    'calls onChange when %s',
    (_, inputValue, expected) => {
      renderInput(mockTextScalarValue);
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: inputValue },
      });
      expect(mockOnChange).toHaveBeenCalledWith(expected);
    },
  );
});
