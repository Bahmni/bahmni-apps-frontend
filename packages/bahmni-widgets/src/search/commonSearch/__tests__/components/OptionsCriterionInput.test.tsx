import { render, screen, fireEvent } from '@testing-library/react';
import OptionsCriterionInput from '../../components/OptionsCriterionInput';
import { ScalarValue } from '../../models';
import {
  mockOptionsInput,
  mockOptionsScalarValue,
} from '../__mocks__/optionsCriterionInputMocks';

const mockOnChange = jest.fn();

const renderInput = (
  value: ScalarValue | null = null,
  validationError: string | null = null,
) =>
  render(
    <OptionsCriterionInput
      input={mockOptionsInput}
      value={value}
      onChange={mockOnChange}
      validationError={validationError}
    />,
  );

describe('OptionsCriterionInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders with correct label and placeholder', () => {
    renderInput();
    expect(
      screen.getByTestId('options-criterion-input-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('COMMON_SEARCH_CRITERION_LABEL'),
    ).toBeInTheDocument();
    expect(screen.getByText('OPTIONS_PLACEHOLDER')).toBeInTheDocument();
  });

  it('shows validationError', () => {
    renderInput(null, 'VALUE_REQUIRED');
    expect(screen.getByText('VALUE_REQUIRED')).toBeInTheDocument();
  });

  it('pre-selects item matching current value', () => {
    renderInput(mockOptionsScalarValue);
    expect(screen.getByText('OPTION_ONE')).toBeInTheDocument();
  });

  it('calls onChange with ScalarValue when item is selected', () => {
    renderInput();
    fireEvent.click(screen.getByText('OPTIONS_PLACEHOLDER'));
    fireEvent.click(screen.getByText('OPTION_TWO'));
    expect(mockOnChange).toHaveBeenCalledWith({ value: 'two' });
  });
});
