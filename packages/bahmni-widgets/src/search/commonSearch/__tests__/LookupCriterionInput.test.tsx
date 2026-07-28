import { render, screen } from '@testing-library/react';
import LookupCriterionInput from '../inputs/LookupCriterionInput';
import { ScalarValue } from '../models';
import {
  mockLookupInput,
  mockLookupScalarValue,
} from './__mocks__/lookupCriterionInputMocks';

const mockOnChange = jest.fn();

const renderInput = (
  value: ScalarValue | null = null,
  validationError: string | null = null,
) =>
  render(
    <LookupCriterionInput
      input={mockLookupInput}
      value={value}
      onChange={mockOnChange}
      validationError={validationError}
    />,
  );

describe('LookupCriterionInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders with correct label and placeholder', () => {
    renderInput();
    expect(
      screen.getByTestId('lookup-criterion-input-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('COMMON_SEARCH_CRITERION_LABEL'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('LOOKUP_PLACEHOLDER'),
    ).toBeInTheDocument();
  });

  it('reflects current value as selectedItem', () => {
    renderInput(mockLookupScalarValue);
    expect(screen.getByRole('combobox')).toHaveValue('selected-item');
  });

  it('shows validationError', () => {
    renderInput(null, 'VALUE_REQUIRED');
    expect(screen.getByText('VALUE_REQUIRED')).toBeInTheDocument();
  });
});
