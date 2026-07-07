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

  it('renders combobox with ENTER_SEARCH_VALUE label', () => {
    renderInput();
    expect(
      screen.getByTestId('lookup-criterion-input-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('ENTER_SEARCH_VALUE')).toBeInTheDocument();
  });

  it('renders placeholder from input config', () => {
    renderInput();
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
